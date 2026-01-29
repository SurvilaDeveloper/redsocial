// src/components/custom/myPostList.tsx

"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MyPostCard } from "./myPostCard";

export default function MyPostList({
    session,
    userId,
}: {
    session: any;
    userId: number;
}) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastPostRef = useRef<HTMLDivElement | null>(null);

    // 🔹 Overlay de detalle (estilo Instagram)
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailPost, setDetailPost] = useState<Post | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPosts() {
            if (!hasMore) return;

            setLoading(true);
            try {
                let res;
                res = await fetch(
                    `/api/owner-posts?user_id=${userId}&page=${page}`,
                    { cache: "no-store" }
                );

                const data = await res.json();

                const newPosts: Post[] = data?.allPosts ?? [];

                if (!newPosts.length) {
                    setHasMore(false);
                } else {
                    setPosts((prev) => {
                        const existingIds = new Set(prev.map((p) => p.id));
                        const unique = newPosts.filter(
                            (p) => !existingIds.has(p.id)
                        );
                        return [...prev, ...unique];
                    });
                }
            } catch (error) {
                console.error("Error cargando posts del muro:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, [page, userId, hasMore]);

    // 🔹 Infinite scroll
    useEffect(() => {
        if (!hasMore) return;

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

    // 🔹 Como este es "Mi muro", el viewer siempre es el dueño
    const visiblePosts = useMemo(
        () =>
            posts.filter((p) => {
                // por las dudas, reforzamos que sean tus posts
                if (p.user_id !== userId) return false;
                return true;
            }),
        [posts, userId]
    );

    // 🔹 Abrir detalle: acá sí pegamos a /api/posts/:id para traer comentarios, etc.
    const handleOpenDetail = async (postId: number) => {
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailError(null);
        setDetailPost(null);

        try {
            const res = await fetch(`/api/posts/${postId}`, {
                cache: "no-store",
            });
            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.data) {
                throw new Error(data?.error || "No se pudo cargar el post");
            }

            setDetailPost(data.data as Post);
        } catch (err: any) {
            console.error("Error cargando detalle de post (mywall):", err);
            setDetailError(err?.message ?? "Error cargando el post");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetail = () => {
        setDetailOpen(false);
        setDetailPost(null);
        setDetailError(null);
    };

    return (
        <div
            id="PostListMyWall"
            className="relative flex flex-col w-full gap-10 lg:px-0"
        >
            {/* Feed de tu muro */}
            {visiblePosts.map((post, index) => (
                <div
                    key={post.id}
                    className="w-full"
                    ref={index === visiblePosts.length - 1 ? lastPostRef : null}
                >
                    <MyPostCard
                        session={session}
                        post={post}
                        variant="card"
                        enablePolling={false}        // 👈 nada de polling en el feed
                        onOpenDetail={handleOpenDetail} // 👈 abre overlay con detalle
                    />
                </div>
            ))}

            {loading && (
                <p className="text-xs text-slate-200 mt-2">Cargando...</p>
            )}
            {!hasMore && (
                <p className="text-center text-xs opacity-70 text-slate-300 mt-2">
                    No hay más posts
                </p>
            )}

            {/* Overlay tipo Instagram para ver el post completo con comentarios */}
            {detailOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="relative w-full mx-0 lg:max-w-5xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl pt-10">
                        {/* Botón cerrar, flotando arriba sin tapar la toolbar del post */}
                        <button
                            type="button"
                            onClick={handleCloseDetail}
                            className="absolute top-2 right-3 lg:top-3 lg:right-4 z-20 px-3 py-1 text-xs rounded-full bg-black/80 text-slate-100 hover:bg-black"
                        >
                            ✕ Cerrar
                        </button>

                        {/* Contenido del detalle */}
                        {detailLoading && (
                            <div className="flex items-center justify-center h-[60vh] text-slate-200 text-sm">
                                Cargando post...
                            </div>
                        )}

                        {detailError && !detailLoading && (
                            <div className="p-4 text-red-400 text-sm">
                                {detailError}
                            </div>
                        )}

                        {detailPost && !detailLoading && !detailError && (
                            <div className="h-[90vh] overflow-y-auto">
                                <MyPostCard
                                    session={session}
                                    post={detailPost}
                                    variant="detail"
                                    enablePolling={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}