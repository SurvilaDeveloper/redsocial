"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, Save } from "lucide-react";

import type { BusinessNavItem } from "@/types/business";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

import BackToStudioBusiness from "@/components/custom/BackToStudioBusiness";

type PageLite = { id: number; slug: string; title: string };
type UiNavItem = Omit<BusinessNavItem, "order"> & { order: number; _key: string };

type Props = {
    businessId: number;
    businessSlug: string;
    businessName: string;
    initialNav: BusinessNavItem[];
    pages: PageLite[];
};

const KIND_LABEL: Record<BusinessNavItem["kind"], string> = {
    home: "Inicio (Home)",
    page: "Página",
    contact: "Contacto",
};

function isPageItem(item: BusinessNavItem): item is Extract<BusinessNavItem, { kind: "page" }> {
    return item.kind === "page";
}

function makeKey() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `k_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

// En el editor, el orden ES el índice del array.
function normalizeForEditor(list: BusinessNavItem[]): UiNavItem[] {
    const base = Array.isArray(list) ? list : [];
    return base
        .slice()
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
        .map((it, idx) => ({
            ...it,
            order: idx,
            _key: makeKey(),
        }));
}

function defaultTitleFor(item: Pick<BusinessNavItem, "kind" | "slug">) {
    if (item.kind === "home") return "Inicio";
    if (item.kind === "contact") return "Contacto";
    switch (item.slug) {
        case "productos":
            return "Productos";
        case "novedades":
            return "Novedades";
        case "sobre-nosotros":
            return "Sobre nosotros";
        default:
            return "Página";
    }
}

export function BusinessNavEditor({ businessId, businessSlug, businessName, initialNav, pages }: Props) {
    const [items, setItems] = useState<UiNavItem[]>(() => normalizeForEditor(initialNav ?? []));
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

    const pagesBySlug = useMemo(() => {
        const m = new Map<string, PageLite>();
        for (const p of pages) m.set(p.slug, p);
        return m;
    }, [pages]);

    //const backHref = useMemo(() => `/studio/business/${businessId}`, [businessId]);
    const publicHref = useMemo(() => `/b/${businessSlug}`, [businessSlug]);

    function reindex(next: UiNavItem[]) {
        return next.map((it, idx) => ({ ...it, order: idx }));
    }

    function updateAt(index: number, patch: Partial<BusinessNavItem>) {
        setItems((prev) => {
            const next = prev.slice();
            const curr = next[index];
            if (!curr) return prev;
            next[index] = { ...curr, ...(patch as any) };
            return reindex(next);
        });
    }

    function removeAt(index: number) {
        setItems((prev) => reindex(prev.slice(0, index).concat(prev.slice(index + 1))));
    }

    function move(index: number, dir: -1 | 1) {
        setItems((prev) => {
            const j = index + dir;
            if (j < 0 || j >= prev.length) return prev;

            const next = prev.slice();
            const tmp = next[index];
            next[index] = next[j];
            next[j] = tmp;

            return reindex(next);
        });
    }

    function addItem(kind: BusinessNavItem["kind"]) {
        setItems((prev) => {
            const next = prev.slice();
            const order = next.length;

            if (kind === "home") {
                next.push({
                    _key: makeKey(),
                    kind: "home",
                    slug: "home",
                    title: "Inicio",
                    visible: true,
                    order,
                });
                return reindex(next);
            }

            if (kind === "contact") {
                next.push({
                    _key: makeKey(),
                    kind: "contact",
                    slug: "contacto",
                    title: "Contacto",
                    visible: true,
                    order,
                });
                return reindex(next);
            }

            // page
            const first = pages[0];
            if (!first) return prev;

            next.push({
                _key: makeKey(),
                kind: "page",
                slug: first.slug,
                title: first.title || defaultTitleFor({ kind: "page", slug: first.slug }),
                visible: true,
                order,
            });

            return reindex(next);
        });
    }

    async function save() {
        setStatus(null);

        // Payload: orden sale del índice
        const payload: BusinessNavItem[] = items.map(({ _key, ...it }, idx) => ({
            ...(it as any),
            order: idx,
        }));

        const hasHome = payload.some((x) => x.kind === "home" && x.slug === "home");
        const hasContact = payload.some((x) => x.kind === "contact" && x.slug === "contacto");
        if (!hasHome) return setStatus({ ok: false, msg: "Falta la pestaña Inicio (home)." });
        if (!hasContact) return setStatus({ ok: false, msg: "Falta la pestaña Contacto." });

        startTransition(async () => {
            try {
                const res = await fetch(`/api/studio/business/${businessId}/nav`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nav: payload }),
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    console.error("Guardar nav falló:", res.status, text);
                    setStatus({ ok: false, msg: `No se pudo guardar (HTTP ${res.status}).` });
                    return;
                }

                setStatus({ ok: true, msg: "Navegación guardada ✅" });
            } catch (e: any) {
                console.error("Guardar nav error:", e);
                setStatus({ ok: false, msg: "Error de red." });
            }
        });
    }

    return (
        <div className="min-h-dvh bg-slate-950 text-slate-100">
            <div className="border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900">
                <div className="mx-auto w-full max-w-6xl px-3 py-6">
                    <div className="flex flex-col gap-2">
                        <div className="text-xl font-semibold">Editar navegación</div>
                        <div className="text-sm text-slate-400">
                            Negocio: <span className="text-slate-200">{businessName}</span>
                        </div>



                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <BackToStudioBusiness label="Volver" />


                            <Button
                                onClick={save}
                                disabled={isPending}
                                className="rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/20"
                            >
                                {isPending ? (
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

                            <Link
                                href={publicHref}
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
                    <div className="grid gap-2">
                        {items.map((item, idx) => {
                            const kind = item.kind;
                            const visible = Boolean(item.visible);
                            const title = String(item.title ?? "");

                            const pageSlug = isPageItem(item as any) ? (item as any).slug : undefined;
                            const page = pageSlug ? pagesBySlug.get(pageSlug) : undefined;

                            return (
                                <div key={item._key} className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <label className="text-xs text-slate-400">
                                                Tipo
                                                <select
                                                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                                    value={kind}
                                                    onChange={(e) => {
                                                        const nextKind = e.target.value as BusinessNavItem["kind"];

                                                        if (nextKind === "home") {
                                                            updateAt(idx, { kind: "home", slug: "home", title: title.trim() ? title : "Inicio" } as any);
                                                            return;
                                                        }
                                                        if (nextKind === "contact") {
                                                            updateAt(idx, { kind: "contact", slug: "contacto", title: title.trim() ? title : "Contacto" } as any);
                                                            return;
                                                        }

                                                        // page
                                                        const fallbackSlug = pages[0]?.slug;
                                                        if (!fallbackSlug) {
                                                            setStatus({ ok: false, msg: "No hay páginas para asignar. Creá una página primero." });
                                                            return;
                                                        }

                                                        const nextPage = pagesBySlug.get(fallbackSlug);
                                                        updateAt(idx, {
                                                            kind: "page",
                                                            slug: fallbackSlug,
                                                            title: title.trim() ? title : (nextPage?.title || defaultTitleFor({ kind: "page", slug: fallbackSlug })),
                                                        } as any);
                                                    }}
                                                >
                                                    <option value="home">{KIND_LABEL.home}</option>
                                                    <option value="page">{KIND_LABEL.page}</option>
                                                    <option value="contact">{KIND_LABEL.contact}</option>
                                                </select>
                                            </label>

                                            <label className="text-xs text-slate-400">
                                                Título
                                                <input
                                                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                                    value={title}
                                                    onChange={(e) => updateAt(idx, { title: e.target.value } as any)}
                                                    placeholder={defaultTitleFor(item)}
                                                />
                                            </label>

                                            <label className="text-xs text-slate-400">
                                                Visible
                                                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={visible}
                                                        onChange={(e) => updateAt(idx, { visible: e.target.checked } as any)}
                                                    />
                                                    <span className="text-sm text-slate-200">{visible ? "Sí" : "No"}</span>
                                                </div>
                                            </label>

                                            {kind === "page" && (
                                                <label className="text-xs text-slate-400 md:col-span-3">
                                                    Página
                                                    <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        <select
                                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                                            value={pageSlug ?? ""}
                                                            onChange={(e) => {
                                                                const nextSlug = e.target.value;
                                                                const nextPage = pagesBySlug.get(nextSlug);
                                                                updateAt(idx, {
                                                                    slug: nextSlug as any,
                                                                    ...(nextPage?.title ? ({ title: nextPage.title } as any) : {}),
                                                                } as any);
                                                            }}
                                                        >
                                                            <option value="" disabled>
                                                                Elegí una página…
                                                            </option>
                                                            {pages.map((p) => (
                                                                <option key={p.id} value={p.slug}>
                                                                    {p.title} ({p.slug})
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <div className="text-xs text-slate-500 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                                                            <div className="text-slate-400">Info</div>
                                                            <div className="truncate">
                                                                Seleccionada:{" "}
                                                                <span className="text-slate-200">
                                                                    {page ? `${page.title} (${page.slug})` : "—"}
                                                                </span>
                                                            </div>
                                                            <div className="truncate">
                                                                Título de pestaña: <span className="text-slate-200">{title || "—"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </label>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => move(idx, -1)}
                                                className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                                title="Subir"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => move(idx, +1)}
                                                className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                                title="Bajar"
                                            >
                                                ↓
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeAt(idx)}
                                                className="px-3 py-2 text-sm rounded-xl border border-red-900/60 bg-red-950/30 text-red-200 hover:bg-red-950/50"
                                                title="Eliminar"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => addItem("home")}
                            className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        >
                            + Inicio
                        </button>

                        <button
                            type="button"
                            onClick={() => addItem("contact")}
                            className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        >
                            + Contacto
                        </button>

                        <button
                            type="button"
                            onClick={() => addItem("page")}
                            className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                            disabled={pages.length === 0}
                        >
                            + Página
                        </button>
                    </div>
                </Card>
            </main>
        </div>
    );
}

export default BusinessNavEditor;

