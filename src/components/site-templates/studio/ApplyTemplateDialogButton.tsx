//src/components/site-templates/studio/ApplyTemplateDialogButton.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type ApplyMode = "style" | "full";

export function ApplyTemplateDialogButton({
    businessId,
    businessSlug,
    templateId,
    className,
}: {
    businessId: number;
    businessSlug: string;
    templateId: string;
    className?: string;
}) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<ApplyMode>("style");
    const [ack, setAck] = useState(false);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const isDestructive = mode === "full";

    const endpoint = useMemo(() => {
        return mode === "style"
            ? `/api/studio/business/${businessId}/apply-style-template`
            : `/api/studio/business/${businessId}/apply-template`;
    }, [mode, businessId]);

    const confirmDisabled = loading || (isDestructive && !ack);

    const title = mode === "style" ? "Aplicar estilos del template" : "Reemplazar sitio por el template";
    const description =
        mode === "style"
            ? "Cambia el look (tema, componentes y header) y conserva tu navegación, páginas y contenido."
            : "Reemplaza navegación, home, páginas y tema por el template. Tu contenido actual se perderá.";

    async function apply() {
        try {
            setErr(null);
            setLoading(true);

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setErr(String(data?.error ?? "No se pudo aplicar el template."));
                return;
            }

            setOpen(false);

            // ✅ abrir vista pública
            if (businessSlug) window.open(`/b/${businessSlug}/home`, "_blank");

            // ✅ refrescar studio
            router.refresh();
        } finally {
            setLoading(false);
        }
    }

    function onOpenChange(v: boolean) {
        setOpen(v);
        if (!v) {
            setErr(null);
            setLoading(false);
            setMode("style");
            setAck(false);
        }
    }

    return (
        <div className="flex flex-col gap-1">
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                    "px-3 py-2 text-sm rounded-xl border border-emerald-700/40",
                    "bg-emerald-600/10 hover:bg-emerald-600/15 text-emerald-200",
                    className
                )}
            >
                Aplicar…
            </button>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-lg border border-slate-800 bg-slate-950 text-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-slate-100">Aplicar template</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Elegí qué querés aplicar. Podés abrir la vista pública al finalizar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* ✅ Radios nativos (sin RadioGroup) */}
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="applyMode"
                                    value="style"
                                    checked={mode === "style"}
                                    onChange={() => {
                                        setMode("style");
                                        setErr(null);
                                        setAck(false);
                                    }}
                                    className="mt-1 accent-emerald-500"
                                />
                                <div className="flex-1">
                                    <div className="text-sm text-slate-100">
                                        Aplicar estilos (recomendado)
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        Cambia tema/colores/tipografías/componentes/header. Conserva tu contenido.
                                    </div>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="applyMode"
                                    value="full"
                                    checked={mode === "full"}
                                    onChange={() => {
                                        setMode("full");
                                        setErr(null);
                                        setAck(false);
                                    }}
                                    className="mt-1 accent-amber-500"
                                />
                                <div className="flex-1">
                                    <div className="text-sm text-slate-100">
                                        Aplicar todo (reemplaza tu sitio)
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        Reemplaza navegación, home, páginas y tema por el template. Útil si empezás de cero.
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div
                            className={cn(
                                "rounded-xl border p-3",
                                isDestructive
                                    ? "border-amber-800/40 bg-amber-900/10"
                                    : "border-slate-800 bg-slate-900/30"
                            )}
                        >
                            <div
                                className={cn(
                                    "text-sm font-medium",
                                    isDestructive ? "text-amber-200" : "text-slate-100"
                                )}
                            >
                                {title}
                            </div>
                            <div className={cn("mt-1 text-xs", isDestructive ? "text-amber-200/80" : "text-slate-400")}>
                                {description}
                            </div>

                            {isDestructive && (
                                <div className="mt-3 flex items-start gap-2">
                                    <Checkbox
                                        id="ack"
                                        checked={ack}
                                        onCheckedChange={(v) => setAck(Boolean(v))}
                                    />
                                    <Label htmlFor="ack" className="text-xs text-slate-300 leading-relaxed">
                                        Entiendo que esto reemplaza el contenido actual del sitio.
                                    </Label>
                                </div>
                            )}
                        </div>

                        {err && <div className="text-[11px] text-red-300">{err}</div>}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="rounded-xl border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="button"
                            onClick={apply}
                            disabled={confirmDisabled}
                            className={cn(
                                "rounded-xl",
                                isDestructive
                                    ? "bg-amber-600/15 text-amber-100 border border-amber-700/40 hover:bg-amber-600/20"
                                    : "bg-emerald-600/15 text-emerald-100 border border-emerald-700/40 hover:bg-emerald-600/20"
                            )}
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Aplicando...
                                </span>
                            ) : mode === "style" ? (
                                "Aplicar estilos"
                            ) : (
                                "Aplicar todo"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}