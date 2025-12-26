// src/app/(pages)/trash/TrashPageClient.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dateUtils";
import { restorePost, hardDeletePost } from "@/actions/post-action";

interface TrashPost extends Post {
    deletedAt: string | null;
}

export default function TrashPageClient() {
    const [posts, setPosts] = useState<TrashPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionPostId, setActionPostId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const fetchTrash = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch("/api/user-trash-posts", {
                    method: "GET",
                    cache: "no-store",
                });

                const json = await res.json();
                if (!res.ok) {
                    throw new Error(json?.error || "Error cargando papelera");
                }
                setPosts(json.data || []);
            } catch (err: any) {
                setError(err?.message ?? "Error cargando papelera");
            } finally {
                setLoading(false);
            }
        };

        fetchTrash();
    }, []);

    const handleRestore = (postId: number) => {
        setActionPostId(postId);
        startTransition(async () => {
            const res = await restorePost(postId);
            if (res?.error) {
                console.error(res.error);
                // opcional: mostrar mensaje
                return;
            }
            // Lo sacamos del listado local
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setActionPostId(null);
        });
    };

    const handleHardDelete = (postId: number) => {
        const ok = window.confirm(
            "¿Seguro que querés eliminar definitivamente este post? Esta acción no se puede deshacer."
        );
        if (!ok) return;

        setActionPostId(postId);
        startTransition(async () => {
            const res = await hardDeletePost(postId);
            if (res?.error) {
                console.error(res.error);
                // opcional: mostrar mensaje
                return;
            }
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setActionPostId(null);
        });
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-3 py-4 text-slate-100">
            <p className="text-xs text-slate-400 mb-4">
                Acá ves los posteos que eliminaste. Podés restaurarlos o
                eliminarlos definitivamente.
            </p>

            {loading && (
                <div className="text-sm text-slate-300">
                    Cargando papelera...
                </div>
            )}

            {error && (
                <div className="text-sm text-red-300 mb-2">
                    {error}
                </div>
            )}

            {!loading && posts.length === 0 && (
                <div className="text-sm text-slate-400">
                    La papelera está vacía.
                </div>
            )}

            <div className="flex flex-col gap-3">
                {posts.map((post) => {
                    const mainImage = post.images?.[0] ?? null;
                    const desc = (post.description ?? "").trim();
                    const shortDesc =
                        desc.length <= 50
                            ? desc || "Sin descripción"
                            : desc.slice(0, 50) + "…";

                    const created = formatDate(post.createdAt);
                    const deleted = post.deletedAt
                        ? formatDate(post.deletedAt)
                        : "—";

                    const busy = isPending && actionPostId === post.id;

                    return (
                        <div
                            key={post.id}
                            className="flex flex-row gap-3 items-center border border-slate-700 bg-slate-900/60 rounded-md px-3 py-2"
                        >
                            {/* Imagen chiquita */}
                            {mainImage ? (
                                <div className="w-16 h-16 flex-shrink-0 relative overflow-hidden rounded-md border border-slate-700 bg-black">
                                    <Image
                                        src={mainImage.imageUrl}
                                        alt={post.title ?? "Imagen"}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-16 h-16 flex-shrink-0 rounded-md border border-slate-700 bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                                    sin imagen
                                </div>
                            )}

                            {/* Texto */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-sm font-semibold truncate">
                                    {post.title || "(Sin título)"}
                                </h2>
                                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                                    {shortDesc}
                                </p>
                                <div className="mt-1 flex flex-col md:flex-row md:items-center md:gap-3 text-[10px] text-slate-400">
                                    <span>
                                        Creado:{" "}
                                        <span className="text-slate-200">
                                            {created}
                                        </span>
                                    </span>
                                    <span>
                                        Eliminado:{" "}
                                        <span className="text-red-300">
                                            {deleted}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex flex-col gap-1 ml-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() =>
                                        handleRestore(post.id)
                                    }
                                    className="h-7 text-[11px] px-2 bg-emerald-700 hover:bg-emerald-600"
                                >
                                    {busy && actionPostId === post.id
                                        ? "Procesando..."
                                        : "Restaurar"}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={busy}
                                    onClick={() =>
                                        handleHardDelete(post.id)
                                    }
                                    className="h-7 text-[11px] px-2"
                                >
                                    Eliminar definitivamente
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
