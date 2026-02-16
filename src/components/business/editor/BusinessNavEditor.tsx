// src/components/business/editor/BusinessNavEditor.tsx
"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, Save } from "lucide-react";

import type { BusinessNavItem } from "@/types/business";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type PageLite = { id: number; slug: string; title: string };

type Props = {
    businessId: number;
    businessSlug: string;
    businessName: string;
    initialNav: BusinessNavItem[];
    pages: PageLite[];
};

const KIND_LABEL: Record<string, string> = {
    home: "Home",
    products: "Productos",
    services: "Servicios",
    wall: "Novedades",
    contact: "Contacto",
    page: "Página",
};

function isPageItem(item: BusinessNavItem): item is BusinessNavItem & { kind: "page"; slug?: string } {
    return (item as any)?.kind === "page";
}

function defaultTitleForKind(kind: string) {
    switch (kind) {
        case "home":
            return "Inicio";
        case "products":
            return "Productos";
        case "services":
            return "Servicios";
        case "wall":
            return "Novedades";
        case "contact":
            return "Contacto";
        case "page":
            return "Sobre nosotros";
        default:
            return "Pestaña";
    }
}

function clampOrder(items: BusinessNavItem[]) {
    return items
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((it, idx) => ({ ...it, order: idx }));
}

export function BusinessNavEditor({
    businessId,
    businessSlug,
    businessName,
    initialNav,
    pages,
}: Props) {
    const [items, setItems] = useState<BusinessNavItem[]>(() => clampOrder(initialNav ?? []));
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

    const pagesBySlug = useMemo(() => {
        const m = new Map<string, PageLite>();
        for (const p of pages) m.set(p.slug, p);
        return m;
    }, [pages]);

    const sorted = useMemo(() => items.slice().sort((a, b) => a.order - b.order), [items]);

    const backHref = useMemo(() => `/studio/business/${businessId}`, [businessId]);
    const publicHref = useMemo(() => `/b/${businessSlug}`, [businessSlug]);

    function updateAt(orderIndex: number, patch: Partial<BusinessNavItem>) {
        setItems((prev) => {
            const next = prev.slice().sort((a, b) => a.order - b.order);
            const curr = next[orderIndex];
            if (!curr) return prev;

            next[orderIndex] = { ...(curr as any), ...(patch as any) };
            return clampOrder(next);
        });
    }

    function removeAt(orderIndex: number) {
        setItems((prev) => {
            const next = prev.slice().sort((a, b) => a.order - b.order);
            next.splice(orderIndex, 1);
            return clampOrder(next);
        });
    }

    function addItem(kind: string) {
        setItems((prev) => {
            const next = prev.slice().sort((a, b) => a.order - b.order);
            const order = next.length;

            if (kind === "page") {
                const first = pages[0];
                next.push({
                    kind: "page",
                    title: defaultTitleForKind("page"),
                    order,
                    visible: true,
                    ...(first ? { slug: first.slug } : {}),
                } as any);
            } else {
                next.push({
                    kind: kind as any,
                    title: defaultTitleForKind(kind),
                    order,
                    visible: true,
                } as any);
            }

            return clampOrder(next);
        });
    }

    function move(orderIndex: number, dir: -1 | 1) {
        setItems((prev) => {
            const next = prev.slice().sort((a, b) => a.order - b.order);
            const j = orderIndex + dir;
            if (j < 0 || j >= next.length) return prev;
            const tmp = next[orderIndex];
            next[orderIndex] = next[j];
            next[j] = tmp;
            return clampOrder(next);
        });
    }

    async function save() {
        setStatus(null);
        const payload = clampOrder(items);

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
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <div className="font-medium">Pestañas</div>
                            <div className="text-sm text-slate-400">
                                El texto de la pestaña se edita en “Título”. Para “Página”, elegís qué page abre,
                                pero el título puede ser distinto.
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        {sorted.map((item, idx) => {
                            const kind = (item as any).kind as string;
                            const visible = Boolean((item as any).visible);
                            const title = String((item as any).title ?? "");

                            const pageSlug = isPageItem(item) ? (item as any).slug : undefined;
                            const page = pageSlug ? pagesBySlug.get(pageSlug) : undefined;

                            return (
                                <div
                                    key={`${kind}-${item.order}-${idx}`}
                                    className="rounded-xl border border-slate-800 bg-slate-900/30 p-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <label className="text-xs text-slate-400">
                                                Tipo
                                                <select
                                                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                                    value={kind}
                                                    onChange={(e) => {
                                                        const nextKind = e.target.value;

                                                        if (nextKind === "page") {
                                                            const first = pages[0];
                                                            updateAt(idx, {
                                                                kind: "page" as any,
                                                                title: title?.trim()
                                                                    ? title
                                                                    : defaultTitleForKind("page"),
                                                                ...(first ? ({ slug: first.slug } as any) : {}),
                                                            } as any);
                                                        } else {
                                                            updateAt(idx, {
                                                                kind: nextKind as any,
                                                                title: title?.trim()
                                                                    ? title
                                                                    : defaultTitleForKind(nextKind),
                                                            } as any);
                                                        }
                                                    }}
                                                >
                                                    <option value="home">{KIND_LABEL.home}</option>
                                                    <option value="products">{KIND_LABEL.products}</option>
                                                    <option value="services">{KIND_LABEL.services}</option>
                                                    <option value="wall">{KIND_LABEL.wall}</option>
                                                    <option value="contact">{KIND_LABEL.contact}</option>
                                                    <option value="page">{KIND_LABEL.page}</option>
                                                </select>
                                            </label>

                                            <label className="text-xs text-slate-400">
                                                Título
                                                <input
                                                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                                    value={title}
                                                    onChange={(e) => updateAt(idx, { title: e.target.value } as any)}
                                                    placeholder={defaultTitleForKind(kind)}
                                                />
                                            </label>

                                            <label className="text-xs text-slate-400">
                                                Visible
                                                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={visible}
                                                        onChange={(e) =>
                                                            updateAt(idx, { visible: e.target.checked } as any)
                                                        }
                                                    />
                                                    <span className="text-sm text-slate-200">
                                                        {visible ? "Sí" : "No"}
                                                    </span>
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
                                                                const nextSlug = e.target.value || undefined;

                                                                const shouldAuto =
                                                                    !title.trim() ||
                                                                    title.trim().toLowerCase() ===
                                                                    defaultTitleForKind("page").toLowerCase() ||
                                                                    (page?.title &&
                                                                        title.trim().toLowerCase() ===
                                                                        page.title.trim().toLowerCase());

                                                                const nextPage = nextSlug
                                                                    ? pagesBySlug.get(nextSlug)
                                                                    : undefined;

                                                                updateAt(idx, {
                                                                    ...(nextSlug ? ({ slug: nextSlug } as any) : {}),
                                                                    ...(shouldAuto && nextPage?.title
                                                                        ? ({ title: nextPage.title } as any)
                                                                        : {}),
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
                                                                Título de pestaña:{" "}
                                                                <span className="text-slate-200">{title || "—"}</span>
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
                            + Home
                        </button>
                        <button
                            type="button"
                            onClick={() => addItem("products")}
                            className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        >
                            + Productos
                        </button>
                        <button
                            type="button"
                            onClick={() => addItem("services")}
                            className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        >
                            + Servicios
                        </button>
                        <button
                            type="button"
                            onClick={() => addItem("wall")}
                            className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        >
                            + Novedades
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
                            title={pages.length === 0 ? "No hay páginas creadas todavía" : "Agregar pestaña a una página"}
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

