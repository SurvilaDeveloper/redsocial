// src/components/custom/postEdit.tsx

"use client";

import { useEffect, useState } from "react";
import EditPostForm from "./editPostForm";

type PostEditProps = {
    postId: number;
    session: any | null;
};

export function PostEdit({ postId, session }: PostEditProps) {
    const [post, setPost] = useState<Post | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const viewerId =
        session?.user?.id != null ? Number(session.user.id) : null;

    useEffect(() => {
        let cancelled = false;

        async function fetchPost() {
            try {
                setError(null);
                setLoading(true);

                const res = await fetch(`/api/posts/${postId}`, {
                    method: "GET",
                    cache: "no-store",
                });

                const json = await res.json().catch(() => null);

                if (!res.ok || !json?.data) {
                    if (!cancelled) {
                        setError(json?.error ?? "No se pudo cargar el post");
                        setPost(null);
                    }
                    return;
                }

                const data = json.data as Post;

                if (!cancelled) {
                    setPost(data);

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
                    setPost(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        // si no hay sesión, igual intentamos cargar,
        // pero luego abajo bloqueamos edición
        fetchPost();

        return () => {
            cancelled = true;
        };
    }, [postId, viewerId]);

    // 🔒 Sin sesión no debería poder editar (doble protección)
    if (!session?.user?.id) {
        return (
            <div className="w-full rounded-xl border border-yellow-500/60 bg-yellow-950/40 px-4 py-3 text-sm text-yellow-100">
                Debes iniciar sesión para editar un post.
            </div>
        );
    }

    if (loading && !post) {
        return (
            <div className="w-full flex items-center justify-center py-10 text-sm text-slate-300">
                Cargando post...
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
                No se encontró el post.
            </div>
        );
    }

    // 🚯 Si el post está eliminado (en papelera), no dejamos editarlo
    const deletedAt = (post as any).deletedAt as string | null | undefined;
    if (deletedAt) {
        return (
            <div className="w-full rounded-xl border border-red-500/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                Este post está en la papelera (eliminado). Primero debes
                restaurarlo desde la papelera para poder editarlo.
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

