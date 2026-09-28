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
import {
    getCloudinaryUploadErrorMessage,
    validateAuthenticatedImageFile,
} from "@/lib/cloudinary-functions";

type PickedImage = {
    url: string;
    source: "global" | "cv" | "upload";
    publicId?: string | null;
    id?: number | null;
    thumbUrl?: string | null;
};

type Props = {
    curriculumId: number | null;
    disabled?: boolean;
    onSelect: (img: PickedImage) => void;
    valueUrl?: string | null;
    globalLabel?: string;
    cvLabel?: string;
    uploadLabel?: string;
    defaultOpen?: "none" | "global" | "cv";
    openCvPanelAfterUpload?: boolean;
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
    const [globalOpen, setGlobalOpen] = useState(
        defaultOpen === "global"
    );
    const [cvOpen, setCvOpen] = useState(
        defaultOpen === "cv"
    );
    const [uploading, setUploading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement | null>(null);

    const openFile = () => fileRef.current?.click();

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

        try {
            validateAuthenticatedImageFile(file);
        } catch (error) {
            setErr(
                getCloudinaryUploadErrorMessage(
                    error,
                    "No se pudo usar ese archivo."
                )
            );

            if (fileRef.current) {
                fileRef.current.value = "";
            }

            return;
        }

        setUploading(true);

        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append(
                "curriculumId",
                curriculumId == null
                    ? "null"
                    : String(curriculumId)
            );

            const res = await fetch("/api/cv/media/upload", {
                method: "POST",
                body: fd,
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.media?.url) {
                throw new Error(
                    res.status === 401
                        ? "Tu sesión venció. Iniciá sesión nuevamente para continuar."
                        : data?.error ||
                              "No se pudo subir la imagen"
                );
            }

            const picked: PickedImage = {
                url: String(data.media.url),
                publicId: data.media.publicId
                    ? String(data.media.publicId)
                    : null,
                id:
                    typeof data.media.id === "number"
                        ? data.media.id
                        : null,
                thumbUrl: data.media.thumbUrl
                    ? String(data.media.thumbUrl)
                    : null,
                source: "upload",
            };

            onSelect(picked);
            setGlobalOpen(false);

            if (openCvPanelAfterUpload) {
                setCvOpen(true);
            }
        } catch (error) {
            setErr(
                getCloudinaryUploadErrorMessage(
                    error,
                    "Error subiendo la imagen"
                )
            );
        } finally {
            setUploading(false);

            if (fileRef.current) {
                fileRef.current.value = "";
            }
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-row items-center justify-between">
                {valueUrl ? (
                    <div className="flex items-center gap-3">
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

                <DropdownMenu
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                >
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-slate-50 justify-between"
                            disabled={disabled || uploading}
                        >
                            Elegir imagen
                            <span className="ml-2 opacity-90">
                                {menuOpen ? "▲" : "▼"}
                            </span>
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
                                if (!globalOpen) setCvOpen(false);
                                setMenuOpen(false);
                            }}
                        >
                            {globalOpen
                                ? "Cerrar biblioteca global"
                                : globalLabel}
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
                            {cvOpen
                                ? "Cerrar imágenes del CV"
                                : cvLabel}
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
                            {uploading
                                ? "Subiendo..."
                                : uploadLabel}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex flex-col gap-2">
                {globalOpen ? (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                        <div className="mb-2 text-xs text-slate-300">
                            Seleccioná una imagen de tu biblioteca global:
                        </div>

                        <ImageLibraryPicker
                            selectedUrl={valueUrl ?? null}
                            onSelect={(url) => {
                                onSelect({
                                    url,
                                    source: "global",
                                });
                                setGlobalOpen(false);
                            }}
                        />
                    </div>
                ) : null}

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
                                    publicId:
                                        asset.publicId,
                                    id: asset.id,
                                    thumbUrl:
                                        asset.thumbUrl ??
                                        null,
                                    source: "cv",
                                });
                                setCvOpen(false);
                            }}
                        />
                    </div>
                ) : null}

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                    }}
                />
            </div>

            {err ? (
                <div className="text-xs text-red-400">
                    {err}
                </div>
            ) : null}
        </div>
    );
}
