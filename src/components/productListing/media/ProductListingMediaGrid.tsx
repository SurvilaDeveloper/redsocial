// src/components/productListing/media/ProductListingMediaGrid.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    addProductListingMedia,
    removeProductListingMedia,
    reorderProductListingMedia,
} from "@/actions/product-listing-media-actions";
import type { ListingMedia } from "../editor/ProductListingEditor";

const MAX = 6;

async function uploadProductListingMedia(file: File) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload-product-listing-media", {
        method: "POST",
        body: fd,
    });

    const json = await res.json();
    if (!res.ok) {
        throw new Error(json?.error || "Error subiendo archivo");
    }

    return {
        type: (json.type as "image" | "video") ?? "image",
        url: json.url as string,
        publicId: json.publicId as string,
        thumbnailUrl: (json.thumbUrl as string | null) ?? null,
        thumbnailPublicId: (json.thumbPublicId as string | null) ?? null,
        format: (json.format as string | null) ?? null,
        durationSec: (json.durationSec as number | null) ?? null,
    };
}

function slotLabel(i: number) {
    return `Media ${i}/${MAX}`;
}

function sortByIndex(list: ListingMedia[]) {
    return [...list].sort((a, b) => a.index - b.index);
}

function clampInt(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export function ProductListingMediaGrid({
    listingId,
    initialMedia,
}: {
    listingId: number;
    initialMedia: ListingMedia[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [items, setItems] = useState<ListingMedia[]>(() => sortByIndex(initialMedia));
    const [error, setError] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    const dragIdRef = useRef<number | null>(null);

    useEffect(() => {
        setItems(sortByIndex(initialMedia));
    }, [initialMedia]);

    const filled = items.filter((m) => (m.active ?? 1) === 1).length;

    const orderedIds = useMemo(() => sortByIndex(items).map((m) => m.id), [items]);

    const onUpload = (file: File) => {
        setError(null);
        setOkMsg(null);

        startTransition(async () => {
            try {
                if (filled >= MAX) {
                    setError(`Máximo ${MAX} medias.`);
                    return;
                }

                const up = await uploadProductListingMedia(file);

                const res = await addProductListingMedia(listingId, {
                    type: up.type,
                    url: up.url,
                    publicId: up.publicId,
                    thumbnailUrl: up.thumbnailUrl ?? undefined,
                    thumbnailPublicId: up.thumbnailPublicId ?? undefined,
                    durationSec: up.durationSec ?? undefined,
                    format: up.format ?? undefined,
                });

                if (!res.ok) {
                    setError(res.error ?? "No se pudo agregar media.");
                    return;
                }

                setItems((prev) => {
                    // ✅ garantizamos index:number en UI (aunque el action se tipée como number|null)
                    const nextIndex = (res as any).index ?? (sortByIndex(prev).length + 1);
                    return sortByIndex([
                        ...prev,
                        {
                            id: res.id,
                            type: up.type,
                            url: up.url,
                            thumbnailUrl: up.thumbnailUrl,
                            publicId: up.publicId,
                            thumbnailPublicId: up.thumbnailPublicId,
                            durationSec: up.durationSec,
                            format: up.format,
                            index: Number(nextIndex),
                            active: 1,
                        },
                    ]);
                });

                setOkMsg("Media agregada ✅");
                router.refresh();
            } catch (e: any) {
                setError(e?.message ?? "Error inesperado.");
            }
        });
    };

    const onRemove = (mediaId: number) => {
        setError(null);
        setOkMsg(null);

        startTransition(async () => {
            try {
                const res = await removeProductListingMedia(listingId, mediaId);
                if (!res.ok) {
                    setError(res.error ?? "No se pudo eliminar.");
                    return;
                }

                setItems((prev) => prev.filter((m) => m.id !== mediaId));
                setOkMsg("Eliminado ✅");
                router.refresh();
            } catch (e: any) {
                setError(e?.message ?? "Error inesperado.");
            }
        });
    };

    const commitReorder = (nextIds: number[]) => {
        setError(null);
        setOkMsg(null);

        startTransition(async () => {
            try {
                const res = await reorderProductListingMedia(listingId, nextIds);
                if (!res.ok) {
                    setError(res.error ?? "No se pudo reordenar.");
                    return;
                }
                setOkMsg("Orden actualizado ✅");
                router.refresh();
            } catch (e: any) {
                setError(e?.message ?? "Error inesperado.");
            }
        });
    };

    const onDragStart = (id: number) => {
        dragIdRef.current = id;
    };

    const onDropOnSlot = (targetSlot: number) => {
        const fromId = dragIdRef.current;
        dragIdRef.current = null;

        if (!fromId) return;

        const ids = [...orderedIds];
        const fromIdx = ids.indexOf(fromId);
        if (fromIdx < 0) return;

        ids.splice(fromIdx, 1);

        const insertAt = clampInt(targetSlot - 1, 0, ids.length);
        ids.splice(insertAt, 0, fromId);

        setItems((prev) => {
            const map = new Map(prev.map((m) => [m.id, m]));
            return ids
                .map((id, idx) => {
                    const m = map.get(id);
                    if (!m) return null;
                    return { ...m, index: idx + 1 };
                })
                .filter(Boolean) as ListingMedia[];
        });

        commitReorder(ids);
    };

    const inputRef = useRef<HTMLInputElement | null>(null);

    return (
        <section className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold">Medios (hasta {MAX})</h2>
                    <p className="text-sm text-slate-400">
                        Subí imágenes o video. Podés arrastrar para reordenar (también sobre slots vacíos).
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={pending || filled >= MAX}
                        onClick={() => inputRef.current?.click()}
                        className={[
                            "px-3 py-2 text-sm rounded-xl border",
                            pending || filled >= MAX
                                ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-sky-600/20 border-sky-500/40 text-sky-200 hover:bg-sky-600/30",
                        ].join(" ")}
                        title={filled >= MAX ? `Máximo ${MAX}` : "Agregar media"}
                    >
                        {pending ? "Subiendo..." : "Agregar"}
                    </button>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            e.target.value = "";
                            if (f) onUpload(f);
                        }}
                    />
                </div>
            </div>

            {(error || okMsg) && (
                <div className="mt-4">
                    {error && (
                        <div className="text-sm text-red-300 border border-red-500/40 bg-red-500/10 rounded-xl p-3">
                            {error}
                        </div>
                    )}
                    {okMsg && (
                        <div className="text-sm text-emerald-200 border border-emerald-500/40 bg-emerald-500/10 rounded-xl p-3">
                            {okMsg}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: MAX }).map((_, slotIdx) => {
                    const slot = slotIdx + 1;
                    const item = sortByIndex(items).find((m) => m.index === slot) ?? null;

                    return (
                        <div
                            key={slot}
                            className={[
                                "rounded-xl border border-slate-800 bg-slate-900 overflow-hidden",
                                "min-h-[120px] flex flex-col",
                            ].join(" ")}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => onDropOnSlot(slot)}
                            title="Soltá acá para mover a este slot"
                        >
                            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                                <div className="text-[11px] text-slate-400">{slotLabel(slot)}</div>
                                <div className="text-[11px] text-slate-500">{item ? `#${item.id}` : "vacío"}</div>
                            </div>

                            {item ? (
                                <div
                                    className="p-3 flex-1 flex flex-col gap-2"
                                    draggable
                                    onDragStart={() => onDragStart(item.id)}
                                    title="Arrastrá para reordenar"
                                >
                                    <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                                        {item.type === "video" ? (
                                            <video
                                                controls
                                                className="w-full h-[110px] object-cover"
                                                src={item.url ?? undefined}
                                            />
                                        ) : (
                                            <img
                                                alt="media"
                                                className="w-full h-[110px] object-cover"
                                                src={item.thumbnailUrl ?? item.url ?? undefined}
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-[11px] text-slate-500 truncate">
                                            {item.type.toUpperCase()}
                                            {item.format ? ` · ${item.format}` : ""}
                                            {item.durationSec != null ? ` · ${item.durationSec}s` : ""}
                                        </div>

                                        <button
                                            type="button"
                                            disabled={pending}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemove(item.id);
                                            }}
                                            className={[
                                                "px-2 py-1 text-xs rounded-lg border",
                                                pending
                                                    ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                                                    : "bg-red-500/10 border-red-500/30 text-red-200 hover:bg-red-500/15",
                                            ].join(" ")}
                                            title="Eliminar"
                                        >
                                            Eliminar
                                        </button>
                                    </div>

                                    <div className="text-[11px] text-slate-600 truncate">{item.publicId ?? ""}</div>
                                </div>
                            ) : (
                                <div className="p-3 flex-1 flex items-center justify-center text-sm text-slate-500">
                                    Slot vacío
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 text-[11px] text-slate-500">
                Tips: Arrastrá una tarjeta y soltala en cualquier slot (ocupado o vacío).
            </div>
        </section>
    );
}