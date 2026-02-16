// src/components/business/sections/ProductiveListingModal.tsx
"use client";

import React from "react";
import { X, Loader2 } from "lucide-react";
import { ImagesSwiperSites } from "@/components/custom/ImagesSwiperSites";

type ListingType = "product" | "service";

type ListingMedia = {
    id: number;
    type: "image" | "video";
    url: string | null;
    thumbnailUrl: string | null;
    publicId: string | null;
    thumbnailPublicId: string | null;
    durationSec: number | null;
    format: string | null;
    index: number;
    active: number | null;
};

type ListingDetail = {
    id: number;
    title: string | null;
    description: string | null;
    clarifications: string | null;
    price: string | null;
    currency: string | null;
    createdAt: string;
    media: ListingMedia[];
    // service extras (si vienen)
    durationMinutes?: number | null;
    modality?: string | null;
    location?: string | null;

    coverUrl?: string | null;
};

type Props = {
    open: boolean;
    onClose: () => void;
    type: ListingType;
    listingId: number | null;
};

type MediaItem = { id: number; url: string; publicId: string };
type MediaMap = Record<number, MediaItem>;

function buildMediaMapFromListing(listing: ListingDetail | null): MediaMap {
    const out: MediaMap = {};
    const media = (listing?.media ?? []).slice().sort((a, b) => (a.index ?? 999) - (b.index ?? 999));

    for (const m of media) {
        const url = (m.thumbnailUrl ?? m.url) ?? null;
        const publicId = (m.thumbnailPublicId ?? m.publicId) ?? null;
        if (!url || !publicId) continue;
        out[m.id] = { id: m.id, url, publicId };
    }

    return out;
}

export function ProductiveListingModal({ open, onClose, type, listingId }: Props) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [listing, setListing] = React.useState<ListingDetail | null>(null);

    // ✅ control del swiper para click de thumb => visor
    const [slide, setSlide] = React.useState(0);

    const mediaMap = React.useMemo(() => buildMediaMapFromListing(listing), [listing]);
    const mediaCount = React.useMemo(() => Object.keys(mediaMap ?? {}).length, [mediaMap]);

    React.useEffect(() => {
        if (!open) return;
        if (!listingId) return;

        let cancelled = false;

        setLoading(true);
        setError(null);
        setListing(null);
        setSlide(0);

        (async () => {
            try {
                const res = await fetch(`/api/listings/detail?type=${type}&id=${listingId}`, { cache: "no-store" });
                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    if (cancelled) return;
                    setError(data?.error || "No se pudo cargar el listing.");
                    return;
                }

                if (cancelled) return;
                setListing(data?.listing ?? null);
            } catch (e: any) {
                if (cancelled) return;
                setError(e?.message || "Error inesperado.");
            } finally {
                if (cancelled) return;
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, type, listingId]);

    // cerrar con ESC
    React.useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80]">
            {/* backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/70"
                onClick={onClose}
                aria-label="Cerrar"
            />

            {/* panel */}
            <div className="absolute inset-0 flex items-center justify-center p-3">
                <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 shadow-xl overflow-hidden">
                    {/* header */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800">
                        <div className="min-w-0">
                            <div className="text-sm text-slate-400">
                                {type === "product" ? "Producto" : "Servicio"} · #{listingId ?? ""}
                            </div>
                            <div className="text-base font-semibold text-slate-100 truncate">
                                {listing?.title?.trim() ? listing.title : "Detalle"}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                            title="Cerrar"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* body */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                        {/* media */}
                        <div className="border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950">
                            <div className="p-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden h-auto">
                                    {loading ? (
                                        <div className="h-full flex items-center justify-center text-slate-400">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : mediaCount > 0 ? (
                                        <div className="h-full">
                                            {/* ✅ fit=height para que ocupe el panel */}
                                            <ImagesSwiperSites
                                                mediaMap={mediaMap}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-sm text-slate-500">
                                            Sin imágenes
                                        </div>
                                    )}
                                </div>

                                {/* hint */}
                                {mediaCount > 1 && !loading && (
                                    <div className="mt-2 text-[11px] text-slate-500">
                                        Tip: tocá un thumbnail para cambiar la imagen.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* info */}
                        <div className="p-4">
                            {error && (
                                <div className="text-sm text-red-300 border border-red-500/40 bg-red-500/10 rounded-xl p-3">
                                    {error}
                                </div>
                            )}

                            {!error && (
                                <>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm text-slate-200">
                                            {listing?.price ? (
                                                <span className="font-semibold">
                                                    {listing.currency ?? "ARS"} {listing.price}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">Sin precio</span>
                                            )}
                                        </div>

                                        {/* service extras */}
                                        {type === "service" && (
                                            <div className="text-xs text-slate-400">
                                                {listing?.durationMinutes ? `${listing.durationMinutes} min` : ""}
                                                {listing?.modality ? ` · ${listing.modality}` : ""}
                                                {listing?.location ? ` · ${listing.location}` : ""}
                                            </div>
                                        )}
                                    </div>

                                    {!!listing?.description?.trim() && (
                                        <div className="mt-3">
                                            <div className="text-xs text-slate-400">Descripción</div>
                                            <div className="mt-1 text-sm text-slate-100 whitespace-pre-wrap">
                                                {listing.description}
                                            </div>
                                        </div>
                                    )}

                                    {!!listing?.clarifications?.trim() && (
                                        <div className="mt-3">
                                            <div className="text-xs text-slate-400">Aclaraciones</div>
                                            <div className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">
                                                {listing.clarifications}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* footer */}
                    <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

