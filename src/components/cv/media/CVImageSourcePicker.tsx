// src/components/cv/media/CVImageSourcePicker.tsx
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

import { ImageLibraryPicker } from "@/components/images/ImageLibraryPicker";
import { CVCurriculumMediaPicker } from "@/components/cv/media/CVCurriculumMediaPicker";

type PickedImage = {
    url: string;
    source: "global" | "cv" | "upload";

    // disponibles solo si viene de CurriculumMedia (o upload que crea CurriculumMedia)
    publicId?: string | null;
    id?: number | null;
    thumbUrl?: string | null;
};

type Props = {
    curriculumId: number | null;

    disabled?: boolean;

    // ✅ El padre recibe SIEMPRE la url + metadata (si existe)
    onSelect: (img: PickedImage) => void;

    // opcional: preview actual
    valueUrl?: string | null;

    // labels
    globalLabel?: string;
    cvLabel?: string;
    uploadLabel?: string;

    // comportamiento
    defaultOpen?: "none" | "global" | "cv"; // default: none
    openCvPanelAfterUpload?: boolean; // default: true
};

export function CVImageSourcePicker({
    curriculumId,
    disabled,
    onSelect,
    valueUrl,

    globalLabel = "Elegir de tu biblioteca global",
    cvLabel = "Elegir de imágenes del CV",
    uploadLabel = "Subir una nueva imagen (CV)",

    defaultOpen = "none",
    openCvPanelAfterUpload = true,
}: Props) {
    const [globalOpen, setGlobalOpen] = useState(defaultOpen === "global");
    const [cvOpen, setCvOpen] = useState(defaultOpen === "cv");

    const [uploading, setUploading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement | null>(null);

    const openFile = () => fileRef.current?.click();

    const handleUpload = async (file: File) => {
        setErr(null);
        setUploading(true);

        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("curriculumId", String(curriculumId));

            // ✅ Endpoint que sube a Cloudinary y crea CurriculumMedia
            const res = await fetch("/api/cv/media/upload", {
                method: "POST",
                body: fd,
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.media?.url) {
                throw new Error(data?.error || "No se pudo subir la imagen");
            }

            const picked: PickedImage = {
                url: String(data.media.url),
                publicId: data.media.publicId ? String(data.media.publicId) : null,
                id: typeof data.media.id === "number" ? data.media.id : null,
                thumbUrl: data.media.thumbUrl ? String(data.media.thumbUrl) : null,
                source: "upload",
            };

            // ✅ El padre se entera sí o sí
            onSelect(picked);

            // UX: cerrar global y abrir CV (opcional) para ver la imagen recién creada en CurriculumMedia
            setGlobalOpen(false);
            if (openCvPanelAfterUpload) setCvOpen(true);
        } catch (e: any) {
            setErr(e?.message ?? "Error subiendo la imagen");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    return (
        <div className="space-y-3">
            {/* Preview opcional */}
            {valueUrl ? (
                <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={valueUrl}
                        alt="Imagen seleccionada"
                        className="h-12 w-12 rounded-md object-cover border border-slate-700 bg-slate-950"
                    />
                    <div className="text-xs text-slate-300 break-all line-clamp-2">
                        {valueUrl}
                    </div>
                </div>
            ) : null}

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                        setGlobalOpen((v) => !v);
                        // opcional: si abrís global, podés cerrar CV para no hacer scroll eterno
                        // setCvOpen(false);
                    }}
                    disabled={disabled || uploading}
                >
                    {globalOpen ? "Cerrar biblioteca global" : globalLabel}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                        setCvOpen((v) => !v);
                        // setGlobalOpen(false);
                    }}
                    disabled={disabled || uploading}
                >
                    {cvOpen ? "Cerrar imágenes del CV" : cvLabel}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    className="justify-start"
                    onClick={openFile}
                    disabled={disabled || uploading}
                >
                    {uploading ? "Subiendo..." : uploadLabel}
                </Button>

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f);
                    }}
                />
            </div>

            {err ? <div className="text-xs text-red-400">{err}</div> : null}

            {/* Panel biblioteca global */}
            {globalOpen ? (
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                    <div className="mb-2 text-xs text-slate-300">
                        Seleccioná una imagen de tu biblioteca global:
                    </div>

                    <ImageLibraryPicker
                        selectedUrl={valueUrl ?? null}
                        onSelect={(url) => {
                            onSelect({ url, source: "global" });
                            // UX: opcional cerrar al seleccionar
                            setGlobalOpen(false);
                        }}
                    />
                </div>
            ) : null}

            {/* Panel biblioteca del CV (CurriculumMedia) */}
            {cvOpen ? (
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                    <div className="mb-2 text-xs text-slate-300">
                        Seleccioná una imagen que está guardada en tu CV:
                    </div>

                    <CVCurriculumMediaPicker
                        curriculumId={curriculumId}
                        selectedUrl={valueUrl ?? null}
                        onSelect={(asset) => {
                            onSelect({
                                url: asset.url,
                                publicId: asset.publicId,
                                id: asset.id,
                                thumbUrl: asset.thumbUrl ?? null,
                                source: "cv",
                            });
                            // UX: opcional cerrar al seleccionar
                            setCvOpen(false);
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
}
