//src/components/media/MediaPicker.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type CloudinaryImageItem = {
    id: number;
    url: string;
    publicId: string;
    createdAt?: string;
};

export function MediaPicker({
    open,
    onClose,
    onPick,
    initialQuery = "",
}: {
    open: boolean;
    onClose: () => void;
    onPick: (img: CloudinaryImageItem) => void;
    initialQuery?: string;
}) {
    const [q, setQ] = useState(initialQuery);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<CloudinaryImageItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const canShow = open === true;

    const fetchItems = async (query: string) => {
        setLoading(true);
        setError(null);
        try {
            const url = `/api/media?q=${encodeURIComponent(query)}&take=48`;
            const res = await fetch(url, { method: "GET" });
            if (!res.ok) throw new Error("No se pudo cargar media.");
            const data = await res.json();
            setItems(Array.isArray(data?.items) ? data.items : []);
        } catch (e: any) {
            setError(e?.message ?? "Error.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!canShow) return;
        fetchItems(q);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canShow]);

    const title = useMemo(() => (loading ? "Cargando..." : "Elegir imagen"), [loading]);

    if (!canShow) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3">
            <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
                {/* header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 p-4">
                    <div className="text-sm font-semibold text-slate-100">{title}</div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-200 hover:bg-slate-800"
                        title="Cerrar"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* search */}
                <div className="p-4">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
                        <Search size={16} className="opacity-70" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") fetchItems(q);
                            }}
                            placeholder="Buscar por publicId o url..."
                            className="w-full bg-transparent text-sm text-slate-100 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => fetchItems(q)}
                            className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                        >
                            Buscar
                        </button>
                    </div>

                    {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}

                    {/* grid */}
                    <div className={cn("mt-4 grid gap-3", "grid-cols-2 sm:grid-cols-3 md:grid-cols-4")}>
                        {items.map((it) => (
                            <button
                                key={it.id}
                                type="button"
                                onClick={() => onPick(it)}
                                className="group rounded-xl border border-slate-800 bg-slate-900 p-2 text-left hover:bg-slate-800"
                                title={it.publicId}
                            >
                                <div className="aspect-square overflow-hidden rounded-lg bg-slate-950">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={it.url}
                                        alt={it.publicId}
                                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="mt-2 line-clamp-1 text-xs text-slate-300">{it.publicId}</div>
                            </button>
                        ))}
                    </div>

                    {!loading && items.length === 0 ? (
                        <div className="mt-4 text-sm text-slate-400">No hay imágenes.</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
