"use client";

import { useEffect, useRef, useState } from "react";
import { PostCard } from "./postCard"; // Componente que muestra cada post

interface Post {
    id: number;
    title: string;
    description: string;
    image?: string;
    createdAt: string;

    images?: {
        id: number,
        image: string,
        index: number,
        post_user_id: number,
        post_id: number
    }[]
}

export default function PostList({ userId }: { userId: number }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);
    const lastPostRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        async function fetchPosts() {
            setLoading(true);
            const res = await fetch(`/api/user-posts?user_id=${userId}&page=${page}`);
            const data = await res.json();
            console.log("data: ", data);
            if (data.postImages && data.postImages.length === 0) {
                setHasMore(false);
            } else if (data.postImages) {
                setPosts((prev) => {
                    const existingIds = new Set(prev.map(post => post.id));
                    const newPosts = data.postImages.filter((post: { id: number; }) => !existingIds.has(post.id));
                    return [...prev, ...newPosts];
                });
            }

            setLoading(false);
        }

        fetchPosts();
    }, [page]); //quité userId

    useEffect(() => {
        if (!hasMore) return;
        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setPage((prev) => prev + 1);
            }
        });

        if (lastPostRef.current) {
            observer.current.observe(lastPostRef.current);
        }

        return () => observer.current?.disconnect();
    }, [posts, hasMore]);

    return (
        <div className="flex flex-col items-center space-y-4">
            {posts.map((post, index) => (
                <div
                    key={post.id}
                    ref={index === posts.length - 1 ? lastPostRef : null}
                >
                    <PostCard post={post} />
                </div>
            ))}
            {loading && <p>Cargando...</p>}
        </div>
    );
}
