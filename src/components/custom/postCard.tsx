//postCard.tsx
"use client";
import { useMemo, useRef, useState } from "react";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import UserProfileMiniCard from "./userProfileMiniCard";
import { useRouter } from "next/navigation";
import PostCardCommentsContainer from "./postCardCommentsContainer";
import PostCardCommetsResponsesContainer from "./postCardCommetsResponsesContainer";

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



    useEffect(() => {
        setLocalComments((post.post_comment ?? []) as LocalPostComment[]);
    }, [post.id]); // o [post.post_comment]


    const scrollToComment = (id: number) => {
        setTimeout(() => {
            commentRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 30);
    };

    type LocalPostComment = PostComment & {
        __optimistic?: boolean;
        __error?: string | null;
    };

    const [localComments, setLocalComments] = useState<LocalPostComment[]>(
        (post.post_comment ?? []) as LocalPostComment[]
    );

    const sessionUserId = session?.user?.id ? Number(session.user.id) : null;

    // opcional: si tenés el nombre en session
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

        // id temporal negativo
        const tempId = -Date.now();

        const optimistic: LocalPostComment = {
            id: tempId,
            post_id: post.id,
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
        // ✅ auto-expand comentarios cuando comentás
        setCommentsExpanded(true);

        // (opcional) expandir ese comentario recién creado
        setExpandedCommentId(tempId);

        // ✅ aparece instantáneo arriba
        setLocalComments((prev) => [optimistic, ...prev]);

        // ✅ scroll al comentario nuevo
        scrollToComment(tempId);

        setCommentLoading(true);

        try {
            const res = await fetch("/api/post-comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ post_id: post.id, comment: content }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || "No se pudo guardar el comentario");
            }

            // ✅ reemplazar temp por el real que viene del server
            const created = data?.data; // { id, createdAt, post_id, who_comments, comment }

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
            // ✅ mantener el “expand” apuntando al id real
            setExpandedCommentId((prev) => (prev === tempId ? realId : prev));

            // ✅ scroll al id real (por si el key cambió)
            scrollToComment(realId);

            setCommentMsg("Comentario guardado ✅");
        } catch (err: any) {
            const msg = err?.message ?? "Error";

            // ❌ si falla: eliminamos el optimistic (o podés marcarlo como error)
            setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
            setCommentMsg(msg);
        } finally {
            setCommentLoading(false);
        }
    };

    // ✅ Reglas visibility (seguro extra frontend)
    const viewerIdRaw = session?.user?.id;
    const viewerIdParsed = viewerIdRaw != null ? parseInt(String(viewerIdRaw), 10) : null;
    const viewerId = viewerIdParsed != null && Number.isFinite(viewerIdParsed) ? viewerIdParsed : null;

    const isOwner = viewerId !== null && viewerId === post.user_id;

    const rel = post.relations ?? { following: false, isFollower: false, isFriend: false };

    const canView =
        isOwner ||
        post.visibility === 1 ||
        (post.visibility === 2 && viewerId !== null) ||
        (post.visibility === 3 && viewerId !== null && (rel.isFriend || rel.following)) ||
        (post.visibility === 4 && viewerId !== null && rel.isFriend);

    if (!canView) {
        const msg =
            post.visibility === 2
                ? "Debes iniciar sesión para ver este post."
                : post.visibility === 3
                    ? "Debes ser seguidor o amigo para poder ver este post."
                    : "Debes ser amigo para poder ver este post.";

        return (
            <div className="postCardActive">
                <div className="text-xs text-yellow-300">{msg}</div>
            </div>
        );
    }

    const desc = (post.description ?? "").trim();
    const shortDesc = useMemo(() => {
        if (!desc) return "Sin descripción (click para comentar)";
        if (desc.length <= 70) return desc;
        return desc.slice(0, 70) + "…";
    }, [desc]);

    const shownDesc = showFullDesc ? (desc || "Sin descripción") : shortDesc;


    const activeCommentsCount = (localComments ?? [])
        .filter((c) => (c.active ?? 1) === 1)
        .length;

    const commentsLabel =
        activeCommentsCount === 1
            ? "Ver 1 comentario"
            : `Ver ${activeCommentsCount} comentarios`;

    return (
        <div className={post.active === 0 ? "flex flex-col bg-black border-2 border-solid border-red-500 p-2 shadow-md w-full max-h-[200px] overflow-hidden text-gray-200" : "postCardActive"}>
            {post.active === 0 && <span className="text-red-500">oculto</span>}

            {post.userData?.imageUrl && (
                <UserProfileMiniCard
                    session={session}
                    userId={post.userData.id}
                    userName={post.userData.name}
                    profileImageUrl={post.userData.imageUrl}
                    following={post.relations.following}
                    isFollower={post.relations.isFollower}
                    isFriend={post.relations.isFriend}
                />
            )}

            <span className="text-[10px]">{formatDate(post.createdAt)}</span>

            <Link href={`/showpost?post_id=${post.id}`}>
                <h3 className="text-lg font-semibold mt-2">{post.title}</h3>
            </Link>

            {post.images && post.images.length > 0 && (
                <div className="flex flex-row flex-wrap justify-between gap-3">
                    {post.images.map((img, index) =>
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
                                    onDoubleClick={() => router.push(`/showpost?post_id=${post.id}`)}
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
                title={showFullDesc ? "Click para contraer" : "Click para ver completo"}
                className="mt-2 text-gray-200 w-full whitespace-pre-wrap break-words cursor-pointer select-none"
            >
                {shownDesc}
            </pre>
            <button
                type="button"
                onClick={() => setCommentsExpanded((v) => !v)}
                className="mt-3 text-xs text-gray-300 hover:text-gray-200 select-none"
            >
                {commentsExpanded ? "Ocultar comentarios" : commentsLabel}
            </button>

            {showFullDesc && (
                <div className="mt-3">
                    {sessionUserId != null ? (
                        <form onSubmit={submitPostComment} className="space-y-2">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={3}
                                placeholder="Escribí un comentario..."
                                className="w-full rounded-md bg-neutral-900 text-gray-100 border border-neutral-700 p-2 outline-none focus:border-neutral-500"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={!canCreatePostComment}
                                    className="px-3 py-1.5 rounded-md bg-neutral-800 text-gray-100 border border-neutral-700 disabled:opacity-50"
                                >
                                    {commentLoading ? "Guardando..." : "Comentar"}
                                </button>

                                {commentMsg && (
                                    <span className={commentMsg.includes("✅") ? "text-green-400 text-sm" : "text-red-400 text-sm"}>
                                        {commentMsg}
                                    </span>
                                )}
                            </div>
                        </form>
                    ) : (
                        <div className="text-sm text-gray-400">Iniciá sesión para comentar.</div>
                    )}
                </div>
            )}
            {commentsExpanded && (
                <div className="mt-3 flex flex-col gap-3 max-h-[500px] overflow-y-auto">
                    {localComments
                        .filter((c) => (c.active ?? 1) === 1)
                        .map((comment) => (
                            <div
                                key={comment.id}
                                ref={(el) => {
                                    commentRefs.current[comment.id] = el;
                                }}
                                className="border border-neutral-800 rounded-md p-2 scroll-mt-24"
                            >
                                {comment.__optimistic && (
                                    <div className="text-[11px] text-gray-400 mb-1">Enviando…</div>
                                )}

                                <PostCardCommentsContainer
                                    disabled={Boolean(comment.__optimistic)}
                                    onClickExpand={() => toggleComment(comment.id)}
                                    showFullDesc={expandedCommentId === comment.id}
                                    shownDesc={comment.comment}
                                    isLogged={Boolean(session?.user?.id)}
                                    sessionUserId={sessionUserId}
                                    commentId={comment.id}
                                    commentUser={comment.user} // ✅ avatar + nombre
                                />

                                <PostCardCommetsResponsesContainer
                                    commentId={comment.id}
                                    responses={comment.responses ?? []}
                                    isLogged={Boolean(session?.user?.id)}
                                    sessionUserId={sessionUserId}
                                    sessionUserName={session?.user?.name ?? null}
                                    sessionUserImageUrl={session?.user?.imageUrl ?? null}
                                    disabled={Boolean(comment.__optimistic)}
                                    autoExpandOnNew
                                    autoScrollOnNew
                                />
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}

