// src/components/custom/share/ShareWithFriendModal.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MiniUser = {
    id: number;
    name: string;
    nick?: string | null;
    imageUrl: string | null;
    image?: string | null;
};

export function ShareWithFriendModal({
    open,
    onClose,
    postId,
    onShared,
}: {
    open: boolean;
    onClose: () => void;
    postId: number;
    onShared?: (wallUserId: number) => void;
}) {
    const [q, setQ] = useState("");
    const [users, setUsers] = useState<MiniUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [shareLoadingId, setShareLoadingId] = useState<number | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setMsg(null);
        setQ("");
        setUsers([]);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        let alive = true;

        const timer = setTimeout(async () => {
            setLoadingUsers(true);

            try {
                const params = new URLSearchParams({
                    postId: String(postId),
                    limit: "50",
                    q,
                });

                const res = await fetch(
                    `/api/wall-entry/share-targets?${params.toString()}`,
                    { cache: "no-store" }
                );

                const data = await res.json().catch(() => null);

                if (!alive) return;

                if (!res.ok) {
                    setUsers([]);
                    setMsg(data?.error ?? "No se pudieron cargar los destinos.");
                    return;
                }

                setUsers((data?.users ?? []) as MiniUser[]);
                setMsg(null);
            } catch {
                if (!alive) return;
                setUsers([]);
                setMsg("No se pudieron cargar los destinos.");
            } finally {
                if (alive) setLoadingUsers(false);
            }
        }, 250);

        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [open, q, postId]);

    const shareToWall = async (wallUserId: number) => {
        if (!Number.isFinite(postId) || !Number.isFinite(wallUserId)) return;
        if (shareLoadingId != null) return;

        setMsg(null);
        setShareLoadingId(wallUserId);

        try {
            const res = await fetch("/api/wall-entry/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId, wallUserId }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                const message =
                    res.status === 409
                        ? "Este post ya está en ese muro."
                        : res.status === 403
                            ? data?.error ?? "No tenés permiso para compartir ahí."
                            : data?.error ?? `Error (HTTP ${res.status})`;

                setMsg(message);
                return;
            }

            setMsg("Compartido ✅");
            onShared?.(wallUserId);

            setTimeout(() => onClose(), 350);
        } catch {
            setMsg("Error de red al compartir.");
        } finally {
            setShareLoadingId(null);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-3">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="text-sm text-slate-100 font-semibold">
                        Compartir en un muro
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs px-2 py-1 rounded-full bg-black/60 text-slate-100 hover:bg-black"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-3">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar usuario…"
                        className="w-full h-10 rounded-xl bg-black border border-slate-800 px-3 text-slate-100 outline-none"
                    />

                    <div className="text-[11px] text-slate-400">
                        Sin búsqueda se muestran amigos que permiten compartir.
                        Al buscar también pueden aparecer seguidores u otros usuarios,
                        según la configuración de cada muro.
                    </div>

                    <div className="max-h-[52dvh] overflow-y-auto rounded-xl border border-slate-800 bg-black">
                        {loadingUsers ? (
                            <div className="p-3 text-xs text-slate-300">
                                Cargando destinos…
                            </div>
                        ) : users.length === 0 ? (
                            <div className="p-3 text-xs text-slate-300">
                                No hay muros disponibles para este post.
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-800">
                                {users.map((user) => {
                                    const avatar = user.imageUrl ?? user.image ?? null;
                                    const isLoading = shareLoadingId === user.id;

                                    return (
                                        <li
                                            key={user.id}
                                            className="p-3 flex items-center justify-between gap-3"
                                        >
                                            <Link
                                                href={`/wall/${user.id}`}
                                                className="flex items-center gap-2 min-w-0"
                                            >
                                                {avatar ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={avatar}
                                                        alt="avatar"
                                                        className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800" />
                                                )}

                                                <div className="min-w-0">
                                                    <div className="text-sm text-slate-100 truncate">
                                                        {user.name}
                                                    </div>
                                                    {user.nick && (
                                                        <div className="text-[11px] text-slate-500 truncate">
                                                            @{user.nick}
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => shareToWall(user.id)}
                                                disabled={isLoading}
                                                className="h-8 px-3 rounded-lg border border-slate-700 text-xs text-slate-100 hover:bg-slate-900 disabled:opacity-60"
                                            >
                                                {isLoading
                                                    ? "Compartiendo…"
                                                    : "Compartir"}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {msg && (
                        <div className="text-xs text-slate-200 border border-slate-800 rounded-xl bg-black px-3 py-2">
                            {msg}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
