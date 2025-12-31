// src/components/custom/postCard.tsx
"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import UserProfileMiniCard from "./userProfileMiniCard";
import { useRouter } from "next/navigation";
import PostCardCommentsContainer from "./postCardCommentsContainer";
import PostCardCommentsResponsesContainer from "./postCardCommetsResponsesContainer";
import {
    MessageCircle,
    MessageCircleOff,
    ThumbsUp,
    ThumbsDown,
    Pencil,
    EyeOffIcon,
    EyeIcon,
    Earth,
    UserCheck,
    Footprints,
    Handshake,
    Trash2
} from "lucide-react";
import PostImageCard from "./PostImageCard";
import { ImagesSwiper } from "./ImagesSwiper";
import {
    updatePostActive,
    updatePostVisibility,
    softDeletePost, // 🆕
} from "@/actions/post-action";



export function PostCard({
    session,
    post,
    variant = "card",
    openCommentsInPage = false,
    enablePolling = false,
    enableOwnerControls = false,
    onOpenDetail,
    comingFrom,
}: {
    session: any;
    post: Post;
    variant?: "card" | "detail";
    openCommentsInPage?: boolean;
    enablePolling?: boolean;
    enableOwnerControls?: boolean;
    onOpenDetail?: (postId: number) => void;
    comingFrom?: "mywall" | "wall" | "home";
}) {
    const router = useRouter();
    const [showFullDesc, setShowFullDesc] = useState(false);

    const [expandedCommentId, setExpandedCommentId] = useState<number | null>(
        null
    );
    const toggleComment = (id: number) =>
        setExpandedCommentId((prev) => (prev === id ? null : id));

    const [newComment, setNewComment] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentMsg, setCommentMsg] = useState<string | null>(null);

    const [commentsExpanded, setCommentsExpanded] = useState(false);
    const handleCommentsClick = () => {
        if (onOpenDetail) {
            onOpenDetail(currentPost.id);
            return;
        }
        setCommentsExpanded((v) => !v);
    };

    const commentRefs = useRef<Record<number, HTMLDivElement | null>>({});

    type LocalPostComment = PostComment & {
        __optimistic?: boolean;
        __error?: string | null;
    };

    // 🔹 post “vivo” que se actualiza desde la API
    const [currentPost, setCurrentPost] = useState<Post>(post);

    // 🔹 owner toolbar state
    const [visibilityMenu, setVisibilityMenu] = useState(false);
    const [ownerActionsLoading, setOwnerActionsLoading] = useState(false);

    const [showDeletePopup, setShowDeletePopup] = useState(false); // 🆕
    const [deleteLoading, setDeleteLoading] = useState(false);     // 🆕


    useEffect(() => {
        setCurrentPost(post);
        console.log("post en postCardxx:", currentPost);
    }, [post.id]);

    // 🔹 estado local de comentarios
    const [localComments, setLocalComments] = useState<LocalPostComment[]>(
        (post.post_comment ?? []) as LocalPostComment[]
    );

    useEffect(() => {
        setLocalComments((prev) => {
            const fromServer = (currentPost.post_comment ?? []) as LocalPostComment[];

            const prevById = new Map(prev.map((c) => [c.id, c]));

            const mergedFromServer = fromServer.map((c) => {
                const old = prevById.get(c.id);
                return {
                    ...old,
                    ...c,
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

    // 🔹 polling cada 30 segundos para refrescar el post
    useEffect(() => {
        if (!currentPost?.id || !enablePolling) return;

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
            } catch {
                // opcional log
            }
        };

        fetchLatest();
        const id = setInterval(fetchLatest, 30_000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [currentPost?.id, enablePolling]);

    const scrollToComment = (_id: number) => {
        // si después querés, reactivás el scroll suave
    };

    const sessionUserId = session?.user?.id ? Number(session.user.id) : null;
    const sessionUserName = session?.user?.name ?? "Tú";
    const sessionUserImageUrl = session?.user?.imageUrl ?? null;

    const canCreatePostComment =
        Boolean(session?.user?.id) &&
        newComment.trim().length > 0 &&
        !commentLoading;

    const submitPostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canCreatePostComment || sessionUserId == null) return;

        const content = newComment.trim();
        setNewComment("");
        setCommentMsg(null);

        const tempId = -Date.now();

        const optimistic: LocalPostComment = {
            id: tempId,
            post_id: currentPost.id,
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
                body: JSON.stringify({
                    post_id: currentPost.id,
                    comment: content,
                }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    data?.error || "No se pudo guardar el comentario"
                );
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

            setExpandedCommentId((prev) =>
                prev === tempId ? realId : prev
            );
            scrollToComment(realId);

            setCommentMsg("Comentario guardado ✅");
        } catch (err: any) {
            const msg = err?.message ?? "Error";
            setLocalComments((prev) =>
                prev.filter((c) => c.id !== tempId)
            );
            setCommentMsg(msg);
        } finally {
            setCommentLoading(false);
        }
    };

    // ✅ reglas de visibilidad
    const viewerIdRaw = session?.user?.id;
    const viewerIdParsed =
        viewerIdRaw != null ? parseInt(String(viewerIdRaw), 10) : null;
    const viewerId =
        viewerIdParsed != null && Number.isFinite(viewerIdParsed)
            ? viewerIdParsed
            : null;

    const isOwner =
        viewerId !== null && viewerId === currentPost.user_id;

    const isDeleted = Boolean((currentPost as any).deletedAt); // 🆕

    const rel =
        currentPost.relations ?? {
            following: false,
            isFollower: false,
            likesCount: 0,
            unlikesCount: 0,
            userReaction: null,
        };


    // ⭐ Estado local de reacción y contadores
    const [postReaction, setPostReaction] =
        useState<Reaction>(rel.userReaction ?? null);
    const [likesCount, setLikesCount] = useState<number>(
        rel.likesCount ?? 0
    );
    const [unlikesCount, setUnlikesCount] = useState<number>(
        rel.unlikesCount ?? 0
    );

    useEffect(() => {
        const r = currentPost.relations as PostRelations | undefined;

        setPostReaction(r?.userReaction ?? null);
        setLikesCount(r?.likesCount ?? 0);
        setUnlikesCount(r?.unlikesCount ?? 0);
    }, [
        currentPost.id,
        currentPost.relations?.userReaction,
        currentPost.relations?.likesCount,
        currentPost.relations?.unlikesCount,
    ]);

    const [reactionLoading, setReactionLoading] = useState(false);
    const canReact = Boolean(sessionUserId) && !reactionLoading;

    const updateCountsOptimistic = (
        prev: Reaction,
        next: Reaction
    ) => {
        setLikesCount((prevLikes) => {
            let v = prevLikes;
            if (prev === "LIKE") v -= 1;
            if (next === "LIKE") v += 1;
            return v < 0 ? 0 : v;
        });

        setUnlikesCount((prevUnlikes) => {
            let v = prevUnlikes;
            if (prev === "UNLIKE") v -= 1;
            if (next === "UNLIKE") v += 1;
            return v < 0 ? 0 : v;
        });
    };

    const sendReaction = async (next: Reaction) => {
        if (!canReact || !currentPost.id) return;

        const prev = postReaction;

        setPostReaction(next);
        updateCountsOptimistic(prev, next);
        setReactionLoading(true);

        try {
            const res = await fetch(
                `/api/posts/${currentPost.id}/reaction`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: next }),
                }
            );

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                updateCountsOptimistic(next, prev);
                setPostReaction(prev);
                console.error(data?.error || "Error en reacción");
                return;
            }

            if (data?.counts) {
                setLikesCount(data.counts.likes ?? 0);
                setUnlikesCount(data.counts.unlikes ?? 0);
            }
            if (typeof data?.userReaction !== "undefined") {
                setPostReaction(data.userReaction as Reaction);
            }
        } catch (err) {
            updateCountsOptimistic(next, prev);
            setPostReaction(prev);
            console.error(err);
        } finally {
            setReactionLoading(false);
        }
    };

    const handleLike = () => {
        const next: Reaction =
            postReaction === "LIKE" ? null : "LIKE";
        sendReaction(next);
    };

    const handleUnlike = () => {
        const next: Reaction =
            postReaction === "UNLIKE" ? null : "UNLIKE";
        sendReaction(next);
    };

    // 👇 calculamos desc + useMemo ANTES de cualquier return condicional
    const desc = (currentPost.description ?? "").trim();

    const shortDesc = useMemo(() => {
        if (!desc) return "Sin descripción (click para comentar)";
        if (desc.length <= 70) return desc;
        return desc.slice(0, 70) + "…";
    }, [desc]);

    const shownDesc =
        showFullDesc ? desc || "Sin descripción" : shortDesc;

    const activeCommentsCount = (() => {
        const activeLocal = (localComments ?? []).filter(
            (c) => (c.active ?? 1) === 1
        ).length;
        if (activeLocal > 0) return activeLocal;

        const fromPost: any = (currentPost as any).commentsCount;
        return typeof fromPost === "number" ? fromPost : 0;
    })();

    // 🔹 IMÁGENES ORDENADAS + ARRAY PARA SWIPER (useMemo ANTES de los returns)
    const sortedImages = useMemo(
        () =>
            (currentPost.images ?? [])
                .filter((img) => !!img && !!img.imageUrl)
                .slice()
                .sort(
                    (a, b) => (a.index ?? 0) - (b.index ?? 0)
                ),
        [currentPost.images]
    );

    // 💡 Helpers owner toolbar
    const handleToggleActiveOwner = async () => {
        if (!enableOwnerControls || !isOwner) return;

        const prevActive = currentPost.active ?? 1;
        const nextActive = prevActive === 1 ? 0 : 1;

        setOwnerActionsLoading(true);
        try {
            await updatePostActive(currentPost.id, nextActive);
            setCurrentPost((prev) =>
                prev
                    ? ({ ...prev, active: nextActive } as Post)
                    : prev
            );
        } catch (err) {
            console.error("Error al actualizar active:", err);
        } finally {
            setOwnerActionsLoading(false);
        }
    };

    const handleChangeVisibilityOwner = async (
        value: PostVisibility
    ) => {
        if (!enableOwnerControls || !isOwner) return;

        setOwnerActionsLoading(true);
        try {
            await updatePostVisibility(currentPost.id, value);
            setCurrentPost((prev) =>
                prev
                    ? ({ ...prev, visibility: value } as Post)
                    : prev
            );
            setVisibilityMenu(false);
        } catch (err) {
            console.error("Error al actualizar visibility:", err);
        } finally {
            setOwnerActionsLoading(false);
        }
    };

    const handleSoftDeleteOwner = async () => {
        if (!enableOwnerControls || !isOwner) return;
        setDeleteLoading(true);
        try {
            const res = await softDeletePost(currentPost.id);
            if (res?.error) {
                console.error(res.error);
            } else {
                setCurrentPost((prev) =>
                    prev
                        ? ({
                            ...prev,
                            deletedAt: new Date().toISOString(),
                        } as Post)
                        : prev
                );
            }
            setShowDeletePopup(false);
        } catch (err) {
            console.error("Error al eliminar (soft) post:", err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const isActive = (currentPost.active ?? 1) === 1;

    // SOLO PARA DEBUG luego QUITAR – también ANTES de los returns
    useEffect(() => {
        console.log(
            "DEBUG images para post",
            currentPost.id,
            "viewerId",
            viewerId,
            "isOwner",
            isOwner,
            currentPost.images
        );
    }, [currentPost.id, viewerId, isOwner, currentPost.images]);

    // 👇 OJO: canView SIN !isDeleted, así el dueño ve igual si está eliminado
    const canView =
        isOwner ||
        currentPost.visibility === 1 ||
        (currentPost.visibility === 2 && viewerId !== null) ||
        (currentPost.visibility === 3 &&
            viewerId !== null &&
            (rel.relState === 8 || rel.following)) ||
        (currentPost.visibility === 4 &&
            viewerId !== null &&
            rel.relState === 8);

    // 🆕 Si está eliminado y NO es el dueño: mensaje corto y chau
    if (isDeleted && !isOwner) {
        return (
            <div className="w-full rounded-lg bg-slate-900 border border-slate-800 shadow-sm px-3 py-2 text-slate-100">
                <div className="text-xs text-red-300">
                    Este post fue eliminado por su autor.
                </div>
            </div>
        );
    }

    // Si no cumple visibilidad
    if (!canView) {
        const msg =
            currentPost.visibility === 2
                ? "Debes iniciar sesión para ver este post."
                : currentPost.visibility === 3
                    ? "Debes ser seguidor o amigo para poder ver este post."
                    : "Debes ser amigo para poder ver este post.";

        return (
            <div className="w-full rounded-lg bg-slate-900 border border-slate-800 shadow-sm px-3 py-2 text-slate-100">
                <div className="text-xs text-yellow-300">{msg}</div>
            </div>
        );
    }


    return (
        <div
            className={
                isDeleted
                    ? "w-full rounded-lg bg-[rgb(64,20,20)] border border-red-600 shadow-sm px-3 py-2 text-red-100"
                    : isActive
                        ? "w-full rounded-lg bg-slate-900 border border-slate-800 shadow-sm px-3 py-2 text-slate-100"
                        : "w-full rounded-lg bg-black border-2 border-red-500 px-3 py-2 shadow-md max-h-[200px] overflow-hidden text-gray-200"
            }
        >
            {/* etiquetas de estado */}
            {!isDeleted && !isActive && (
                <span className="text-red-500 text-xs uppercase mb-1">
                    oculto
                </span>
            )}
            {isDeleted && (
                <span className="text-red-300 text-xs uppercase mb-1">
                    eliminado (en papelera)
                </span>
            )}

            {/* === TOOLBAR DE DUEÑO (MyWall) === */}
            {enableOwnerControls && isOwner && !isDeleted && comingFrom === "mywall" && (
                <div className="mb-2 flex flex-row items-center gap-2 w-full h-6 text-white bg-[rgb(62,62,62)] px-3 py-1 rounded-md">
                    {/* Editar */}
                    <Link
                        href={`/editpost?post_id=${currentPost.id}`}
                        className="flex flex-row items-center justify-center h-5 pr-2 hover:text-sky-300 transition-colors text-xs"
                    >
                        <Pencil size={12} />
                        <span className="ml-1">Editar</span>
                    </Link>

                    {/* Ocultar / mostrar */}
                    <button
                        type="button"
                        onClick={handleToggleActiveOwner}
                        disabled={ownerActionsLoading}
                        className="flex flex-row items-center h-5 gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                    >
                        {isActive ? (
                            <>
                                <EyeOffIcon size={12} />
                                <span>Ocultar</span>
                            </>
                        ) : (
                            <>
                                <EyeIcon size={12} />
                                <span>Mostrar</span>
                            </>
                        )}
                    </button>

                    {/* Eliminar => marca deletedAt (soft delete) */}
                    <button
                        type="button"
                        onClick={() => setShowDeletePopup(true)}
                        disabled={ownerActionsLoading}
                        className="flex flex-row items-center h-5 gap-1 text-[11px] px-2 py-1 rounded bg-red-800 border border-red-500 hover:bg-red-700 disabled:opacity-50"
                    >
                        <Trash2 size={12} />
                        <span>Eliminar</span>
                    </button>

                    {/* Menú visibilidad */}
                    <div className="relative ml-auto">
                        <button
                            type="button"
                            onClick={() =>
                                setVisibilityMenu((v) => !v)
                            }
                            disabled={ownerActionsLoading}
                            className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-800 border border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                        >
                            {currentPost.visibility === 1 && (
                                <Earth size={16} />
                            )}
                            {currentPost.visibility === 2 && (
                                <UserCheck size={16} />
                            )}
                            {currentPost.visibility === 3 && (
                                <div className="flex flex-row gap-0.5">
                                    <Footprints size={16} />
                                    <Handshake size={16} />
                                </div>
                            )}
                            {currentPost.visibility === 4 && (
                                <Handshake size={16} />
                            )}
                        </button>

                        {visibilityMenu && (
                            <div className="absolute right-0 mt-2 w-72 bg-black text-slate-100 border border-slate-700 rounded-lg shadow-lg z-50 text-xs">
                                <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 rounded-t-lg"
                                    onClick={() =>
                                        handleChangeVisibilityOwner(1)
                                    }
                                >
                                    <Earth size={16} />
                                    <span>
                                        Lo puede ver todo el mundo
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                    onClick={() =>
                                        handleChangeVisibilityOwner(2)
                                    }
                                >
                                    <UserCheck size={16} />
                                    <span>
                                        Sólo usuarios logueados
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                    onClick={() =>
                                        handleChangeVisibilityOwner(3)
                                    }
                                >
                                    <Footprints size={16} />
                                    <Handshake size={16} />
                                    <span>
                                        Seguidores y amigos
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 rounded-b-lg"
                                    onClick={() =>
                                        handleChangeVisibilityOwner(4)
                                    }
                                >
                                    <Handshake size={16} />
                                    <span>Sólo amigos</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toolbar cuando está eliminado (solo dueño)*/}
            {enableOwnerControls && isOwner && isDeleted && (
                <div className="mb-2 flex flex-row items-center gap-2 w-full text-red-200 bg-[rgb(64,20,20)] px-3 py-1 rounded-md">
                    <span className="text-xs font-semibold">
                        Este post está en la papelera (deletedAt tiene valor).
                    </span>
                    {/* más adelante acá podés poner "Restaurar" / "Eliminar definitivamente" */}
                </div>
            )}

            {/* Popup de confirmación de eliminación */}
            {showDeletePopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-w-sm w-[90%]">
                        <h4 className="text-sm font-semibold mb-2">
                            Eliminar post
                        </h4>
                        <p className="text-xs text-slate-300 mb-4">
                            ¿Seguro que querés eliminar este post?
                            {" "}
                            No se borrará definitivamente de la base de datos,
                            sólo se marcará como eliminado (se podrá gestionar
                            luego desde la papelera de reciclaje).
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowDeletePopup(false)}
                                disabled={deleteLoading}
                                className="px-3 py-1 text-xs rounded border border-slate-600 hover:bg-slate-800 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSoftDeleteOwner}
                                disabled={deleteLoading}
                                className="px-3 py-1 text-xs rounded bg-red-700 hover:bg-red-600 border border-red-500 text-white disabled:opacity-50"
                            >
                                {deleteLoading ? "Eliminando..." : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== HEADER (usuario + fecha + título) ====== */}
            {currentPost.user && (
                <UserProfileMiniCard
                    session={session}
                    userId={currentPost.user.id}
                    userName={currentPost.user.name}
                    profileImageUrl={currentPost.user.imageUrl ? currentPost.user.imageUrl : currentPost.user.image ? currentPost.user.image : null}
                    following={currentPost.relations.following}
                    isFollower={currentPost.relations.isFollower}
                    relState={currentPost.relations.relState} // 👈
                />

            )}

            <div className="text-[10px] h-[6px]">
                {formatDate(currentPost.createdAt)}
            </div>

            <h3
                className={
                    "text-lg font-semibold mt-2" +
                    (onOpenDetail ? " cursor-pointer hover:text-sky-300" : "")
                }
                onClick={() => {
                    if (onOpenDetail) {
                        onOpenDetail(currentPost.id);
                    }
                }}
            >
                {currentPost.title}
            </h3>


            {/* ====== LAYOUT PRINCIPAL ====== */}
            {variant === "detail" ? (
                sortedImages.length === 0 ? (
                    // 📌 Vista detalle SIN imágenes: todo en una columna
                    <div className="mt-3 flex flex-col gap-4">
                        {/* Descripción + reacciones */}
                        <section className="w-full flex flex-col gap-2">
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

                            {/* ⭐ Reacciones del post (like / unlike) */}
                            <div className="mt-2 flex flex-row items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleLike}
                                    disabled={!canReact}
                                    className={`flex flex-row items-center gap-1 text-xs px-2 py-1 rounded border ${postReaction === "LIKE"
                                        ? "bg-green-700 border-green-400 text-white"
                                        : "bg-transparent border-gray-500 text-gray-300"
                                        } ${!canReact
                                            ? "opacity-50 cursor-not-allowed"
                                            : "cursor-pointer"
                                        }`}
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    <span>{likesCount}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleUnlike}
                                    disabled={!canReact}
                                    className={`flex flex-row items-center gap-1 text-xs px-2 py-1 rounded border ${postReaction === "UNLIKE"
                                        ? "bg-red-700 border-red-400 text-white"
                                        : "bg-transparent border-gray-500 text-gray-300"
                                        } ${!canReact
                                            ? "opacity-50 cursor-not-allowed"
                                            : "cursor-pointer"
                                        }`}
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                    <span>{unlikesCount}</span>
                                </button>
                            </div>
                        </section>

                        {/* Comentarios debajo de la descripción */}
                        <section
                            id="comments"
                            className="w-full border-t border-neutral-800 pt-3 pb-[100px]"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400">
                                    Comentarios ({activeCommentsCount})
                                </span>
                            </div>

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
                                    PostCardCommentsResponsesContainer
                                }
                            />
                        </section>
                    </div>
                ) : (
                    // 📌 Vista detalle CON imágenes: columnas (post izquierda, comentarios derecha)
                    <div className="mt-3 flex flex-col md:flex-row gap-4">
                        {/* Columna izquierda: imágenes + descripción + reacciones */}
                        <section className="md:w-2/3 w-full flex flex-col gap-2">
                            {sortedImages.length === 1 && (
                                <PostImageCard
                                    image={sortedImages[0]}
                                    sessionUserId={sessionUserId}
                                    isFirst={true}
                                />
                            )}

                            {sortedImages.length > 1 && (
                                <ImagesSwiper
                                    id={`post-${currentPost.id}`}
                                    imageArray={sortedImages as any}
                                    sessionUserId={sessionUserId}
                                    navigation="thumbnails"
                                />
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

                            {/* ⭐ Reacciones del post (like / unlike) */}
                            <div className="mt-2 flex flex-row items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleLike}
                                    disabled={!canReact}
                                    className={`flex flex-row items-center gap-1 text-xs px-2 py-1 rounded border ${postReaction === "LIKE"
                                        ? "bg-green-700 border-green-400 text-white"
                                        : "bg-transparent border-gray-500 text-gray-300"
                                        } ${!canReact
                                            ? "opacity-50 cursor-not-allowed"
                                            : "cursor-pointer"
                                        }`}
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    <span>{likesCount}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleUnlike}
                                    disabled={!canReact}
                                    className={`flex flex-row items-center gap-1 text-xs px-2 py-1 rounded border ${postReaction === "UNLIKE"
                                        ? "bg-red-700 border-red-400 text-white"
                                        : "bg-transparent border-gray-500 text-gray-300"
                                        } ${!canReact
                                            ? "opacity-50 cursor-not-allowed"
                                            : "cursor-pointer"
                                        }`}
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                    <span>{unlikesCount}</span>
                                </button>
                            </div>
                        </section>

                        {/* Columna derecha: comentarios */}
                        <aside
                            id="comments"
                            className="md:w-1/3 w-full md:border-l border-neutral-800 md:pl-3 md:h-screen overflow-y-scroll h-fit pb-[100px]"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400">
                                    Comentarios ({activeCommentsCount})
                                </span>
                            </div>

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
                                    PostCardCommentsResponsesContainer
                                }
                            />
                        </aside>
                    </div>
                )
            ) : (
                // 📌 Vista card (home / mywall): apilado
                <>
                    {sortedImages.length === 1 && (
                        <div className="flex flex-row flex-wrap justify-between gap-3">
                            <PostImageCard
                                image={sortedImages[0]}
                                sessionUserId={sessionUserId}
                                isFirst={true}
                            />
                        </div>
                    )}

                    {sortedImages.length > 1 && (
                        <ImagesSwiper
                            id={`post-${currentPost.id}`}
                            imageArray={sortedImages as any}
                            sessionUserId={sessionUserId}
                            navigation="thumbnails"
                        />
                    )}

                    <pre
                        onClick={() =>
                            setShowFullDesc((v) => !v)
                        }
                        title={
                            showFullDesc
                                ? "Click para contraer"
                                : "Click para ver completo"
                        }
                        className="mt-2 text-gray-200 w-full whitespace-pre-wrap break-words cursor-pointer select-none"
                    >
                        {shownDesc}
                    </pre>

                    {/* ⭐ Reacciones del post (like / unlike) */}
                    <div className="mt-2 flex flex-row items-center gap-3">
                        <button
                            type="button"
                            onClick={handleLike}
                            disabled={!canReact}
                            className={`flex flex-row items-center gap-1 text-xs px-2 py-1 rounded border ${postReaction === "LIKE"
                                ? "bg-green-700 border-green-400 text-white"
                                : "bg-transparent border-gray-500 text-gray-300"
                                } ${!canReact
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                        >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{likesCount}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleUnlike}
                            disabled={!canReact}
                            className={`flex flex-row items-center gap-1 text-xs px-2 py-1 rounded border ${postReaction === "UNLIKE"
                                ? "bg-red-700 border-red-400 text-white"
                                : "bg-transparent border-gray-500 text-gray-300"
                                } ${!canReact
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                        >
                            <ThumbsDown className="w-4 h-4" />
                            <span>{unlikesCount}</span>
                        </button>
                    </div>

                    {/* Botón de comentarios + contenedor inline */}
                    <button
                        type="button"
                        onClick={handleCommentsClick}
                        className="mt-3 text-xs text-gray-300 hover:text-gray-200 select-none w-fit"
                    >
                        {openCommentsInPage ? (
                            <div className="flex flex-row">
                                <MessageCircle className="w-6 h-6 text-gray-400 hover:text-gray-100" />
                                <span>{activeCommentsCount}</span>
                            </div>
                        ) : commentsExpanded ? (
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

                    {!openCommentsInPage && commentsExpanded && (
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
                            canCreatePostComment={
                                canCreatePostComment
                            }
                            commentLoading={commentLoading}
                            commentMsg={commentMsg}
                            submitPostComment={submitPostComment}
                            PostCardCommetsResponsesContainer={
                                PostCardCommentsResponsesContainer
                            }
                        />
                    )}
                </>
            )}
        </div>
    );

}




