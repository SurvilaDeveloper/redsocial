// src/components/custom/share/ShareWithFriendModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MiniUser = {
    id: number;
    name: string;
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
    const [friends, setFriends] = useState<MiniUser[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [shareLoadingId, setShareLoadingId] = useState<number | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    // reset cuando abre
    useEffect(() => {
        if (!open) return;
        setMsg(null);
        setQ("");
        setFriends([]);
    }, [open]);

    // fetch friends (con debounce simple)
    useEffect(() => {
        if (!open) return;

        let alive = true;
        const t = setTimeout(async () => {
            setLoadingFriends(true);
            try {
                const res = await fetch(`/api/friends?limit=50&q=${encodeURIComponent(q)}`, {
                    cache: "no-store",
                });
                const data = await res.json().catch(() => null);
                if (!alive) return;
                setFriends((data?.friends ?? []) as MiniUser[]);
            } catch {
                if (!alive) return;
                setFriends([]);
            } finally {
                if (!alive) return;
                setLoadingFriends(false);
            }
        }, 250);

        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [open, q]);

    const shareToFriend = async (wallUserId: number) => {
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
                // mensajes útiles
                const m =
                    res.status === 409 ? "Ya compartiste este post en ese muro." :
                        res.status === 403 ? (data?.error ?? "No tenés permiso para compartir ahí.") :
                            data?.error ?? `Error (HTTP ${res.status})`;
                setMsg(m);
                return;
            }

            setMsg("Compartido ✅");
            onShared?.(wallUserId);

            // cerramos luego de un toque para que se vea el feedback
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
                    <div className="text-sm text-slate-100 font-semibold">Compartir con un amigo</div>
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
                        placeholder="Buscar amigo…"
                        className="w-full h-10 rounded-xl bg-black border border-slate-800 px-3 text-slate-100 outline-none"
                    />

                    <div className="max-h-[52dvh] overflow-y-auto rounded-xl border border-slate-800 bg-black">
                        {loadingFriends ? (
                            <div className="p-3 text-xs text-slate-300">Cargando amigos…</div>
                        ) : friends.length === 0 ? (
                            <div className="p-3 text-xs text-slate-300">No se encontraron amigos.</div>
                        ) : (
                            <ul className="divide-y divide-slate-800">
                                {friends.map((u) => {
                                    const avatar = u.imageUrl ?? u.image ?? null;
                                    const isLoading = shareLoadingId === u.id;
                                    return (
                                        <li key={u.id} className="p-3 flex items-center justify-between gap-3">
                                            <Link href={`/wall/${u.id}`} className="flex items-center gap-2 min-w-0">
                                                {avatar ? (
                                                    <img
                                                        src={avatar}
                                                        alt="avatar"
                                                        className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800" />
                                                )}
                                                <span className="text-sm text-slate-100 truncate">{u.name}</span>
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => shareToFriend(u.id)}
                                                disabled={isLoading}
                                                className="h-8 px-3 rounded-lg border border-slate-700 text-xs text-slate-100 hover:bg-slate-900 disabled:opacity-60"
                                            >
                                                {isLoading ? "Compartiendo…" : "Compartir"}
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
