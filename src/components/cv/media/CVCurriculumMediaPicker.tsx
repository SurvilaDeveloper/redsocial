// src/components/cv/media/CVCurriculumMediaPicker.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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

type CVMediaAsset = {
    id: number;
    url: string;
    publicId: string;
    thumbUrl?: string | null;
    createdAt?: string;
    status?: "active" | "deleted";
};

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

export function CVCurriculumMediaPicker({
    curriculumId,
    selectedUrl,
    onSelect,
}: {
    curriculumId: number | null;
    selectedUrl?: string | null;
    onSelect: (asset: { url: string; publicId: string; id: number; thumbUrl?: string | null }) => void;
}) {
    const [images, setImages] = useState<CVMediaAsset[]>([]);
    const [loading, setLoading] = useState(true);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDelete, setToDelete] = useState<CVMediaAsset | null>(null);
    const [deleting, setDeleting] = useState(false);

    async function reload() {
        setLoading(true);
        try {
            const res = await fetch(`/api/cv/media/library?curriculumId=${curriculumId}`, { cache: "no-store" });
            const data = await res.json().catch(() => null);
            setImages(data?.images ?? []);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (curriculumId) reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [curriculumId]);

    async function doDelete() {
        if (!toDelete?.id) return;
        setDeleting(true);
        try {
            const res = await fetch("/api/cv/media/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: toDelete.id }),
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
        () => images.filter((im) => im.status !== "deleted"),
        [images]
    );

    if (loading) return <div className="text-xs text-slate-400">Cargando imágenes…</div>;
    if (visibleImages.length === 0) return <div className="text-xs text-slate-400">No hay imágenes para mostrar.</div>;

    return (
        <>
            <div className="space-y-2">
                {visibleImages.map((img) => {
                    const selected = selectedUrl === img.url;
                    const previewSrc = (img.thumbUrl ?? img.url) + `?cb=${encodeURIComponent(img.publicId)}&t=${Date.now()}`;

                    return (
                        <div
                            key={img.id}
                            className={[
                                "flex items-center gap-3 rounded-md border px-3 py-2",
                                "bg-slate-950/40",
                                selected ? "border-emerald-500" : "border-slate-800 hover:border-slate-600",
                            ].join(" ")}
                            onClick={() => onSelect({ url: img.url, publicId: img.publicId, id: img.id, thumbUrl: img.thumbUrl ?? null })}
                            role="button"
                            tabIndex={0}
                            title={img.publicId}
                        >
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-800 bg-slate-900">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="text-sm font-medium text-slate-100 truncate">CV Media</div>
                                    {selected && <Badge className="h-5 px-2 text-[10px]">Seleccionada</Badge>}
                                </div>

                                <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                                    <span>Creada: {formatDate(img.createdAt)}</span>
                                    <span className="truncate">ID: {img.id}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect({ url: img.url, publicId: img.publicId, id: img.id, thumbUrl: img.thumbUrl ?? null });
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
                            Esto borra la imagen de Cloudinary y la marca como eliminada en tu CV.
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
