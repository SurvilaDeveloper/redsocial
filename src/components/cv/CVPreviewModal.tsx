// src/components/cv/CVPreviewModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { EditorCV } from "@/types/cvEditor";
import type { CVStyleConfig } from "@/types/cvStyle";
import { CVPreviewSheet } from "./CVPreviewSheet";

type Props = {
    cv: EditorCV;
    onClose: () => void;
    styleConfig: CVStyleConfig;
};

const ZOOMS = [80, 100, 125] as const;

export function CVPreviewModal({ cv, onClose, styleConfig }: Props) {
    const [zoom, setZoom] = useState<(typeof ZOOMS)[number]>(100);
    const scale = useMemo(() => zoom / 100, [zoom]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return createPortal(
        <div className="cv-preview-modal fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-auto">
            <div className="w-full max-w-5xl">
                <div className="cv-preview-toolbar flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-white text-sm">Zoom</span>
                        {ZOOMS.map((z) => (
                            <Button
                                key={z}
                                variant={z === zoom ? "default" : "secondary"}
                                size="sm"
                                onClick={() => setZoom(z)}
                            >
                                {z}%
                            </Button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => window.print()}>
                            Imprimir/Descargar PDF
                        </Button>

                        <Button size="sm" onClick={onClose}>
                            Cerrar
                        </Button>
                    </div>
                </div>

                <CVPreviewSheet cv={cv} styleConfig={styleConfig} scale={scale} />
            </div>
        </div>,
        document.body
    );
}