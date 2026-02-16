//src/components/business/editor/BusinessSinglePageEditor.tsx
"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Save } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { BusinessPageContent } from "@/types/business-sections";
import { BusinessSectionsEditor } from "@/components/business/editor/BusinessSectionsEditor";

function normalizeSlug(s: string) {
    return String(s)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
}

function isReservedSlug(slug: string) {
    return ["home", "products", "services", "wall", "contact"].includes(slug);
}

//type Status = null | { ok: boolean; msg: string };

type Props = {
    mode: "create" | "edit";
    businessId: number;
    businessSlug: string;
    businessName: string;

    pageId?: number;
    initialTitle: string;
    initialSlug: string;
    initialContent: BusinessPageContent;
};

export function BusinessSinglePageEditor({
    mode,
    businessId,
    businessSlug,
    businessName,
    pageId,
    initialTitle,
    initialSlug,
    initialContent,
}: Props) {
    const router = useRouter();

    const [title, setTitle] = useState(initialTitle);
    const [slug, setSlug] = useState(initialSlug);
    const [content, setContent] = useState<BusinessPageContent>(initialContent ?? []);

    const [pending, startTransition] = useTransition();
    const [status, setStatus] = useState<null | { ok: boolean; msg: string; issues?: { path: string; message: string }[] }>(null);


    const normalizedSlug = useMemo(() => normalizeSlug(slug), [slug]);
    const publicHref = useMemo(
        () => `/b/${businessSlug}/${normalizedSlug || ""}`,
        [businessSlug, normalizedSlug]
    );

    const backToBusinessHref = `/studio/business/${businessId}`;
    const backToPagesHref = `/studio/business/${businessId}/pages`;

    async function saveAll() {
        setStatus(null);

        const s = normalizeSlug(slug);

        if (!title.trim()) return setStatus({ ok: false, msg: "Título requerido." });
        if (!s) return setStatus({ ok: false, msg: "Slug requerido." });
        if (isReservedSlug(s)) return setStatus({ ok: false, msg: "Slug reservado." });

        if (mode === "edit" && !pageId) {
            return setStatus({ ok: false, msg: "pageId inválido para edición." });
        }

        startTransition(async () => {
            try {
                const res =
                    mode === "edit"
                        ? await fetch(`/api/business/pages/${pageId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ title: title.trim(), slug: s, content }),
                        })
                        : await fetch(`/api/business/${businessId}/pages`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ title: title.trim(), slug: s, content }),
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


                const data = await res.json().catch(() => ({}));
                setSlug(s);

                if (mode === "create") {
                    const newId = Number(data?.id ?? data?.pageId);
                    if (newId) {
                        setStatus({ ok: true, msg: "Creada ✅ Redirigiendo..." });
                        router.push(`/studio/business/${businessId}/pages/${newId}`);
                        router.refresh();
                        return;
                    }
                    setStatus({ ok: true, msg: "Creada ✅" });
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
            {/* Header consistente con HomeEditor */}
            <div className="border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900">
                <div className="mx-auto w-full max-w-6xl px-3 py-6">
                    <div className="text-xl font-semibold">
                        {mode === "create" ? "Crear página" : "Editar página"}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                        Negocio: <span className="text-slate-200">{businessName}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1 sm:col-span-2">
                            <div className="text-xs text-slate-400">Título</div>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                                className="h-10 rounded-xl bg-slate-900 border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="text-xs text-slate-400">Slug</div>
                            <input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="h-10 rounded-xl bg-slate-900 border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                        <Button
                            onClick={saveAll}
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
                            href={publicHref}
                            target="_blank"
                            className={cn(
                                "inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800",
                                !normalizedSlug && "opacity-50 pointer-events-none"
                            )}
                        >
                            <ExternalLink size={16} className="mr-2 opacity-80" />
                            Ver público
                        </Link>

                        {/* navegación contextual */}
                        <Link
                            href={backToPagesHref}
                            className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        >
                            Volver a páginas
                        </Link>

                        <Link
                            href={backToBusinessHref}
                            className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        >
                            Volver
                        </Link>

                        {status && (
                            <span className={cn("text-sm", status.ok ? "text-emerald-300" : "text-red-300")}>
                                {status.msg}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <main className="mx-auto w-full max-w-6xl px-3 py-6">
                <Card className="bg-slate-950 border-slate-800 p-4 rounded-2xl">
                    <BusinessSectionsEditor
                        value={content}
                        onChange={setContent}
                        businessName={businessName}
                        showPreview
                    />
                </Card>
            </main>
        </div>
    );
}

export default BusinessSinglePageEditor;