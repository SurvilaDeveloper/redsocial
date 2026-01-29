// src/components/custom/LastPostsList.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "next-auth";
import Link from "next/link";

import { PostCard } from "./postCard/PostCard";
import { FeedMessage } from "./feedMessage";
import { WallEntryCard } from "./WallEntryCard";

type Props = {
    session: Session | null;
};

// helper: id “estable” por item del feed (WallEntry primero, fallback a Post)
function getFeedItemKey(post: any): string {
    const wallEntryId = post?.wallEntryMeta?.id;
    if (wallEntryId != null) return `we_${wallEntryId}`;
    return `p_${post?.id}`;
}


export default function LastPostsList({ session }: Props) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const lastPostRef = useRef<HTMLDivElement | null>(null);

    // ✅ evita doble fetch en dev/strict mode
    const isFetchingRef = useRef(false);

    // overlay detalle (igual que PostList)
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailPost, setDetailPost] = useState<Post | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    // Para poder pasar enableToView correcto en el detalle
    const [detailEnableToView, setDetailEnableToView] = useState<EnableToView | null>(null);

    useEffect(() => {
        async function fetchPosts() {
            if (!hasMore) return;
            if (isFetchingRef.current) return;
            isFetchingRef.current = true;

            setLoading(true);
            try {
                const res = await fetch(`/api/last-posts?page=${page}`, {
                    cache: "no-store",
                });

                const data = await res.json();
                const newPosts: Post[] = data?.allPosts ?? [];

                if (!newPosts.length) {
                    setHasMore(false);
                } else {
                    setPosts((prev) => {
                        const existingKeys = new Set(prev.map((p: any) => getFeedItemKey(p)));
                        const unique = newPosts.filter((p: any) => !existingKeys.has(getFeedItemKey(p)));

                        return [...prev, ...unique];
                    });
                }
            } catch (e) {
                console.error("Error cargando posts:", e);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        }

        fetchPosts();
    }, [page, hasMore]);

    // infinite scroll (igual que PostList)
    useEffect(() => {
        if (!hasMore || loading) return;

        observer.current?.disconnect();
        observer.current = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loading) {
                setPage((prev) => prev + 1);
            }
        });

        const el = lastPostRef.current;
        if (el) observer.current.observe(el);

        return () => observer.current?.disconnect();
    }, [posts, hasMore, loading]);

    // Abrir detalle: /api/posts/:id (igual que PostList)
    const handleOpenDetail = async (postId: number) => {
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailError(null);
        setDetailPost(null);

        // guardamos enableToView del post que se clickeó, para usarlo como fallback en detail
        const clicked = posts.find((p) => p.id === postId);
        setDetailEnableToView(clicked?.enableToView ?? null);

        try {
            const res = await fetch(`/api/posts/${postId}`, { cache: "no-store" });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                const msg = data?.error ? "Post no encontrado:" : `No se pudo cargar el post (HTTP ${res.status})`;
                setDetailError(msg);
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
    };

    const canLoadMore = useMemo(() => hasMore && !loading, [hasMore, loading]);

    return (
        <div id="LastPostsList" className="relative flex flex-col w-full gap-10 lg:px-0">
            {/* Feed */}
            {posts.map((post, index) => (
                <div
                    key={getFeedItemKey(post)}

                    className="w-full"
                    ref={index === posts.length - 1 ? lastPostRef : null}
                >
                    <WallEntryCard
                        session={session}
                        post={post}
                        comingFrom="home"
                        enableToView={post.enableToView ?? null}
                        showOwnerPanel={true}
                        selectedViewMode={0}
                        onOpenDetail={handleOpenDetail}
                    />
                </div>
            ))}

            {loading && <p className="text-xs text-slate-200 mt-2">Cargando...</p>}

            {!hasMore && (
                <p className="text-center text-xs opacity-70 text-slate-300 mt-2">
                    No hay más posts
                </p>
            )}

            {/* Por si querés mantener botón además del infinite scroll */}
            {hasMore && !loading && posts.length > 0 && (
                <div className="flex items-center justify-center">
                    <button
                        type="button"
                        onClick={() => canLoadMore && setPage((p) => p + 1)}
                        className="px-3 py-2 text-xs rounded-lg bg-slate-900/70 text-slate-100 border border-slate-800 hover:bg-slate-900"
                    >
                        Cargar más
                    </button>
                </div>
            )}

            {/* Overlay tipo Instagram para ver el post completo con comentarios */}
            {detailOpen && !detailError && (
                <div className="fixed inset-0 z-50 bg-black/80">
                    {/* Mobile: scroll del overlay. Desktop: no, scroll interno */}
                    <div className="h-full w-full overflow-y-auto lg:overflow-hidden">
                        <div className="mx-auto w-full max-w-full lg:max-w-[92vw] lg:h-[100dvh] lg:py-4 px-0 lg:px-2 min-h-0">
                            <div className="relative w-full bg-slate-950 shadow-2xl lg:h-[calc(100dvh-32px)] h-auto overflow-hidden min-h-0 flex flex-col">
                                {/* Botón cerrar */}
                                <button
                                    type="button"
                                    onClick={handleCloseDetail}
                                    className="fixed top-3 right-1 z-20 px-3 py-1 text-xs rounded-full bg-black/80 text-slate-100 hover:bg-black"
                                >
                                    ✕ Cerrar
                                </button>

                                {/* Contenido del detalle */}
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
                                            comingFrom="home"
                                            enableToView={detailPost.enableToView ?? detailEnableToView ?? null}
                                            showOwnerPanel={true}
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
                        Posiblemente este post haya sido eliminado y permanece en la
                        papelera de reciclaje.
                        <Link
                            href={"/trash"}
                            className="flex flex-row text-white bg-green-900 rounded-[10px] hover:bg-green-800 justify-center items-center h-10"
                        >
                            Papelera de reciclaje
                        </Link>
                    </div>
                </div>
            )}

            {/* Si querés un estado vacío */}
            {!loading && posts.length === 0 && !hasMore && (
                <FeedMessage>No hay posts para mostrar.</FeedMessage>
            )}
        </div>
    );
}

