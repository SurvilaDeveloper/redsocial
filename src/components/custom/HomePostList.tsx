//src/components/custom/HomePostList.tsx
"use client";

import { useMemo, useState } from "react";
import type { Session } from "next-auth";
import Link from "next/link";

import { WallEntryCard } from "./WallEntryCard";
import { FeedMessage } from "./feedMessage";
import { PostCard } from "./postCard/PostCard";
import PostFormWall from "./postFormWall";

import { useInfiniteCursorFeed } from "@/hooks/useInfiniteCursorFeed";

function getFeedItemKey(post: any): string {
    const wallEntryId = post?.wallEntryMeta?.id;
    if (wallEntryId != null) return `we_${wallEntryId}`;
    return `p_${post?.id}`;
}

export default function HomePostList({ session }: { session: Session | null }) {
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailPost, setDetailPost] = useState<Post | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [detailEnableToView, setDetailEnableToView] = useState<EnableToView | null>(null);

    const feed = useInfiniteCursorFeed<Post>({
        enabled: true,
        getKey: (p: any) => getFeedItemKey(p),
        buildUrl: (cursor) => (cursor == null ? "/api/last-posts" : `/api/last-posts?cursor=${encodeURIComponent(cursor)}`),
        parse: (data) => ({
            items: (data?.allPosts ?? []) as Post[],
            nextCursor: typeof data?.nextCursor === "string" ? data.nextCursor : null,
        }),
        autoStart: true,
    });

    const posts = feed.items;
    const setPosts = feed.setItems;

    const sessionUserId = session?.user?.id != null ? Number(session.user.id) : null;

    const handleOpenDetail = async (postId: number) => {
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailError(null);
        setDetailPost(null);

        const clicked = posts.find((p: any) => p?.id === postId);
        setDetailEnableToView((clicked as any)?.enableToView ?? null);

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

            setDetailPost(data.data as Post);
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
        setDetailEnableToView(null);
        setDetailLoading(false);
    };

    const onPatchWallEntryMeta = (wallEntryId: number, patch: any) => {
        setPosts((curr: any[]) =>
            curr.map((p) => {
                const meta = p?.wallEntryMeta;
                if (!meta || meta.id !== wallEntryId) return p;
                return { ...p, wallEntryMeta: { ...meta, ...patch } };
            })
        );
    };

    const canLoadMore = useMemo(() => feed.canLoadMore, [feed.canLoadMore]);
    //console.log('detailPost en HomePostList: ', String(detailPost));

    return (
        <div id="HomePostList" className="relative flex flex-col w-full gap-10 lg:px-0">
            {sessionUserId && <PostFormWall wallUserId={sessionUserId} canPublish={true} />}
            {posts.map((post: any, index) => {
                const isPostOwner = sessionUserId != null && post?.authorId != null ? Number(post.authorId) === sessionUserId : false;

                return (
                    <div
                        key={getFeedItemKey(post)}
                        className="w-full"
                        ref={index === posts.length - 1 ? feed.sentinelRef : null}
                    >
                        <WallEntryCard
                            session={session}
                            post={post}
                            enableToView={(post as any).enableToView ?? null}
                            showOwnerPanel={isPostOwner}
                            selectedViewMode={0}
                            onOpenDetail={handleOpenDetail}
                            onPatchWallEntryMeta={onPatchWallEntryMeta}
                        />
                    </div>
                );
            })}

            {feed.loading && <p className="text-xs text-slate-200 mt-2">Cargando...</p>}
            {!feed.hasMore && <p className="text-center text-xs opacity-70 text-slate-300 mt-2">No hay más posts</p>}

            {feed.hasMore && !feed.loading && posts.length > 0 && (
                <div className="flex items-center justify-center">
                    <button
                        type="button"
                        onClick={() => canLoadMore && feed.requestMore()}
                        className="px-3 py-2 text-xs rounded-lg bg-slate-900/70 text-slate-100 border border-slate-800 hover:bg-slate-900 disabled:opacity-50"
                        disabled={!canLoadMore}
                    >
                        Cargar más
                    </button>
                </div>
            )}

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
                                    <div className="flex items-center justify-center h-full text-slate-200 text-sm">Cargando post...</div>
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
                                            enableToView={(detailPost as any).enableToView ?? detailEnableToView ?? null}
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
                        {detailError} <br />
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

            {!feed.loading && posts.length === 0 && !feed.hasMore && <FeedMessage>No hay posts para mostrar.</FeedMessage>}
        </div>
    );
}


