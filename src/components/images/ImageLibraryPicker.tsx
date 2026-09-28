// src/components/images/ImageLibraryPicker.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ImageAsset = {
    id?: number;
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
        case "cv.media":
            return "CV Media";
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
    const [hidden, setHidden] = useState<Record<string, true>>({});

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDelete, setToDelete] = useState<ImageAsset | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    async function reload() {
        setLoading(true);

        try {
            const res = await fetch("/api/images/library", {
                cache: "no-store",
            });
            const data = await res.json().catch(() => null);

            setImages(data?.images ?? []);
            setHidden({});
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        reload();
    }, []);

    function openDelete(image: ImageAsset) {
        setDeleteError(null);
        setToDelete(image);
        setConfirmOpen(true);
    }

    function closeDelete() {
        if (deleting) return;

        setConfirmOpen(false);
        setDeleteError(null);
        setToDelete(null);
    }

    async function doDelete() {
        if (!toDelete?.publicId) return;

        setDeleting(true);
        setDeleteError(null);

        try {
            const isCv = toDelete.source === "cv.media";

            if (isCv && !toDelete.id) {
                setDeleteError("No se pudo identificar la imagen del CV.");
                return;
            }

            const res = await fetch(
                isCv ? "/api/cv/media/delete" : "/api/images/delete",
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(
                        isCv
                            ? { id: toDelete.id }
                            : { publicId: toDelete.publicId }
                    ),
                }
            );

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                setDeleteError(
                    data?.error ?? "No se pudo eliminar la imagen."
                );
                return;
            }

            await reload();
            setConfirmOpen(false);
            setToDelete(null);
            setDeleteError(null);
        } catch (error) {
            console.error("ImageLibraryPicker delete error:", error);
            setDeleteError("No se pudo completar la eliminación.");
        } finally {
            setDeleting(false);
        }
    }

    const visibleImages = useMemo(
        () => images.filter((im) => !hidden[im.publicId]),
        [images, hidden]
    );

    if (loading) {
        return (
            <div className="text-xs text-slate-400">
                Cargando imágenes…
            </div>
        );
    }

    if (visibleImages.length === 0) {
        return (
            <div className="text-xs text-slate-400">
                No hay imágenes para mostrar.
            </div>
        );
    }

    return (
        <>
            <div className="space-y-2 max-h-[300px] overflow-y-scroll">
                {visibleImages.map((img) => {
                    const selected = selectedUrl === img.url;

                    const previewSrc =
                        (img.thumbUrl ?? img.url) +
                        `?cb=${encodeURIComponent(img.publicId)}&t=${Date.now()}`;

                    return (
                        <div
                            key={img.publicId}
                            className={[
                                "flex flex-col sm:flex-row items-center gap-0 sm:gap-3 rounded-md border px-3 py-2",
                                "bg-slate-950/40",
                                selected
                                    ? "border-emerald-500"
                                    : "border-slate-800 hover:border-slate-600",
                            ].join(" ")}
                            role="button"
                            tabIndex={0}
                            title={img.publicId}
                        >
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-800 bg-slate-900 z-0">
                                <img
                                    src={previewSrc}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    onError={() => {
                                        // Conservamos el comportamiento actual.
                                    }}
                                />
                            </div>

                            <div className="min-w-0 w-full">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="text-sm font-medium text-slate-100">
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
                                        <Badge className="h-5 px-2 text-[10px]">
                                            Seleccionada
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                                    <span>Creada: {formatDate(img.createdAt)}</span>
                                    <span>
                                        {img.ownerTitle
                                            ? `Pertenece a: ${img.ownerTitle}`
                                            : "Pertenece a: —"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-row justify-between sm:justify-end items-center gap-2 w-full">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 border rounded-full"
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
                                        openDelete(img);
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

            <AlertDialog
                open={confirmOpen}
                onOpenChange={(open) => {
                    if (open) setConfirmOpen(true);
                    else closeDelete();
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción elimina definitivamente el asset de Cloudinary.
                            Si todavía está siendo usado por tu perfil, un post, un
                            listing, un CV o un sitio, primero tendrás que quitarlo de
                            ese contenido.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteError && (
                        <div
                            role="alert"
                            className="rounded-md border border-red-800/70 bg-red-950/40 px-3 py-2 text-xs text-red-200"
                        >
                            {deleteError}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={deleting}
                            onClick={closeDelete}
                        >
                            Cancelar
                        </AlertDialogCancel>

                        <Button
                            variant="destructive"
                            onClick={doDelete}
                            disabled={deleting}
                        >
                            {deleting ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
