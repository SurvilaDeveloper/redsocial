//src/components/business/editor/BusinessPagesStudio.tsx
"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ExternalLink, Loader2, Trash2 } from "lucide-react";

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

export function BusinessPagesStudio({
    businessId,
    businessSlug,
    businessName,
    pages,
}: {
    businessId: number;
    businessSlug: string;
    businessName: string;
    pages: { id: number; slug: string; title: string; updatedAt: Date }[];
}) {
    const router = useRouter();
    const [title, setTitle] = useState("Sobre nosotros");
    const [slug, setSlug] = useState("about");

    const [pending, startTransition] = useTransition();
    const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

    async function createPage() {
        setStatus(null);
        const s = normalizeSlug(slug);
        if (!s) return setStatus({ ok: false, msg: "Slug requerido." });

        startTransition(async () => {
            try {
                const res = await fetch(`/api/business/${businessId}/pages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, slug: s }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setStatus({ ok: false, msg: data?.error || "No se pudo crear." });
                    return;
                }

                setStatus({ ok: true, msg: "Creada ✅" });
                router.refresh();
            } catch {
                setStatus({ ok: false, msg: "Error de red." });
            }
        });
    }

    async function deletePage(pageId: number) {
        if (!confirm("¿Borrar esta página?")) return;

        startTransition(async () => {
            try {
                const res = await fetch(`/api/business/pages/${pageId}`, { method: "DELETE" });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setStatus({ ok: false, msg: data?.error || "No se pudo borrar." });
                    return;
                }
                setStatus({ ok: true, msg: "Borrada ✅" });
                router.refresh();
            } catch {
                setStatus({ ok: false, msg: "Error de red." });
            }
        });
    }

    return (
        <div className="min-h-dvh bg-slate-950 text-slate-100">
            <div className="border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900">
                <div className="mx-auto w-full max-w-6xl px-3 py-6">
                    <div className="text-xl font-semibold">Páginas</div>
                    <div className="text-sm text-slate-400 mt-1">
                        Negocio: <span className="text-slate-200">{businessName}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                            href={`/b/${businessSlug}/home`}
                            target="_blank"
                            className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        >
                            <ExternalLink size={16} className="mr-2 opacity-80" />
                            Ver público en /components/business/editor/BusinessPagesEditor.tsx
                        </Link>

                        {status && (
                            <span className={cn("text-sm", status.ok ? "text-emerald-300" : "text-red-300")}>
                                {status.msg}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <main className="mx-auto w-full max-w-6xl px-3 py-6 flex flex-col gap-4">
                <Card className="bg-slate-950 border-slate-800 p-4 rounded-2xl">
                    <div className="text-sm font-semibold">Crear página</div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
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

                    <div className="mt-3">
                        <Button
                            onClick={createPage}
                            disabled={pending}
                            className="rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/20"
                        >
                            {pending ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} className="mr-2" />
                                    Crear
                                </>
                            )}
                        </Button>
                    </div>
                </Card>

                <div className="flex flex-col gap-3">
                    {pages.map((p) => (
                        <Card key={p.id} className="bg-slate-950 border-slate-800 p-4 rounded-2xl">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="text-sm font-semibold">{p.title}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        /b/{businessSlug}/{p.slug}
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Link
                                            href={`/studio/business/${businessId}/pages/${p.id}`}
                                            className="text-sm px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                        >
                                            Editar contenido
                                        </Link>

                                        <Link
                                            href={`/b/${businessSlug}/${p.slug}`}
                                            target="_blank"
                                            className="text-sm px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                        >
                                            Ver público en /components/business/editor/BusinessPagesEditor.tsx 2
                                        </Link>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => deletePage(p.id)}
                                    className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                    title="Borrar página"
                                    disabled={pending}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}
