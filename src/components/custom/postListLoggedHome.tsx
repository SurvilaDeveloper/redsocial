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

    useEffect(() => {
        async function fetchPosts() {
            if (!hasMore) return;

            setLoading(true);
            try {
                const res = await fetch(`/api/last-posts?page=${page}`, { cache: "no-store" });
                const data = await res.json();

                const newPosts: Post[] = data?.allPosts ?? [];

                if (!newPosts.length) {
                    setHasMore(false);
                } else {
                    setPosts((prev) => {
                        const existingIds = new Set(prev.map((p) => p.id));
                        const unique = newPosts.filter((p) => !existingIds.has(p.id));
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

    const visiblePosts = posts.filter((post) => {
        const isOwner = viewerId !== null && viewerId === post.user_id; // ✅
        if (isOwner) return true; // ✅ el dueño siempre ve sus posts

        const isLogged = viewerId !== null;

        if (post.active !== 1) return false;

        if (post.visibility === 1) return true;
        if (post.visibility === 2) return isLogged;

        const isFriend = Boolean(post.relations?.isFriend);
        const following = Boolean(post.relations?.following);

        if (post.visibility === 3) return isLogged && (isFriend || following);
        if (post.visibility === 4) return isLogged && isFriend;

        return false;
    });


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

    return (
        <div id="PostListLoggedHome" className="postListLoggedHome">
            {visiblePosts.map((post, index) => (
                <div
                    key={post.id}
                    className="w-full"
                    ref={index === visiblePosts.length - 1 ? lastPostRef : null}
                >
                    <PostCard session={session} post={post} />
                </div>
            ))}

            {loading && <p>Cargando...</p>}
            {!hasMore && <p className="text-center text-xs opacity-70">No hay más posts</p>}
        </div>
    );
}
