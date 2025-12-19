// src/components/custom/postCard.tsx
"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import UserProfileMiniCard from "./userProfileMiniCard";
import { useRouter } from "next/navigation";
import PostCardCommentsContainer from "./postCardCommentsContainer";
import PostCardCommetsResponsesContainer from "./postCardCommetsResponsesContainer";
import { MessageCircle, MessageCircleOff } from "lucide-react";

export function PostCard({
    session,
    post,
}: {
    session: any;
    post: Post;
}) {
    const router = useRouter();
    const [showFullDesc, setShowFullDesc] = useState(false);

    const [expandedCommentId, setExpandedCommentId] = useState<number | null>(null);
    const toggleComment = (id: number) =>
        setExpandedCommentId((prev) => (prev === id ? null : id));

    const [newComment, setNewComment] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentMsg, setCommentMsg] = useState<string | null>(null);

    const [commentsExpanded, setCommentsExpanded] = useState(false);
    const commentRefs = useRef<Record<number, HTMLDivElement | null>>({});

    type LocalPostComment = PostComment & {
        __optimistic?: boolean;
        __error?: string | null;
    };

    // 🔹 post “vivo” que se va refrescando desde la API
    const [currentPost, setCurrentPost] = useState<Post>(post);

    // 🔹 si el padre llega a cambiar el post (otro render), sincronizamos
    useEffect(() => {
        setCurrentPost(post);
    }, [post.id]);

    // 🔹 estado local de comentarios (para optimistic + merges con servidor)
    const [localComments, setLocalComments] = useState<LocalPostComment[]>(
        (post.post_comment ?? []) as LocalPostComment[]
    );

    // 🔹 cuando cambian los comentarios del post refrescado, los mezclamos
    //    con los locales, sin perder user ni los comentarios optimistas
    useEffect(() => {
        setLocalComments((prev) => {
            const fromServer =
                (currentPost.post_comment ?? []) as LocalPostComment[];

            const prevById = new Map(prev.map((c) => [c.id, c]));

            const mergedFromServer = fromServer.map((c) => {
                const old = prevById.get(c.id);
                return {
                    ...old,
                    ...c,
                    // si el servidor no trae user, conservamos el anterior
                    user: c.user ?? old?.user ?? c.user,
                    __optimistic: false,
                    __error: null,
                };
            });

            const serverIds = new Set(fromServer.map((c) => c.id));

            const stillOptimistic = prev.filter(
                (c) => c.__optimistic && !serverIds.has(c.id)
            );

            return [...stillOptimistic, ...mergedFromServer];
        });
    }, [currentPost.post_comment, currentPost.id]);

    // 🔹 polling cada 10 segundos para refrescar el post desde la API
    useEffect(() => {
        if (!currentPost?.id) return;

        let cancelled = false;

        const fetchLatest = async () => {
            try {
                const res = await fetch(`/api/posts/${currentPost.id}`, {
                    method: "GET",
                    cache: "no-store",
                });

                if (!res.ok) return;

                const json = await res.json().catch(() => null);
                const fresh = json?.data as Post | undefined;
                if (!fresh) return;

                if (!cancelled) {
                    setCurrentPost(fresh);
                }
            } catch (err) {
                // opcional: console.error(err);
            }
        };

        // primer chequeo inmediato
        fetchLatest();

        const id = setInterval(fetchLatest, 10_000); // 10 segundos
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [currentPost?.id]);

    const scrollToComment = (id: number) => {
        setTimeout(() => {
            commentRefs.current[id]?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 30);
    };

    const sessionUserId = session?.user?.id ? Number(session.user.id) : null;
    const sessionUserName = session?.user?.name ?? "Tú";
    const sessionUserImageUrl = session?.user?.imageUrl ?? null;

    const canCreatePostComment =
        Boolean(session?.user?.id) && newComment.trim().length > 0 && !commentLoading;

    const submitPostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canCreatePostComment || sessionUserId == null) return;

        const content = newComment.trim();
        setNewComment("");
        setCommentMsg(null);

        const tempId = -Date.now();

        const optimistic: LocalPostComment = {
            id: tempId,
            post_id: currentPost.id, // 🔹 usamos currentPost
            comment: content,
            createdAt: new Date().toISOString(),
            who_comments: sessionUserId,
            active: 1,
            user: {
                id: sessionUserId,
                name: sessionUserName,
                imageUrl: sessionUserImageUrl,
            },
            responses: [],
            __optimistic: true,
            __error: null,
        };

        setCommentsExpanded(true);
        setExpandedCommentId(tempId);

        setLocalComments((prev) => [optimistic, ...prev]);

        scrollToComment(tempId);

        setCommentLoading(true);

        try {
            const res = await fetch("/api/post-comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ post_id: currentPost.id, comment: content }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || "No se pudo guardar el comentario");
            }

            const created = data?.data;
            const realId = created.id;

            setLocalComments((prev) =>
                prev.map((c) =>
                    c.id === tempId
                        ? {
                            ...c,
                            id: created.id,
                            createdAt: created.createdAt,
                            __optimistic: false,
                            __error: null,
                        }
                        : c
                )
            );

            setExpandedCommentId((prev) => (prev === tempId ? realId : prev));
            scrollToComment(realId);

            setCommentMsg("Comentario guardado ✅");
        } catch (err: any) {
            const msg = err?.message ?? "Error";
            setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
            setCommentMsg(msg);
        } finally {
            setCommentLoading(false);
        }
    };

    // ✅ Reglas visibility (seguro extra frontend)
    const viewerIdRaw = session?.user?.id;
    const viewerIdParsed =
        viewerIdRaw != null ? parseInt(String(viewerIdRaw), 10) : null;
    const viewerId =
        viewerIdParsed != null && Number.isFinite(viewerIdParsed)
            ? viewerIdParsed
            : null;

    const isOwner = viewerId !== null && viewerId === currentPost.user_id; // 🔹 currentPost

    const rel =
        currentPost.relations ?? {
            following: false,
            isFollower: false,
            isFriend: false,
        };

    const canView =
        isOwner ||
        currentPost.visibility === 1 ||
        (currentPost.visibility === 2 && viewerId !== null) ||
        (currentPost.visibility === 3 &&
            viewerId !== null &&
            (rel.isFriend || rel.following)) ||
        (currentPost.visibility === 4 && viewerId !== null && rel.isFriend);

    if (!canView) {
        const msg =
            currentPost.visibility === 2
                ? "Debes iniciar sesión para ver este post."
                : currentPost.visibility === 3
                    ? "Debes ser seguidor o amigo para poder ver este post."
                    : "Debes ser amigo para poder ver este post.";

        return (
            <div className="postCardActive">
                <div className="text-xs text-yellow-300">{msg}</div>
            </div>
        );
    }

    const desc = (currentPost.description ?? "").trim(); // 🔹 currentPost
    const shortDesc = useMemo(() => {
        if (!desc) return "Sin descripción (click para comentar)";
        if (desc.length <= 70) return desc;
        return desc.slice(0, 70) + "…";
    }, [desc]);

    const shownDesc = showFullDesc ? desc || "Sin descripción" : shortDesc;

    const activeCommentsCount = (localComments ?? []).filter(
        (c) => (c.active ?? 1) === 1
    ).length;

    return (
        <div
            className={
                currentPost.active === 0
                    ? "flex flex-col bg-black border-2 border-solid border-red-500 p-2 shadow-md w-full max-h-[200px] overflow-hidden text-gray-200"
                    : "postCardActive"
            }
        >
            {currentPost.active === 0 && (
                <span className="text-red-500">oculto</span>
            )}

            {currentPost.userData?.imageUrl && (
                <UserProfileMiniCard
                    session={session}
                    userId={currentPost.userData.id}
                    userName={currentPost.userData.name}
                    profileImageUrl={currentPost.userData.imageUrl}
                    following={rel.following}
                    isFollower={rel.isFollower}
                    isFriend={rel.isFriend}
                />
            )}

            <span className="text-[10px]">
                {formatDate(currentPost.createdAt)}
            </span>

            <Link href={`/showpost?post_id=${currentPost.id}`}>
                <h3 className="text-lg font-semibold mt-2">
                    {currentPost.title}
                </h3>
            </Link>

            {currentPost.images && currentPost.images.length > 0 && (
                <div className="flex flex-row flex-wrap justify-between gap-3">
                    {currentPost.images.map((img, index) =>
                        img ? (
                            <div
                                key={`${img.post_id}-${img.id}-${img.index}-${index}`}
                                className={
                                    index === 0
                                        ? "flex flex-row gap-2 bg-black relative w-full aspect-square overflow-hidden border border-blue-500 rounded-[8px]"
                                        : "flex flex-row gap-2 bg-black relative w-[48%] aspect-square overflow-hidden border border-blue-500 rounded-[8px]"
                                }
                            >
                                <div
                                    onDoubleClick={() =>
                                        router.push(
                                            `/showpost?post_id=${currentPost.id}`
                                        )
                                    }
                                    className="relative w-full h-full cursor-zoom-in select-none"
                                >
                                    <Image
                                        src={img.imageUrl}
                                        alt={`Imagen ${index}`}
                                        fill
                                        sizes="100vw"
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        ) : null
                    )}
                </div>
            )}

            <pre
                onClick={() => setShowFullDesc((v) => !v)}
                title={
                    showFullDesc
                        ? "Click para contraer"
                        : "Click para ver completo"
                }
                className="mt-2 text-gray-200 w-full whitespace-pre-wrap break-words cursor-pointer select-none"
            >
                {shownDesc}
            </pre>

            {/* Botón para expandir/cerrar comentarios */}
            <button
                type="button"
                onClick={() => setCommentsExpanded((v) => !v)}
                className="mt-3 text-xs text-gray-300 hover:text-gray-200 select-none w-fit"
            >
                {commentsExpanded ? (
                    <div className="flex flex-row">
                        <MessageCircleOff className="w-6 h-6 text-gray-400 hover:text-gray-100" />
                        <span>{activeCommentsCount}</span>
                    </div>
                ) : (
                    <div className="flex flex-row">
                        <MessageCircle className="w-6 h-6 text-gray-400 hover:text-gray-100" />
                        <span>{activeCommentsCount}</span>
                    </div>
                )}
            </button>

            {/* Contenedor de comentarios */}
            {commentsExpanded && (
                <PostCardCommentsContainer
                    session={session}
                    sessionUserId={sessionUserId}
                    localComments={localComments}
                    setLocalComments={setLocalComments}
                    expandedCommentId={expandedCommentId}
                    onToggleComment={toggleComment}
                    commentRefs={commentRefs}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    canCreatePostComment={canCreatePostComment}
                    commentLoading={commentLoading}
                    commentMsg={commentMsg}
                    submitPostComment={submitPostComment}
                    PostCardCommetsResponsesContainer={
                        PostCardCommetsResponsesContainer
                    }
                />
            )}
        </div>
    );
}

