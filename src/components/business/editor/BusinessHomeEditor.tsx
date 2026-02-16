//src/components/business/editor/BusinessHomeEditor.tsx
"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, Save } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { BusinessPageContent } from "@/types/business-sections";
import { BusinessSectionsEditor } from "@/components/business/editor/BusinessSectionsEditor";

export function BusinessHomeEditor({
    businessId,
    businessSlug,
    businessName,
    initialHomeContent,
}: {
    businessId: number;
    businessSlug: string;
    businessName: string;
    initialHomeContent: BusinessPageContent;
}) {
    const [sections, setSections] = useState<BusinessPageContent>(
        Array.isArray(initialHomeContent) ? initialHomeContent : []
    );

    const [pending, startTransition] = useTransition();
    const [status, setStatus] = useState<null | { ok: boolean; msg: string; issues?: { path: string; message: string }[] }>(null);


    // tu ruta pública real de home parece ser /b/:slug (no /home)
    const previewHref = useMemo(() => `/b/${businessSlug}`, [businessSlug]);

    const backHref = useMemo(() => `/studio/business/${businessId}`, [businessId]);

    function save() {
        setStatus(null);
        startTransition(async () => {
            try {
                const res = await fetch(`/api/business/${businessId}/site`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ homeContent: sections }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));

                    const issues: Array<{ path?: string; message?: string }> = Array.isArray(data?.issues) ? data.issues : [];
                    const extra =
                        issues.length > 0
                            ? " · " + issues.slice(0, 3).map((i) => `${i.path || "?"}: ${i.message || "Invalid"}`).join(" | ")
                            : "";

                    setStatus({ ok: false, msg: (data?.error || "No se pudo guardar.") + extra });
                    return;
                }


                setStatus({ ok: true, msg: "Guardado ✅" });
            } catch {
                setStatus({ ok: false, msg: "Error de red." });
            }
        });
    }

    return (
        <div className="min-h-dvh bg-slate-950 text-slate-100">
            <div className="border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900">
                <div className="mx-auto w-full max-w-6xl px-3 py-6">
                    <div className="flex flex-col gap-2">
                        <div className="text-xl font-semibold">Editar Home</div>
                        <div className="text-sm text-slate-400">
                            Negocio: <span className="text-slate-200">{businessName}</span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {/* ✅ Volver al hub del negocio */}
                            <Link
                                href={backHref}
                                className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                title="Volver al panel del negocio"
                            >
                                <ArrowLeft size={16} className="mr-2 opacity-80" />
                                Volver
                            </Link>

                            <Button
                                onClick={save}
                                disabled={pending}
                                className="rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/20"
                            >
                                {pending ? (
                                    <>
                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} className="mr-2" />
                                        Guardar
                                    </>
                                )}
                            </Button>
                            {status && !status.ok && status.issues?.length ? (
                                <div className="mt-2 text-xs text-red-300 space-y-1">
                                    {status.issues.slice(0, 8).map((i, idx) => (
                                        <div key={idx}>
                                            <span className="text-red-200">{i.path}:</span> {i.message}
                                        </div>
                                    ))}
                                </div>
                            ) : null}


                            <Link
                                href={previewHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                title="Abrir público en otra pestaña"
                            >
                                <ExternalLink size={16} className="mr-2 opacity-80" />
                                Ver público
                            </Link>

                            {status && (
                                <span className={cn("text-sm", status.ok ? "text-emerald-300" : "text-red-300")}>
                                    {status.msg}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <main className="mx-auto w-full max-w-6xl px-3 py-6">
                <Card className="bg-slate-950 border-slate-800 p-4 rounded-2xl">
                    <BusinessSectionsEditor
                        value={sections}
                        onChange={setSections}
                        businessName={businessName}
                        showPreview
                    />
                </Card>
            </main>
        </div>
    );
}
