// src/components/cv/media/CVImageSourcePicker.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    const [menuOpen, setMenuOpen] = useState(false);

    // Panels internos (se ven debajo del botón principal)
    const [globalOpen, setGlobalOpen] = useState(defaultOpen === "global");
    const [cvOpen, setCvOpen] = useState(defaultOpen === "cv");

    const [uploading, setUploading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement | null>(null);

    const openFile = () => fileRef.current?.click();

    // Si el componente viene con defaultOpen, abrimos el panel correspondiente (y el menú no hace falta abrirlo)
    useEffect(() => {
        if (defaultOpen === "global") {
            setGlobalOpen(true);
            setCvOpen(false);
        } else if (defaultOpen === "cv") {
            setCvOpen(true);
            setGlobalOpen(false);
        }
    }, [defaultOpen]);

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

            onSelect(picked);

            // UX: cerrar panel global y abrir CV (opcional) para ver la imagen recién creada en CurriculumMedia
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

            <div className="flex fle-row items-center justify-between">


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
                            Imagen elegida
                        </div>
                    </div>
                ) : null}

                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-slate-50 justify-between"
                            disabled={disabled || uploading}
                        >
                            Elegir imagen
                            <span className="ml-2 opacity-90">{menuOpen ? "▲" : "▼"}</span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="start"
                        className="w-[260px] border-slate-800 bg-slate-950 text-slate-100"
                    >
                        <DropdownMenuItem
                            className="text-xs cursor-pointer"
                            onSelect={(e) => {
                                e.preventDefault();
                                setGlobalOpen((v) => !v);
                                // opcional: que no queden ambos abiertos a la vez
                                if (!globalOpen) setCvOpen(false);
                                setMenuOpen(false);
                            }}
                        >
                            {globalOpen ? "Cerrar biblioteca global" : globalLabel}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className="text-xs cursor-pointer"
                            onSelect={(e) => {
                                e.preventDefault();
                                setCvOpen((v) => !v);
                                if (!cvOpen) setGlobalOpen(false);
                                setMenuOpen(false);
                            }}
                        >
                            {cvOpen ? "Cerrar imágenes del CV" : cvLabel}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-slate-800" />

                        <DropdownMenuItem
                            className="text-xs cursor-pointer"
                            onSelect={(e) => {
                                e.preventDefault();
                                setMenuOpen(false);
                                openFile();
                            }}
                        >
                            {uploading ? "Subiendo..." : uploadLabel}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>


            </div>

            {/* Botón principal + menú */}
            <div className="flex flex-col gap-2">

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
                                setGlobalOpen(false);
                            }}
                        />
                    </div>
                ) : null}

                {/* Panel imágenes del CV */}
                {cvOpen ? (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                        <div className="mb-2 text-xs text-slate-300">
                            Seleccioná una imagen que está guardada en tu CV:
                        </div>

                        <CVCurriculumMediaPicker
                            selectedUrl={valueUrl ?? null}
                            onSelect={(asset) => {
                                onSelect({
                                    url: asset.url,
                                    publicId: asset.publicId,
                                    id: asset.id,
                                    thumbUrl: asset.thumbUrl ?? null,
                                    source: "cv",
                                });
                                setCvOpen(false);
                            }}
                        />
                    </div>
                ) : null}

                {/* input hidden para upload */}
                *<input
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
        </div>
    );
}

