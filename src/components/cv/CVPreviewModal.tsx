// src/components/cv/CVPreviewModal.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

import type { Curriculum } from "@/types/cv";
import { CVPreviewSheet } from "./CVPreviewSheet";

type RemoteCvResponse = { cv: Curriculum } | { error: string };

type Props =
    | {
        // ✅ MODO LOCAL
        cv: Curriculum;
        onClose: () => void;
        userId?: never;
    }
    | {
        // ✅ MODO REMOTO
        userId: number;
        onClose: () => void;
        cv?: never;
    };

const ZOOMS = [80, 100, 125] as const;

function getPdfTitle(cv: Curriculum) {
    const raw = (cv?.title ?? "").trim();
    return raw.length ? raw : "CV";
}

export function CVPreviewModal(props: Props) {
    const [zoom, setZoom] = useState<(typeof ZOOMS)[number]>(100);
    const scale = useMemo(() => zoom / 100, [zoom]);

    const [mounted, setMounted] = useState(false);

    const isRemote = "userId" in props;
    const remoteUserId = isRemote ? props.userId : null;

    const [remoteCv, setRemoteCv] = useState<Curriculum | null>(null);

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "ok" | "notfound" | "forbidden" | "error">("idle");

    useEffect(() => {
        setMounted(true);
    }, []);

    // Cerrar con ESC
    useEffect(() => {
        if (!mounted) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") props.onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [mounted, props]);

    // ✅ Reset rápido si cambia el userId remoto
    useEffect(() => {
        if (!isRemote) return;
        setRemoteCv(null);
        setStatus("idle");
        setLoading(false);
    }, [isRemote, remoteUserId]);

    // ✅ Fetch remoto (solo si userId)
    useEffect(() => {
        if (!mounted) return;
        if (!isRemote) return;
        if (!remoteUserId) return;

        let cancelled = false;

        async function run() {
            setLoading(true);
            setStatus("idle");

            try {
                const res = await fetch(`/api/users/${remoteUserId}/cv/view`, {
                    method: "GET",
                    cache: "no-store",
                });

                if (cancelled) return;

                if (res.status === 404) {
                    setRemoteCv(null);
                    setStatus("notfound");
                    return;
                }

                if (res.status === 403) {
                    setRemoteCv(null);
                    setStatus("forbidden");
                    return;
                }

                if (!res.ok) {
                    setRemoteCv(null);
                    setStatus("error");
                    return;
                }

                const data = (await res.json()) as RemoteCvResponse;

                if (!("cv" in data)) {
                    setRemoteCv(null);
                    setStatus("error");
                    return;
                }

                setRemoteCv(data.cv ?? null);
                setStatus("ok");
            } catch {
                if (!cancelled) {
                    setRemoteCv(null);
                    setStatus("error");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [mounted, isRemote, remoteUserId]);

    const effectiveCv = useMemo(() => {
        if (isRemote) return remoteCv;
        return props.cv;
    }, [isRemote, remoteCv, props]);

    const handlePrint = useCallback(async () => {
        if (!effectiveCv) return;

        const previousTitle = document.title;

        try {
            document.title = getPdfTitle(effectiveCv);
            await new Promise((r) => setTimeout(r, 50));
            window.print();
        } finally {
            document.title = previousTitle;
        }
    }, [effectiveCv]);

    if (!mounted) return null;

    return createPortal(
        <div
            className="cv-preview-modal fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-auto"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) props.onClose();
            }}
        >
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
                                disabled={loading}
                            >
                                {z}%
                            </Button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrint}
                            disabled={!effectiveCv || loading}
                        >
                            Imprimir/Descargar PDF
                        </Button>

                        <Button size="sm" onClick={props.onClose}>
                            Cerrar
                        </Button>
                    </div>
                </div>

                {/* Estados modo remoto */}
                {isRemote && (loading || status !== "ok") ? (
                    <div className="rounded-lg bg-white p-6">
                        {loading && <p className="text-sm">Cargando CV…</p>}

                        {!loading && status === "notfound" && (
                            <>
                                <h2 className="text-lg font-semibold">Este usuario no tiene CV</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    No se encontró un CV asociado a este usuario.
                                </p>
                            </>
                        )}

                        {!loading && status === "forbidden" && (
                            <>
                                <h2 className="text-lg font-semibold">CV privado</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    El CV no está publicado.
                                </p>
                            </>
                        )}

                        {!loading && status === "error" && (
                            <>
                                <h2 className="text-lg font-semibold">No se pudo cargar el CV</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Ocurrió un error al obtener el CV. Probá nuevamente.
                                </p>
                            </>
                        )}
                    </div>
                ) : null}

                {/* Render */}
                {effectiveCv ? (
                    <div className="bg-black/0 rounded-lg overflow-hidden">
                        <CVPreviewSheet cv={effectiveCv} scale={scale} />
                    </div>
                ) : null}
            </div>
        </div>,
        document.body
    );
}

