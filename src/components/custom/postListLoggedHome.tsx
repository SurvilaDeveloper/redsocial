// src/components/custom/postListLoggedHome.tsx
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { PostCard } from "./postCard";

export default function PostListLoggedHome({ session }: { session: any }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastPostRef = useRef<HTMLDivElement | null>(null);

    // 🔹 Estado del overlay de detalle (tipo Instagram)
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailPost, setDetailPost] = useState<Post | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPosts() {
            if (!hasMore) return;

            setLoading(true);
            try {
                const res = await fetch(`/api/last-posts?page=${page}`, {
                    cache: "no-store",
                });
                const data = await res.json();

                console.log('data:', data);

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
            } catch (e) {
                console.error("Error cargando posts:", e);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, [page, hasMore]);

    // ✅ filtro por visibility (refuerzo frontend)
    const viewerId = session?.user?.id ? Number(session.user.id) : null;

    const visiblePosts = useMemo(
        () =>
            posts.filter((post) => {
                const isOwner =
                    viewerId !== null && viewerId === post.user_id;
                if (isOwner) return true; // dueño siempre ve sus posts

                const isLogged = viewerId !== null;

                if (post.active !== 1) return false;

                if (post.visibility === 1) return true;
                if (post.visibility === 2) return isLogged;

                const isFriend = Boolean(post.relations?.relState === 8);
                const following = Boolean(post.relations?.following);

                if (post.visibility === 3)
                    return isLogged && (isFriend || following);
                if (post.visibility === 4) return isLogged && isFriend;

                return false;
            }),
        [posts, viewerId]
    );

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
    }, [visiblePosts, hasMore, loading]);

    // 🔹 Abrir detalle en overlay (consulta pesada a /api/posts/:id)
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
            console.log('detalle post data:', data);

            if (!res.ok || !data?.data) {
                throw new Error(data?.error || "No se pudo cargar el post");
            }

            setDetailPost(data.data as Post);
        } catch (err: any) {
            console.error("Error cargando detalle de post:", err);
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
            id="PostListLoggedHome"
            className="
                relative
                flex
                flex-col
                w-full
                gap-4
            "
        >
            {/* Feed compacto */}
            {visiblePosts.map((post, index) => (
                <div
                    key={post.id}
                    className="w-full"
                    ref={
                        index === visiblePosts.length - 1
                            ? lastPostRef
                            : null
                    }
                >
                    <PostCard
                        session={session}
                        post={post}
                        variant="card"
                        openCommentsInPage={false}      // 👈 ahora NO navega
                        enablePolling={false}           // 👈 nada de polling en feed
                        enableOwnerControls={false}
                        onOpenDetail={handleOpenDetail} // 👈 abre overlay
                        comingFrom="home"
                    />
                </div>
            ))}

            {loading && (
                <p className="text-xs text-slate-200 mt-1">Cargando...</p>
            )}
            {!hasMore && (
                <p className="text-center text-xs opacity-70 text-slate-300 mt-1">
                    No hay más posts
                </p>
            )}

            {/* Overlay tipo Instagram */}
            {detailOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
                        {/* Botón cerrar */}
                        <button
                            type="button"
                            onClick={handleCloseDetail}
                            className="
                                absolute 
                                top-2 
                                right-2 
                                z-10 
                                px-3 py-1 
                                text-xs 
                                rounded-full 
                                bg-black/70 
                                text-slate-100 
                                hover:bg-black
                            "
                        >
                            ✕ Cerrar
                        </button>

                        {/* Contenido */}
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
                                <PostCard
                                    session={session}
                                    post={detailPost}
                                    variant="detail"   // 👈 layout con comentarios a la derecha
                                    openCommentsInPage={false}
                                    enablePolling={false}  // si querés refresco auto, podés poner true
                                    enableOwnerControls={false}
                                    comingFrom="home"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


