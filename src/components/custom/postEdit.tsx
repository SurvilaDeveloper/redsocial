// src/components/custom/postEdit.tsx

"use client";

import { useState, useEffect } from "react";
import EditPostForm from "./editPostForm";
import { useSession } from "next-auth/react";

export function PostEdit({ postId }: { postId: number }) {
    const [post, setPost] = useState<Post | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { data: session, status } = useSession();

    useEffect(() => {
        let cancelled = false;

        async function fetchPost() {
            try {
                setError(null);
                const res = await fetch(`/api/posts/${postId}`, {
                    method: "GET",
                    cache: "no-store",
                });

                const json = await res.json().catch(() => null);

                if (!res.ok || !json?.data) {
                    if (!cancelled) {
                        setError(json?.error ?? "No se pudo cargar el post");
                    }
                    return;
                }

                const data = json.data as Post;

                if (!cancelled) {
                    setPost(data);

                    const viewerId =
                        session?.user?.id != null
                            ? Number(session.user.id)
                            : null;

                    setIsOwner(
                        viewerId != null &&
                        Number.isFinite(viewerId) &&
                        viewerId === data.user_id
                    );
                }
            } catch (err) {
                console.error("Error al obtener el post:", err);
                if (!cancelled) {
                    setError("Error al obtener el post");
                }
            }
        }

        fetchPost();

        return () => {
            cancelled = true;
        };
    }, [postId, session?.user?.id]);

    if (status === "loading" && !post) {
        return (
            <div className="w-full flex items-center justify-center py-10 text-sm text-slate-300">
                Cargando sesión...
            </div>
        );
    }

    if (error && !post) {
        return (
            <div className="w-full rounded-xl border border-red-500/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                {error}
            </div>
        );
    }

    if (!post) {
        return (
            <div className="w-full flex items-center justify-center py-10 text-sm text-slate-300">
                Cargando post...
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="w-full rounded-xl border border-yellow-500/60 bg-yellow-950/40 px-4 py-3 text-sm text-yellow-100">
                No eres el dueño de este post, no lo puedes editar.
            </div>
        );
    }

    return (
        <div className="w-full rounded-2xl bg-slate-950/60 border border-slate-800 px-4 py-4 md:px-5 md:py-5">
            <EditPostForm
                title={post.title}
                images={post.images && post.images.length > 0 ? post.images : null}
                description={post.description}
                postId={post.id}
            />

        </div>
    );
}
