//src/components/business/editor/BusinessCreateForm.tsx
"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function normalizeSlug(s: string) {
    return String(s)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
}

export function BusinessCreateForm() {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [headline, setHeadline] = useState("");
    const [category, setCategory] = useState("");

    const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

    const slugPreview = useMemo(() => normalizeSlug(slug || name), [slug, name]);

    async function submit() {
        setStatus(null);

        const finalName = name.trim();
        const finalSlug = normalizeSlug(slug || name);

        if (!finalName) return setStatus({ ok: false, msg: "Poné un nombre." });
        if (!finalSlug) return setStatus({ ok: false, msg: "Slug inválido." });

        startTransition(async () => {
            try {
                const res = await fetch("/api/business", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: finalName,
                        slug: finalSlug,
                        headline: headline.trim(),
                        category: category.trim(),
                    }),
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    setStatus({ ok: false, msg: data?.error || "No se pudo crear." });
                    return;
                }

                const businessId = data?.business?.id;
                if (!businessId) {
                    setStatus({ ok: false, msg: "Creado, pero faltó el id." });
                    return;
                }

                setStatus({ ok: true, msg: "Creado ✅" });
                router.push(`/studio/business/${businessId}/home`);
                router.refresh();
            } catch {
                setStatus({ ok: false, msg: "Error de red." });
            }
        });
    }

    return (
        <div className="min-h-dvh bg-slate-950 text-slate-100">
            <div className="border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900">
                <div className="mx-auto w-full max-w-3xl px-3 py-6">
                    <div className="text-xl font-semibold">Crear negocio</div>
                    <div className="text-sm text-slate-400 mt-1">
                        Tu negocio tendrá un micro-sitio público:{" "}
                        <span className="text-slate-200">/b/{slugPreview || "..."}</span>
                    </div>
                </div>
            </div>

            <main className="mx-auto w-full max-w-3xl px-3 py-6">
                <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
                    <div className="grid grid-cols-1 gap-3">
                        <Field label="Nombre del negocio">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value.slice(0, 80))}
                                className="h-10 rounded-xl bg-slate-900 border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
                                placeholder="Ej: Cafetería Luna"
                            />
                        </Field>

                        <Field label="Slug (URL)">
                            <input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="h-10 rounded-xl bg-slate-900 border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
                                placeholder="Ej: cafeteria-luna"
                            />
                            <div className="text-xs text-slate-500 mt-1">
                                URL pública: <span className="text-slate-300">/b/{slugPreview || "..."}</span>
                            </div>
                        </Field>

                        <Field label="Headline (opcional)">
                            <input
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value.slice(0, 120))}
                                className="h-10 rounded-xl bg-slate-900 border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
                                placeholder="Ej: Café de especialidad y pastelería"
                            />
                        </Field>

                        <Field label="Categoría (opcional)">
                            <input
                                value={category}
                                onChange={(e) => setCategory(e.target.value.slice(0, 60))}
                                className="h-10 rounded-xl bg-slate-900 border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
                                placeholder="Ej: Gastronomía / Servicios / Comercio"
                            />
                        </Field>

                        <div className="mt-2 flex items-center gap-2">
                            <Button
                                onClick={submit}
                                disabled={pending}
                                className="rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/20"
                            >
                                {pending ? (
                                    <>
                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} className="mr-2" />
                                        Crear
                                    </>
                                )}
                            </Button>

                            {status && (
                                <span className={cn("text-sm", status.ok ? "text-emerald-300" : "text-red-300")}>
                                    {status.msg}
                                </span>
                            )}
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="text-xs text-slate-400">{label}</div>
            {children}
        </div>
    );
}
