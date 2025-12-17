"use client";

import { useEffect, useRef, useState } from "react";
import { PostCard } from "./postCard";

export default function PostList({ session, userId }: { session: any; userId: number }) {
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
                const res = await fetch(`/api/user-posts?user_id=${userId}&page=${page}`, { cache: "no-store" });
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
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, [page, userId, hasMore]);

    useEffect(() => {
        if (!hasMore) return;

        observer.current?.disconnect();
        observer.current = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loading) setPage((prev) => prev + 1);
        });

        const el = lastPostRef.current;
        if (el) observer.current.observe(el);

        return () => observer.current?.disconnect();
    }, [posts, hasMore, loading]);

    return (
        <div className="flex flex-col items-center space-y-4 w-[700px]">
            {posts.map((post, index) => (
                <div key={post.id} ref={index === posts.length - 1 ? lastPostRef : null}>
                    {/* ✅ no tocamos PostCard; le pasamos session */}
                    <PostCard session={session} post={post} />
                </div>
            ))}
            {loading && <p>Cargando...</p>}
            {!hasMore && <p className="text-center text-xs opacity-70">No hay más posts</p>}
        </div>
    );
}

