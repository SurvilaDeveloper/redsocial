// src/components/custom/postCard/PostCard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, MessageCircleOff } from "lucide-react";

import { updatePostActive, updatePostVisibility, softDeletePost } from "@/actions/post-action";
import { restorePost, hardDeletePost } from "@/actions/post-action";

import PostCardCommentsContainer from "../postCardCommentsContainer";
import PostCardCommentsResponsesContainer from "../postCardCommentsResponsesContainer";

import { OwnerToolbar } from "./OwnerToolbar";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { PostHeader } from "./PostHeader";
import { PostMedia } from "./PostMedia";
import { PostReactions } from "./PostReactions";
import { PostDetailLayout } from "./PostDetailLayout";
import { ShareWithFriendModal } from "../share/ShareWithFriendModal";

type WallContext = {
    showToggleShowInFeed?: boolean;
    showInFeed?: boolean;
    onToggleShowInFeed?: () => void | Promise<void>;
    showInFeedLoading?: boolean;
};

export function PostCard({
    session,
    post,
    variant = "card",
    openCommentsInPage = false,
    enablePolling = false,
    enableOwnerControls = false,
    onOpenDetail,
    enableToView,
    showOwnerPanel,
    selectedViewMode,
    wallContext,
    embedded,
    hideFooterActions = false,
}: {
    session: any;
    post: Post;
    variant?: "card" | "detail";
    openCommentsInPage?: boolean;
    enablePolling?: boolean;
    enableOwnerControls?: boolean;
    onOpenDetail?: (postId: number) => void;
    enableToView?: EnableToView | null;
    showOwnerPanel?: boolean;
    selectedViewMode?: number;
    wallContext?: WallContext;
    embedded?: boolean;
    hideFooterActions?: boolean;
}) {
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [expandedCommentId, setExpandedCommentId] = useState<number | null>(null);
    const toggleComment = (id: number) => setExpandedCommentId((prev) => (prev === id ? null : id));

    const [newComment, setNewComment] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentMsg, setCommentMsg] = useState<string | null>(null);
    const [commentsExpanded, setCommentsExpanded] = useState(false);

    const commentRefs = useRef<Record<number, HTMLDivElement | null>>({});

    type LocalPostComment = PostComment & { __optimistic?: boolean; __error?: string | null };

    const [currentPost, setCurrentPost] = useState<Post>(post);

    const [visibilityMenu, setVisibilityMenu] = useState(false);
    const [ownerActionsLoading, setOwnerActionsLoading] = useState(false);

    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [actionPostId, setActionPostId] = useState<number | null>(null);

    const [enableToViewState, setEnableToViewState] = useState<EnableToView | null | undefined>(enableToView);
    const [showOwnerPanelState, setShowOwnerPanelState] = useState<boolean | undefined>(showOwnerPanel ? showOwnerPanel : true);
    const [selectedViewModeState, setSelectedViewModeState] = useState<number>(selectedViewMode ? selectedViewMode : 0);

    const [shareOpen, setShareOpen] = useState(false);

    /* ===========================
     *  Interests tracking (MVP)
     * =========================== */

    const trackInterestEvent = async (payload: { postId: number; type: "view" | "like" | "own_post"; dwellMs?: number }) => {
        try {
            await fetch("/api/interests/event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                keepalive: true,
            });
        } catch {
            // noop
        }
    };


    // Dedupe: no spamear "view" si re-renderiza el detail
    const viewedRef = useRef<Record<number, boolean>>({});

    const canViewFunction = (selectedViewMode: number, postVisibility: number): boolean => {
        if (selectedViewMode === 0) return true;
        if (postVisibility === 1) return true;
        if (selectedViewMode > 2 && postVisibility === 2) return true;
        if (selectedViewMode === postVisibility) return true;
        if (selectedViewMode === 4 && postVisibility === 3) return true;
        return false;
    };

    const [canViewState, setCanViewState] = useState<boolean>(canViewFunction(selectedViewModeState, currentPost.visibility));

    useEffect(() => {
        setEnableToViewState(enableToView);
        setShowOwnerPanelState(showOwnerPanel);
        setSelectedViewModeState(selectedViewMode ? selectedViewMode : 0);
        setCanViewState(canViewFunction(selectedViewMode ? selectedViewMode : 0, currentPost.visibility));
    }, [enableToView, showOwnerPanel, selectedViewMode, currentPost.visibility]);

    useEffect(() => {
        setCurrentPost(post);
    }, [post]);

    const [localComments, setLocalComments] = useState<LocalPostComment[]>((post.post_comment ?? []) as LocalPostComment[]);

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
            const stillOptimistic = prev.filter((c) => c.__optimistic && !serverIds.has(c.id));
            return [...stillOptimistic, ...mergedFromServer];
        });
    }, [currentPost.post_comment, currentPost.id]);

    useEffect(() => {
        if (!currentPost?.id || !enablePolling) return;

        let cancelled = false;

        const fetchLatest = async () => {
            try {
                const res = await fetch(`/api/posts/${currentPost.id}`, { method: "GET", cache: "no-store" });
                if (!res.ok) return;
                const json = await res.json().catch(() => null);
                const fresh = json?.data as Post | undefined;
                if (!fresh) return;
                if (!cancelled) setCurrentPost(fresh);
            } catch { }
        };

        fetchLatest();
        const id = setInterval(fetchLatest, 30_000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [currentPost?.id, enablePolling]);

    const sessionUserId = session?.user?.id ? Number(session.user.id) : null;
    const sessionUserName = session?.user?.name ?? "Tú";
    const sessionUserImageUrl = session?.user?.imageUrl ?? null;

    // ✅ Track "view" cuando se abre el modal/detail
    useEffect(() => {
        if (variant !== "detail") return;
        if (!currentPost?.id) return;
        if (!sessionUserId) return;

        const postId = currentPost.id;
        const t0 = performance.now();

        // si querés: opcional “ping” inmediato (sin dwell) NO lo recomiendo si ya mandás al cerrar
        // void trackInterestEvent({ postId, type: "view" });

        return () => {
            const dwellMs = Math.max(0, Math.round(performance.now() - t0));
            void trackInterestEvent({ postId, type: "view", dwellMs });
        };
    }, [variant, currentPost?.id, sessionUserId]);


    const canCreatePostComment = Boolean(session?.user?.id) && newComment.trim().length > 0 && !commentLoading;

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
            user: { id: sessionUserId, name: sessionUserName, imageUrl: sessionUserImageUrl },
            responses: [],
            __optimistic: true,
            __error: null,
        };

        setCommentsExpanded(true);
        setExpandedCommentId(tempId);
        setLocalComments((prev) => [optimistic, ...prev]);
        setCommentLoading(true);

        try {
            const res = await fetch("/api/post-comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ post_id: currentPost.id, comment: content }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "No se pudo guardar el comentario");

            const created = data?.data as PostComment;
            const realId = created.id;

            setLocalComments((prev) =>
                prev.map((c) =>
                    c.id === tempId ? { ...c, id: created.id, createdAt: created.createdAt, __optimistic: false, __error: null } : c
                )
            );

            setExpandedCommentId((prev) => (prev === tempId ? realId : prev));
            setCommentMsg("Comentario guardado ✅");
        } catch (err: any) {
            const msg = err?.message ?? "Error";
            setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
            setCommentMsg(msg);
        } finally {
            setCommentLoading(false);
        }
    };

    const viewerIdRaw = session?.user?.id;
    const viewerIdParsed = viewerIdRaw != null ? parseInt(String(viewerIdRaw), 10) : null;
    const viewerId = viewerIdParsed != null && Number.isFinite(viewerIdParsed) ? viewerIdParsed : null;

    // ✅ FIX: el “owner del post” es el autor, NO el dueño del muro.
    const isOwner = viewerId !== null && viewerId === currentPost.authorId;

    const showToggleShowInFeed = Boolean(wallContext?.showToggleShowInFeed);
    const showInFeedLoading = Boolean(wallContext?.showInFeedLoading);
    const handleToggleShowInFeed = async () => {
        if (!showToggleShowInFeed) return;
        if (showInFeedLoading) return;
        await wallContext?.onToggleShowInFeed?.();
    };

    const author = currentPost.author ?? null;
    const isDeleted = Boolean(currentPost.deletedAt);

    const rel = currentPost.relations ?? {
        following: false,
        isFollower: false,
        likesCount: 0,
        unlikesCount: 0,
        userReaction: null,
        relState: 1 as any,
    };

    const [postReaction, setPostReaction] = useState<Reaction>(rel.userReaction ?? null);
    const [likesCount, setLikesCount] = useState<number>(rel.likesCount ?? 0);
    const [unlikesCount, setUnlikesCount] = useState<number>(rel.unlikesCount ?? 0);

    useEffect(() => {
        const r = currentPost.relations as PostRelations | undefined;
        setPostReaction(r?.userReaction ?? null);
        setLikesCount(r?.likesCount ?? 0);
        setUnlikesCount(r?.unlikesCount ?? 0);
    }, [currentPost.id, currentPost.relations?.userReaction, currentPost.relations?.likesCount, currentPost.relations?.unlikesCount]);

    const [reactionLoading, setReactionLoading] = useState(false);
    const canReact = Boolean(sessionUserId) && !reactionLoading;

    const updateCountsOptimistic = (prev: Reaction, next: Reaction) => {
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
            const res = await fetch(`/api/posts/${currentPost.id}/reaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: next }),
            });

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

                // ✅ Track interest: solo cuando efectivamente quedó LIKE
                if (sessionUserId && data.userReaction === "LIKE" && prev !== "LIKE") {
                    void trackInterestEvent({ postId: currentPost.id, type: "like" });
                }
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
        const next: Reaction = postReaction === "LIKE" ? null : "LIKE";
        sendReaction(next);
    };

    const handleUnlike = () => {
        const next: Reaction = postReaction === "UNLIKE" ? null : "UNLIKE";
        sendReaction(next);
    };

    const desc = (currentPost.description ?? "").trim();

    const shortDesc = useMemo(() => {
        if (!desc) return "Sin descripción (click para comentar)";
        if (desc.length <= 70) return desc;
        return desc.slice(0, 70) + "…";
    }, [desc]);

    const shownDesc = showFullDesc ? desc || "Sin descripción" : shortDesc;

    const activeCommentsCount = (() => {
        const activeLocal = (localComments ?? []).filter((c) => (c.active ?? 1) === 1).length;
        if (activeLocal > 0) return activeLocal;
        const fromPost = currentPost.commentsCount;
        return typeof fromPost === "number" ? fromPost : 0;
    })();

    const sortedImages = useMemo(
        () =>
            (currentPost.images ?? [])
                .filter((img) => !!img && !!img.imageUrl)
                .slice()
                .sort((a, b) => (a.index ?? 0) - (b.index ?? 0)),
        [currentPost.images]
    );

    const handleToggleActiveOwner = async () => {
        if (!enableOwnerControls || !isOwner) return;

        const prevActive = currentPost.active ?? 1;
        const nextActive = prevActive === 1 ? 0 : 1;

        setOwnerActionsLoading(true);
        try {
            await updatePostActive(currentPost.id, nextActive);
            setCurrentPost((prev) => (prev ? ({ ...prev, active: nextActive } as Post) : prev));
        } catch (err) {
            console.error("Error al actualizar active:", err);
        } finally {
            setOwnerActionsLoading(false);
        }
    };

    const handleChangeVisibilityOwner = async (value: PostVisibility) => {
        if (!enableOwnerControls || !isOwner) return;
        setOwnerActionsLoading(true);
        try {
            await updatePostVisibility(currentPost.id, value);
            setCurrentPost((prev) => (prev ? ({ ...prev, visibility: value } as Post) : prev));
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
            if ((res as any)?.error) {
                console.error((res as any).error);
            } else {
                setCurrentPost((prev) => (prev ? ({ ...prev, deletedAt: new Date().toISOString() } as Post) : prev));
            }
            setShowDeletePopup(false);
        } catch (err) {
            console.error("Error al eliminar (soft) post:", err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleRestore = () => {
        setActionPostId(currentPost.id);
        startTransition(async () => {
            const res = await restorePost(currentPost.id);
            if ((res as any)?.error) {
                console.error((res as any).error);
                setActionPostId(null);
                return;
            }

            try {
                const resPost = await fetch(`/api/posts/${currentPost.id}`, { method: "GET", cache: "no-store" });
                if (!resPost.ok) {
                    setActionPostId(null);
                    return;
                }
                const json = await resPost.json().catch(() => null);
                const fresh = json?.data as Post | undefined;
                if (fresh) setCurrentPost(fresh);
            } catch {
            } finally {
                setActionPostId(null);
            }
        });
    };

    const handleHardDelete = () => {
        const ok = window.confirm("¿Seguro que querés eliminar definitivamente este post? Esta acción no se puede deshacer.");
        if (!ok) return;

        setActionPostId(currentPost.id);
        startTransition(async () => {
            const res = await hardDeletePost(currentPost.id);
            if ((res as any)?.error) console.error((res as any).error);
            setActionPostId(null);
        });
    };

    const isActive = (currentPost.active ?? 1) === 1;

    const canView =
        isOwner ||
        currentPost.visibility === 1 ||
        (currentPost.visibility === 2 && viewerId !== null) ||
        (currentPost.visibility === 3 && viewerId !== null && (rel.relState === 8 || rel.following)) ||
        (currentPost.visibility === 4 && viewerId !== null && rel.relState === 8);

    if (isDeleted && !isOwner) {
        return (
            <div className="w-full rounded-lg bg-slate-900 border border-slate-800 shadow-sm px-3 py-2 text-slate-100">
                <div className="text-xs text-red-300">Este post fue eliminado por su autor.</div>
            </div>
        );
    }

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

    const handleCommentsClick = () => {
        if (onOpenDetail) {
            onOpenDetail(currentPost.id);
            return;
        }
        setCommentsExpanded((v) => !v);
    };

    const rootClass = embedded
        ? "w-full bg-transparent px-0 py-0 text-slate-100"
        : isDeleted
            ? "w-full rounded-lg bg-[rgb(64,20,20)] border rounded-xl border-red-600 shadow-sm px-3 py-2 text-red-100 pt-10 lg:py-2"
            : isActive
                ? "w-full rounded-lg bg-black border rounded-xl border-slate-800 shadow-sm px-3 py-2 text-slate-100 pt-10 lg:py-2"
                : "w-full rounded-lg bg-black border rounded-xl border-red-500 shadow-md px-3 py-2 text-gray-200 pt-10 lg:py-2";

    return (
        <>
            {((isActive && !isDeleted) || showOwnerPanelState) && canViewState && (
                <div className={rootClass}>
                    {isOwner && (
                        <OwnerToolbar
                            isOwner={isOwner}
                            isDeleted={isDeleted}
                            isActive={isActive}
                            showOwnerPanel={Boolean(showOwnerPanel)}
                            enableOwnerControls={Boolean(enableOwnerControls)}
                            postId={currentPost.id}
                            visibility={currentPost.visibility}
                            visibilityMenu={visibilityMenu}
                            setVisibilityMenu={setVisibilityMenu}
                            ownerActionsLoading={ownerActionsLoading}
                            onToggleActive={handleToggleActiveOwner}
                            onOpenDelete={() => setShowDeletePopup(true)}
                            onChangeVisibility={handleChangeVisibilityOwner}
                            onRestore={handleRestore}
                            onHardDelete={handleHardDelete}
                            isPending={isPending}
                            actionPostId={actionPostId}
                        />
                    )}

                    {isOwner && (
                        <DeleteConfirmModal
                            open={showDeletePopup}
                            onClose={() => setShowDeletePopup(false)}
                            onConfirm={handleSoftDeleteOwner}
                            loading={deleteLoading}
                        />
                    )}

                    {variant === "card" && author && (
                        <PostHeader
                            session={session}
                            user={author}
                            createdAt={currentPost.createdAt}
                            title={currentPost.title}
                            relations={currentPost.relations}
                            postId={currentPost.id}
                            onOpenDetail={onOpenDetail}
                        />
                    )}

                    {variant === "detail" ? (
                        <PostDetailLayout
                            session={session}
                            currentPost={currentPost}
                            isOwner={isOwner}
                            isDeleted={isDeleted}
                            isActive={isActive}
                            sortedImages={sortedImages}
                            enableMedia={Boolean(enableToViewState?.media)}
                            enablePostComments={Boolean(enableToViewState?.postComments)}
                            enablePostReplies={Boolean(enableToViewState?.postReplies)}
                            sessionUserId={sessionUserId}
                            shownDesc={shownDesc}
                            showFullDesc={showFullDesc}
                            onToggleDesc={() => setShowFullDesc((v) => !v)}
                            canReact={canReact}
                            postReaction={postReaction}
                            likesCount={likesCount}
                            unlikesCount={unlikesCount}
                            onLike={handleLike}
                            onUnlike={handleUnlike}
                            activeCommentsCount={activeCommentsCount}
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
                            PostCardCommentsResponsesContainer={PostCardCommentsResponsesContainer}
                            ownerConfiguration={currentPost.ownerConfiguration}
                        />
                    ) : (
                        <>
                            <PostMedia
                                enableMedia={Boolean(enableToViewState?.media)}
                                selectedViewModeState={selectedViewModeState}
                                sortedImages={sortedImages}
                                sessionUserId={sessionUserId}
                                postId={currentPost.id}
                            />

                            <pre
                                onClick={() => setShowFullDesc((v) => !v)}
                                title={showFullDesc ? "Click para contraer" : "Click para ver completo"}
                                className="mt-2 text-gray-200 w-full whitespace-pre-wrap break-words cursor-pointer select-none"
                            >
                                {shownDesc}
                            </pre>

                            <div className="mt-2 flex flex-row items-center gap-3">
                                {enableToViewState?.likes && (
                                    <PostReactions
                                        canReact={canReact}
                                        postReaction={postReaction}
                                        likesCount={likesCount}
                                        unlikesCount={unlikesCount}
                                        onLike={handleLike}
                                        onUnlike={handleUnlike}
                                    />
                                )}

                                {!hideFooterActions && sessionUserId != null && (
                                    <button
                                        type="button"
                                        onClick={() => setShareOpen(true)}
                                        className="mt-0 text-[11px] px-2 h-7 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-900 select-none w-fit"
                                        title="Compartir este post en el muro de un amigo"
                                    >
                                        Compartir con un amigo
                                    </button>
                                )}

                                {enableToViewState?.postComments && (
                                    <button
                                        type="button"
                                        onClick={handleCommentsClick}
                                        className="mt-0 text-xs text-gray-300 hover:text-gray-200 select-none w-fit"
                                    >
                                        {commentsExpanded ? (
                                            <div className="flex flex-row gap-1">
                                                <span>Ocultar</span>
                                                <MessageCircleOff className="w-5 h-5 text-gray-400 hover:text-gray-100" />
                                                <span>{activeCommentsCount}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-row gap-1">
                                                <span>Ver</span>
                                                <MessageCircle className="w-5 h-5 text-gray-400 hover:text-gray-100" />
                                                <span>{activeCommentsCount}</span>
                                            </div>
                                        )}
                                    </button>
                                )}

                                {!hideFooterActions && showToggleShowInFeed && (
                                    <button
                                        type="button"
                                        onClick={handleToggleShowInFeed}
                                        disabled={showInFeedLoading}
                                        className="mt-0 text-[11px] px-2 h-7 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-900 select-none w-fit"
                                        title={wallContext?.showInFeed ? "Ocultar este post del inicio" : "Mostrar este post en el inicio"}
                                    >
                                        {showInFeedLoading ? "Guardando…" : wallContext?.showInFeed ? "Ocultar del inicio" : "Mostrar en inicio"}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            <ShareWithFriendModal open={shareOpen} onClose={() => setShareOpen(false)} postId={currentPost.id} />
        </>
    );
}