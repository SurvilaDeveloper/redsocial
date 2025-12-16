"use client";

import { useEffect, useRef, useState } from "react";
import { PostCard } from "./postCard"; // Componente que muestra cada post


export default function PostListLoggedHomeFriends({ session }: { session: any }) {
    //{ session }: (props);
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);
    const lastPostRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        async function fetchPosts() {
            setLoading(true);
            const res = await fetch(`/api/last-posts-friends?page=${page}`);
            const data = await res.json();
            console.log("data: ", data);
            if (data.allPosts && data.allPosts.length === 0) {
                setHasMore(false);
            } else if (data.allPosts) {
                setPosts((prev) => {
                    const existingIds = new Set(prev.map(post => post.id));
                    const newPosts = data.allPosts.filter((post: { id: number; }) => !existingIds.has(post.id));
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
        <div id="PostListLoggedHomeFriends" className="flex flex-col items-center space-y-4 w-[512px]  bg-blue-200"> friends***
            <p>* {session.user.id}</p>
            {posts.map((post, index) => (
                post.active === 1 ? (
                    <div
                        key={post.id}
                        ref={index === posts.length - 1 ? lastPostRef : null}
                    >
                        <PostCard session={session} post={post} />
                    </div>) :
                    (<div
                        key={post.id}
                        ref={index === posts.length - 1 ? lastPostRef : null}
                    >
                        {/*<PostCard post={post} />*/}
                    </div>)

            ))}
            {loading && <p>Cargando...</p>}
        </div>
    );
}