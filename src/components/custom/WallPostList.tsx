//src/components/custom/WallPostList.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { WallEntryCard } from "./WallEntryCard";
import { FeedMessage } from "./feedMessage";
import { PostCard } from "./postCard/PostCard";
import WallHeader from "./wallHeader";
import PostFormWall from "./postFormWall";

import { useInfiniteCursorFeed } from "@/hooks/useInfiniteCursorFeed";

function getFeedItemKey(post: any): string {
    const wallEntryId = post?.wallEntryMeta?.id;
    if (wallEntryId != null) return `we_${wallEntryId}`;
    return `p_${post?.id}`;
}

export default function WallPostList({
    session,
    wallUserId,
    enableToView,
}: {
    session: any;
    wallUserId: number;
    enableToView: EnableToView | null;
}) {
    const [enableToViewState, setEnableToViewState] = useState<EnableToView | null>(enableToView ?? null);
    const [canPublishOnWall, setCanPublishOnWall] = useState(false);

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailPost, setDetailPost] = useState<Post | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const TOGGLE_URL = "/api/wall-entry/toggle-feed";
    const [pendingToggleIds, setPendingToggleIds] = useState<Set<number>>(new Set());

    const canViewPosts = enableToViewState?.posts ?? false;

    useEffect(() => {
        setEnableToViewState(enableToView ?? null);
    }, [enableToView]);

    const feed = useInfiniteCursorFeed<Post>({
        enabled: canViewPosts,
        getKey: (p: any) => getFeedItemKey(p),
        buildUrl: (cursor) =>
            cursor == null
                ? `/api/wall-posts?wall_user_id=${wallUserId}`
                : `/api/wall-posts?wall_user_id=${wallUserId}&cursor=${encodeURIComponent(cursor)}`,
        parse: (data) => {
            if (typeof data?.canPublishOnWall === "boolean") setCanPublishOnWall(data.canPublishOnWall);
            return {
                items: (data?.allPosts ?? []) as Post[],
                nextCursor: typeof data?.nextCursor === "string" ? data.nextCursor : null,
            };
        },
        autoStart: true,
    });

    const posts = feed.items;
    const setPosts = feed.setItems;

    const sessionUserId = session?.user?.id != null ? Number(session.user.id) : null;

    const onPatchWallEntryMeta = (wallEntryId: number, patch: any) => {
        setPosts((curr: any[]) =>
            curr.map((p) => {
                const meta = p?.wallEntryMeta;
                if (!meta || meta.id !== wallEntryId) return p;
                return { ...p, wallEntryMeta: { ...meta, ...patch } };
            })
        );
    };

    const toggleShowInFeedOptimistic = async (wallEntryId: number) => {
        if (!Number.isFinite(wallEntryId)) return;
        if (pendingToggleIds.has(wallEntryId)) return;

        const prevValue = Boolean(
            (posts as any[]).find((p) => p?.wallEntryMeta?.id === wallEntryId)?.wallEntryMeta?.showInFeed
        );

        setPendingToggleIds((prev) => new Set(prev).add(wallEntryId));

        setPosts((curr: any[]) =>
            curr.map((p) => {
                const meta = p?.wallEntryMeta;
                if (!meta || meta.id !== wallEntryId) return p;
                return { ...p, wallEntryMeta: { ...meta, showInFeed: !meta.showInFeed } };
            })
        );

        try {
            const res = await fetch(TOGGLE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallEntryId }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.success) {
                setPosts((curr: any[]) =>
                    curr.map((p) => {
                        const meta = p?.wallEntryMeta;
                        if (!meta || meta.id !== wallEntryId) return p;
                        return { ...p, wallEntryMeta: { ...meta, showInFeed: prevValue } };
                    })
                );
                return;
            }

            setPosts((curr: any[]) =>
                curr.map((p) => {
                    const meta = p?.wallEntryMeta;
                    if (!meta || meta.id !== wallEntryId) return p;
                    return { ...p, wallEntryMeta: { ...meta, showInFeed: Boolean(data.showInFeed) } };
                })
            );
        } catch {
            setPosts((curr: any[]) =>
                curr.map((p) => {
                    const meta = p?.wallEntryMeta;
                    if (!meta || meta.id !== wallEntryId) return p;
                    return { ...p, wallEntryMeta: { ...meta, showInFeed: prevValue } };
                })
            );
        } finally {
            setPendingToggleIds((prev) => {
                const next = new Set(prev);
                next.delete(wallEntryId);
                return next;
            });
        }
    };

    // ✅ IMPORTANTE: PostCard / WallEntryCard te llaman onOpenDetail(postId:number)
    // En HomePostList tu handler ya era (postId:number). Acá lo tenías como (post:Post),
    // por eso terminaba fetchando /api/posts/undefined y te daba "Post no encontrado".
    const handleOpenDetail = async (postId: number) => {
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailError(null);
        setDetailPost(null);

        // preservamos el meta del item en el feed (WallEntryMeta) para el overlay
        const clicked = (posts as any[]).find((p) => Number(p?.id) === Number(postId));
        const originalMeta = clicked?.wallEntryMeta;

        try {
            const res = await fetch(`/api/posts/${postId}`, { cache: "no-store" });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                setDetailError("Post no encontrado");
                return;
            }

            if (!data?.data) {
                setDetailError("Respuesta inválida del servidor.");
                return;
            }

            const shaped = data.data as Post;
            if (originalMeta) (shaped as any).wallEntryMeta = originalMeta;

            setDetailPost(shaped);
        } catch {
            setDetailError("Error de red cargando el post.");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetail = () => {
        setDetailOpen(false);
        setDetailPost(null);
        setDetailError(null);
        setDetailLoading(false);
    };

    return (
        <div id="WallPostList" className="relative flex flex-col w-full gap-10 lg:px-0">
            <WallHeader userId={wallUserId} enableToView={enableToViewState ?? null} />
            {canPublishOnWall && <PostFormWall wallUserId={wallUserId} canPublish={canPublishOnWall} />}

            {canViewPosts ? (
                <>
                    {posts.map((post: any, index) => {
                        const meta = post?.wallEntryMeta;
                        const wallEntryId = meta?.id;

                        const isWallOwnerViewing =
                            sessionUserId != null && meta?.wallUserId != null
                                ? sessionUserId === Number(meta.wallUserId)
                                : false;

                        const isThirdPartyEntry =
                            meta?.actorUserId != null && meta?.wallUserId != null
                                ? Number(meta.actorUserId) !== Number(meta.wallUserId)
                                : false;

                        const canToggleShowInFeed = isWallOwnerViewing && isThirdPartyEntry;
                        const showInFeedLoading = typeof wallEntryId === "number" ? pendingToggleIds.has(wallEntryId) : false;

                        const isPostOwner =
                            sessionUserId != null && post?.authorId != null ? Number(post.authorId) === sessionUserId : false;

                        return (
                            <div
                                key={getFeedItemKey(post)}
                                className="w-full"
                                ref={index === posts.length - 1 ? feed.sentinelRef : null}
                            >
                                <WallEntryCard
                                    session={session}
                                    post={post}
                                    enableToView={enableToViewState}
                                    showOwnerPanel={isPostOwner}
                                    selectedViewMode={0}
                                    canToggleShowInFeed={canToggleShowInFeed}
                                    onToggleShowInFeed={toggleShowInFeedOptimistic}
                                    showInFeedLoading={showInFeedLoading}
                                    onOpenDetail={handleOpenDetail}
                                    onPatchWallEntryMeta={onPatchWallEntryMeta}
                                />
                            </div>
                        );
                    })}

                    {feed.loading && <p className="text-xs text-slate-200 mt-2">Cargando...</p>}
                    {!feed.hasMore && <p className="text-center text-xs opacity-70 text-slate-300 mt-2">No hay más posts</p>}

                    {/* Overlay detalle */}
                    {detailOpen && !detailError && (
                        <div className="fixed inset-0 z-50 bg-black/80">
                            <div className="h-full w-full overflow-y-auto lg:overflow-hidden">
                                <div className="mx-auto w-full max-w-full lg:max-w-[92vw] lg:h-[100dvh] lg:py-4 px-0 lg:px-2 min-h-0">
                                    <div className="relative w-full bg-slate-950 shadow-2xl lg:h-[calc(100dvh-32px)] h-auto overflow-hidden min-h-0 flex flex-col">
                                        <button
                                            type="button"
                                            onClick={handleCloseDetail}
                                            className="fixed top-3 right-1 z-20 px-3 py-1 text-xs rounded-full bg-black/80 text-slate-100 hover:bg-black"
                                        >
                                            ✕ Cerrar
                                        </button>

                                        {detailLoading && (
                                            <div className="flex items-center justify-center h-full text-slate-200 text-sm">
                                                Cargando post...
                                            </div>
                                        )}

                                        {detailPost && !detailLoading && !detailError && (
                                            <div className="flex-1 min-h-0">
                                                <PostCard
                                                    session={session}
                                                    post={detailPost}
                                                    variant="detail"
                                                    openCommentsInPage={false}
                                                    enablePolling={false}
                                                    enableOwnerControls={false}
                                                    enableToView={enableToViewState}
                                                    showOwnerPanel={false}
                                                    selectedViewMode={0}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {detailError && !detailLoading && (
                        <div className="fixed inset-0 flex z-50 bg-black/80 items-center justify-center">
                            <button
                                type="button"
                                onClick={handleCloseDetail}
                                className="fixed top-3 right-1 z-20 px-3 py-1 text-xs rounded-full bg-black/80 text-slate-100 hover:bg-black"
                            >
                                ✕ Cerrar
                            </button>

                            <div className="flex flex-col gap-3 p-4 text-red-400 text-sm lg:w-96 w-[90dvw] border border-red-400 rounded-xl bg-black">
                                {detailError}: <br />
                                Posiblemente este post haya sido eliminado y permanece en la papelera de reciclaje.
                                <Link
                                    href={"/trash"}
                                    className="flex flex-row text-white bg-green-900 rounded-[10px] hover:bg-green-800 justify-center items-center h-10"
                                >
                                    Papelera de reciclaje
                                </Link>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <FeedMessage>No tienes permiso para ver las publicaciones de este usuario/a</FeedMessage>
            )}
        </div>
    );
}



