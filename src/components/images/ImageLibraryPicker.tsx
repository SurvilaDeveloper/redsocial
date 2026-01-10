// src/components/images/ImageLibraryPicker.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ImageAsset = {
    publicId: string;
    url: string;
    thumbUrl?: string;
    source: string;
    createdAt?: string;
    active?: boolean;
    ownerTitle?: string | null;
    ownerId?: number | null;

};

function sourceLabel(source: string) {
    switch (source) {
        case "user.image":
            return "Foto de perfil";
        case "user.wall":
            return "Wall / portada";
        case "post.image":
            return "Post";
        case "productListing.media":
            return "Product listing";
        case "serviceListing.media":
            return "Service listing";
        case "cloudinary.index":
            return "CloudinaryImage (index)";
        default:
            return source;
    }
}

function formatDate(iso?: string) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-AR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function ImageLibraryPicker({
    selectedUrl,
    onSelect,
}: {
    selectedUrl?: string | null;
    onSelect: (url: string) => void;
}) {
    const [images, setImages] = useState<ImageAsset[]>([]);
    const [loading, setLoading] = useState(true);

    const [hidden, setHidden] = useState<Record<string, true>>({}); // ✅ items que fallaron
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDelete, setToDelete] = useState<ImageAsset | null>(null);
    const [deleting, setDeleting] = useState(false);

    async function reload() {
        setLoading(true);
        try {
            const res = await fetch("/api/images/library", { cache: "no-store" });
            const data = await res.json();
            setImages(data.images ?? []);
            setHidden({}); // reset al recargar
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        reload();
    }, []);

    async function doDelete() {
        if (!toDelete?.publicId) return;
        setDeleting(true);
        try {
            const res = await fetch("/api/images/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicId: toDelete.publicId }),
            });
            if (!res.ok) throw new Error("Delete failed");
            await reload();
            setConfirmOpen(false);
            setToDelete(null);
        } finally {
            setDeleting(false);
        }
    }

    const visibleImages = useMemo(
        () => images.filter((im) => !hidden[im.publicId]),
        [images, hidden]
    );

    if (loading) return <div className="text-xs text-slate-400">Cargando imágenes…</div>;

    if (visibleImages.length === 0) {
        return <div className="text-xs text-slate-400">No hay imágenes para mostrar.</div>;
    }

    return (
        <>
            <div className="space-y-2">
                {visibleImages.map((img) => {
                    const selected = selectedUrl === img.url;

                    // preview: thumb si existe + cache-busting (evita falsos positivos)
                    const previewSrc =
                        (img.thumbUrl ?? img.url) + `?cb=${encodeURIComponent(img.publicId)}&t=${Date.now()}`;

                    return (
                        <div
                            key={img.publicId}
                            className={[
                                "flex items-center gap-3 rounded-md border px-3 py-2",
                                "bg-slate-950/40",
                                selected ? "border-emerald-500" : "border-slate-800 hover:border-slate-600",
                            ].join(" ")}
                            onClick={() => onSelect(img.url)}
                            role="button"
                            tabIndex={0}
                            title={img.publicId}
                        >
                            {/* Thumbnail */}
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-800 bg-slate-900">
                                <img
                                    src={previewSrc}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    onError={() => {
                                        // ✅ si no existe / falla, ocultamos la fila completa
                                        //setHidden((prev) => ({ ...prev, [img.publicId]: true }));
                                    }}
                                />
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="text-sm font-medium text-slate-100 truncate">
                                        {sourceLabel(img.source)}
                                    </div>

                                    {typeof img.active === "boolean" && (
                                        <Badge
                                            variant={img.active ? "secondary" : "destructive"}
                                            className="h-5 px-2 text-[10px]"
                                        >
                                            {img.active ? "Activa" : "Inactiva"}
                                        </Badge>
                                    )}

                                    {selected && (
                                        <Badge className="h-5 px-2 text-[10px]">Seleccionada</Badge>
                                    )}
                                </div>

                                <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                                    <span>Creada: {formatDate(img.createdAt)}</span>
                                    <span className="truncate">
                                        {img.ownerTitle ? `Pertenece a: ${img.ownerTitle}` : "Pertenece a: —"}
                                    </span>
                                </div>

                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(img.url);
                                    }}
                                >
                                    Usar
                                </Button>

                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setToDelete(img);
                                        setConfirmOpen(true);
                                    }}
                                    title="Eliminar"
                                    aria-label="Eliminar"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción elimina la imagen de Cloudinary. Si la borrás, no la vas a poder recuperar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button variant="destructive" onClick={doDelete} disabled={deleting}>
                                Eliminar
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}


