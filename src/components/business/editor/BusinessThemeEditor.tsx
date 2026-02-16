// src/components/business/editor/BusinessThemeEditor.tsx
"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Save, RotateCcw } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { BusinessThemeConfig, ThemePresetId } from "@/types/business-theme";
import { THEME_PRESETS, mergeTheme } from "@/types/business-theme";
//import { FONT_PREVIEW_FAMILY } from "@/lib/fonts/families";
import { previewFontFamily } from "@/lib/fonts/families";
import { TYPO_OPTIONS } from "@/lib/fonts/families";

function clampHex(v: string): string {
    const s = String(v || "").trim();
    if (!s) return "#000000";
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
    return "#000000";
}

function clampText(v: string, fallback = ""): string {
    const s = String(v ?? "").trim();
    return s.length ? s : fallback;
}

function clampTextAllowEmpty(v: string): string {
    const s = String(v ?? "").trim();
    // ✅ mientras edita, permitimos vacío
    if (s.length === 0) return "";
    return s;
}

function parsePx(v: string): number | null {
    const m = String(v ?? "").trim().match(/^(\d+)\s*px$/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
}

function buildFontSizeOptions(maxPx: number): string[] {
    const out: string[] = [];

    const pushRange = (from: number, to: number, step: number) => {
        for (let n = from; n <= to; n += step) out.push(`${n}px`);
    };

    // 12..24 de 1 en 1
    pushRange(12, Math.min(24, maxPx), 1);

    // 26..48 de 2 en 2 (arranca en 26 para no duplicar 24)
    if (maxPx >= 26) pushRange(26, Math.min(48, maxPx), 2);

    // 52..max de 4 en 4 (arranca en 52 para seguir la lógica 1/2/4)
    if (maxPx >= 52) pushRange(52, maxPx, 4);

    // si maxPx cae en “huecos” (ej 50), lo agregamos para que exista
    const exact = `${maxPx}px`;
    if (maxPx >= 12 && !out.includes(exact)) out.push(exact);

    // orden por si se coló algo
    out.sort((a, b) => (parsePx(a) ?? 0) - (parsePx(b) ?? 0));
    return out;
}

function buildRadiusOptions(maxPx: number): string[] {
    // 0..24 de 1 en 1, después 28..64 de 4 en 4
    const out: string[] = [];
    for (let n = 0; n <= Math.min(24, maxPx); n += 1) out.push(`${n}px`);
    for (let n = 28; n <= Math.min(64, maxPx); n += 4) out.push(`${n}px`);

    const exact = `${maxPx}px`;
    if (maxPx >= 0 && !out.includes(exact)) out.push(exact);

    out.sort((a, b) => (parsePx(a) ?? 0) - (parsePx(b) ?? 0));
    return out;
}

function buildGapOptions(maxPx: number): string[] {
    // gaps típicos
    const base = [0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64];
    const out = base.filter((n) => n <= maxPx).map((n) => `${n}px`);

    const exact = `${maxPx}px`;
    if (maxPx >= 0 && !out.includes(exact)) out.push(exact);

    out.sort((a, b) => (parsePx(a) ?? 0) - (parsePx(b) ?? 0));
    return out;
}

function buildBorderOptions(): string[] {
    // border casi siempre: 0..4, y algunos extras
    return ["0px", "1px", "2px", "3px", "4px", "6px", "8px"];
}

function getPxFallback(def: FieldDef): string {
    if (def.placeholder) return def.placeholder;

    if (def.isFontSize) return "24px";

    switch (def.pxPreset) {
        case "border":
            return "1px";
        case "radius":
            return "8px";
        case "gap":
            return "4px";
        default:
            return "24px";
    }
}


type Align = "start" | "center" | "end";
const ALIGN_OPTIONS: Align[] = ["start", "center", "end"];

type BoolStr = "true" | "false";
const BOOL_OPTIONS: BoolStr[] = ["false", "true"];

type FieldKind = "color" | "text" | "select";

type PxPreset = "radius" | "border" | "gap";

type FieldDef = {
    key: string;
    label: string;
    kind: FieldKind;
    placeholder?: string;
    options?: readonly string[];
    normalize?: (v: string) => string;
    isFont?: true;
    isFontSize?: true;
    pxPreset?: PxPreset;
};

type SubGroupDef = {
    title: string;
    subtitle?: string;
    fields: FieldDef[];
};

type SectionDef = {
    title: string;
    subtitle?: string;
    groups: SubGroupDef[];
};

function FieldShell({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="text-xs text-slate-400">
            {label}
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                {children}
            </div>
        </label>
    );
}

function GroupBlock({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div>
                <div className="text-sm font-medium text-slate-100">{title}</div>
                {subtitle ? <div className="text-xs text-slate-400 mt-1">{subtitle}</div> : null}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {children}
            </div>
        </div>
    );
}

function SectionBlock({
    title,
    subtitle,
    right,
    children,
}: {
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="font-medium">{title}</div>
                    {subtitle ? <div className="text-sm text-slate-400 mt-1">{subtitle}</div> : null}
                </div>
                {right ? <div className="shrink-0">{right}</div> : null}
            </div>

            <div className="mt-4 grid gap-4">{children}</div>
        </div>
    );
}

/**
 * Config explícita: secciones -> subgrupos -> fields
 */
const UI_SECTIONS: Record<Exclude<keyof BusinessThemeConfig, "preset">, SectionDef> = {
    main: {
        title: "Main",
        subtitle: "Base del sitio (fondo/superficie/ancho).",
        groups: [
            {
                title: "Layout base",
                subtitle: "Afecta el contenedor principal y el ancho de contenido.",
                fields: [
                    { key: "bg", label: "Fondo principal", kind: "color" }, // main background color
                    { key: "surface", label: "Superficie principal", kind: "color" }, // main surface color
                    {
                        key: "width",
                        label: "Ancho de contenido",
                        kind: "text",
                        placeholder: "80% / 1024px / 100%",
                        normalize: (v) => clampText(v, "100%"),
                    }, // main content width
                ],
            },
        ],
    },

    header: {
        title: "Header",
        subtitle: "Estilo del header (título/headline/categoría/botones).",
        groups: [
            {
                title: "Contenedor",
                subtitle: "Fondo general del header.",
                fields: [{ key: "bgcr", label: "Header background color", kind: "color" }], // header background color
            },
            {
                title: "Título",
                subtitle: "Nombre del negocio o título principal.",
                fields: [
                    { key: "tcr", label: "Title color", kind: "color" }, // title color
                    { key: "tty", label: "Title typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // title typography
                    { key: "tse", label: "Title text size", kind: "text", placeholder: "24px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // title text size
                    { key: "tatt", label: "Title align text", kind: "select", options: ALIGN_OPTIONS }, // title align text
                ],
            },
            {
                title: "Headline",
                subtitle: "Subtítulo / descripción corta.",
                fields: [
                    { key: "hcr", label: "Headline color", kind: "color" }, // headline color
                    { key: "hty", label: "Headline typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // headline typography
                    { key: "htse", label: "Headline text size", kind: "text", placeholder: "22px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // headline text size
                    { key: "hatt", label: "Headline align text", kind: "select", options: ALIGN_OPTIONS }, // headline align text
                ],
            },
            {
                title: "Categoría",
                subtitle: "Etiqueta o categoría del negocio.",
                fields: [
                    { key: "ccr", label: "Category color", kind: "color" }, // category color
                    { key: "cty", label: "Category typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // category typography
                    { key: "ctse", label: "Category text size", kind: "text", placeholder: "20px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // category text size
                    { key: "catt", label: "Category align text", kind: "select", options: ALIGN_OPTIONS }, // category align text
                ],
            },
            {
                title: "Botón",
                subtitle: "Botón principal del header (ej: contacto / comprar).",
                fields: [
                    { key: "bbg", label: "Button background", kind: "color" },
                    { key: "bbhr", label: "Button background hover", kind: "color" },
                    { key: "bcr", label: "Button text color", kind: "color" },

                    // ✅ NUEVO: active
                    { key: "bbae", label: "Button background (active)", kind: "color" },
                    { key: "bcae", label: "Button text color (active)", kind: "color" },
                    { key: "bbcae", label: "Button border color (active)", kind: "color" },

                    { key: "bty", label: "Button typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "btse", label: "Button text size", kind: "text", placeholder: "20px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "bbr", label: "Button border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "bbcr", label: "Button border color", kind: "color" },
                    { key: "brs", label: "Button radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" },
                    { key: "ban", label: "Button align", kind: "select", options: ALIGN_OPTIONS },
                    { key: "bgp", label: "Button gap", kind: "text", placeholder: "4px", normalize: (v) => clampText(v, "4px"), pxPreset: "gap" },
                ],
            },

        ],
    },

    hero: {
        title: "Hero",
        subtitle: "Bloque principal del micrositio.",
        groups: [
            {
                title: "Contenedor",
                subtitle: "Fondo, borde y radio del bloque.",
                fields: [
                    { key: "bgcr", label: "Hero background color", kind: "color" }, // hero background color
                    { key: "br", label: "Hero border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" }, // hero border
                    { key: "bcr", label: "Hero border color", kind: "color" }, // hero border color
                    { key: "rs", label: "Hero radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" }, // hero radius
                ],
            },
            {
                title: "Título",
                subtitle: "Tipografía, tamaño, color y alineación del título.",
                fields: [
                    { key: "tcr", label: "Hero title color", kind: "color" }, // hero title color
                    { key: "tty", label: "Hero title typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // hero title typography
                    { key: "ttse", label: "Hero title text size", kind: "text", placeholder: "20px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // hero title text size
                    { key: "tatt", label: "Hero title align text", kind: "select", options: ALIGN_OPTIONS }, // hero title align text
                ],
            },
            {
                title: "Subtítulo",
                subtitle: "Tipografía, tamaño, color y alineación del subtítulo.",
                fields: [
                    { key: "scr", label: "Hero subtitle color", kind: "color" }, // hero subtitle color
                    { key: "sty", label: "Hero subtitle typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // hero subtitle typography
                    { key: "stse", label: "Hero subtitle text size", kind: "text", placeholder: "18px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // hero subtitle text size
                    { key: "satt", label: "Hero subtitle align text", kind: "select", options: ALIGN_OPTIONS }, // hero subtitle align text
                ],
            },
        ],
    },

    features: {
        title: "Features",
        subtitle: "Lista de características / items.",
        groups: [
            {
                title: "Contenedor",
                subtitle: "Fondo, borde, radio y columnas.",
                fields: [
                    { key: "bgcr", label: "Features background color", kind: "color" }, // features background color
                    { key: "br", label: "Features border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" }, // features border
                    { key: "bcr", label: "Features border color", kind: "color" }, // features border color
                    { key: "rs", label: "Features radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" }, // features radius
                    //{ key: "col", label: "Features columns", kind: "select", options: ["1", "2", "3", "4"] as const }, // features columns
                ],
            },
            {
                title: "Título de sección",
                subtitle: "Encabezado general de Features.",
                fields: [
                    { key: "tcr", label: "Features title color", kind: "color" }, // features title color
                    { key: "tty", label: "Features title typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // features title typography
                    { key: "ttse", label: "Features title text size", kind: "text", placeholder: "20px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // features title text size
                    { key: "tatt", label: "Features title align text", kind: "select", options: ALIGN_OPTIONS }, // features title align text
                ],
            },
            {
                title: "items: contenedor",
                subtitle: "Fondo, borde, radio",
                fields: [
                    { key: "ibgcr", label: "Items background color", kind: "color" }, // features items background color
                    { key: "ibr", label: "Items border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" }, // features items border
                    { key: "ibcr", label: "Items border color", kind: "color" }, // features items border color
                    { key: "irs", label: "Items radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" }, // features items radius
                ]
            },
            {
                title: "Items: título",
                subtitle: "Título de cada item.",
                fields: [
                    { key: "itcr", label: "Items title color", kind: "color" }, // items title color
                    { key: "itty", label: "Items title typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // items title typography
                    { key: "ittse", label: "Items title text size", kind: "text", placeholder: "18px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // items title text size
                    { key: "itatt", label: "Items title align text", kind: "select", options: ALIGN_OPTIONS }, // items title align text
                ],
            },
            {
                title: "Items: texto",
                subtitle: "Texto/descripción de cada item.",
                fields: [
                    { key: "itxcr", label: "Items text color", kind: "color" }, // items text color
                    { key: "itxty", label: "Items text typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // items text typography
                    { key: "itxtse", label: "Items text size", kind: "text", placeholder: "16px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // items text size
                    { key: "itxatt", label: "Items text align text", kind: "select", options: ALIGN_OPTIONS }, // items text align text
                ],
            },
        ],
    },

    gallery: {
        title: "Gallery",
        subtitle: "Galería + configuración de swiper.",
        groups: [
            {
                title: "Contenedor",
                subtitle: "Fondo, borde, radio, columnas.",
                fields: [
                    { key: "bgcr", label: "Gallery background color", kind: "color" }, // gallery background color
                    { key: "br", label: "Gallery border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" }, // gallery border
                    { key: "bcr", label: "Gallery border color", kind: "color" }, // gallery border color
                    { key: "rs", label: "Gallery radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" }, // gallery radius
                ],
            },
            {
                title: "Título",
                subtitle: "Encabezado de la galería.",
                fields: [
                    { key: "tcr", label: "Gallery title color", kind: "color" }, // gallery title color
                    { key: "tty", label: "Gallery title typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // gallery title typography
                    { key: "ttse", label: "Gallery title text size", kind: "text", placeholder: "16px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // gallery title text size
                    { key: "tatt", label: "Gallery title align text", kind: "select", options: ALIGN_OPTIONS }, // gallery title align text
                ],
            },
            {
                title: "Tarjetas",
                subtitle: "color de fondo y redondeo de las tarjetas",
                fields: [
                    { key: "cbcr", label: "Gallery card background color", kind: "color" }, // gallery card background color
                    { key: "crs", label: "Gallery card radius", kind: "text", placeholder: "6px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" }, // gallery card radius
                ]
            }
        ],
    },

    text: {
        title: "Text",
        subtitle: "Bloque de texto (título + cuerpo).",
        groups: [
            {
                title: "Contenedor",
                subtitle: "Fondo, borde y radio del bloque.",
                fields: [
                    { key: "bgcr", label: "Text background color", kind: "color" }, // text background color
                    { key: "br", label: "Text border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" }, // text border
                    { key: "bcr", label: "Text border color", kind: "color" }, // text border color
                    { key: "rs", label: "Text radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" }, // text radius
                ],
            },
            {
                title: "Título",
                subtitle: "Encabezado del bloque de texto.",
                fields: [
                    { key: "tcr", label: "Text title color", kind: "color" }, // text title color
                    { key: "tty", label: "Text title typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // text title typography
                    { key: "ttsc", label: "Text title text size", kind: "text", placeholder: "20px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // text title text size
                    { key: "tat", label: "Text title align text", kind: "select", options: ALIGN_OPTIONS }, // text title align text
                ],
            },
            {
                title: "Cuerpo",
                subtitle: "Texto principal (párrafos).",
                fields: [
                    { key: "bycr", label: "Text body color", kind: "color" }, // text body color
                    { key: "byty", label: "Text body typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // text body typography
                    { key: "bytse", label: "Text body text size", kind: "text", placeholder: "18px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // text body text size
                    { key: "byatt", label: "Text body align text", kind: "select", options: ALIGN_OPTIONS }, // text body align text
                ],
            },
        ],
    },

    cta: {
        title: "CTA",
        subtitle: "Call to action.",
        groups: [
            {
                title: "Contenedor",
                subtitle: "Fondo, borde, radio.",
                fields: [
                    { key: "bgcr", label: "CTA background color", kind: "color" }, // cta background color
                    { key: "br", label: "CTA border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" }, // cta border
                    { key: "bcr", label: "CTA border color", kind: "color" }, // cta border color
                    { key: "rs", label: "CTA radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" }, // cta radius
                ],
            },
            {
                title: "Título",
                subtitle: "Tipografía, tamaño, color y alineación.",
                fields: [
                    { key: "ticr", label: "CTA title color", kind: "color" }, // cta text color
                    { key: "tiy", label: "CTA title typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // cta text typography
                    { key: "titse", label: "CTA title size", kind: "text", placeholder: "16px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // cta text size
                    { key: "tiatt", label: "CTA title align text", kind: "select", options: ALIGN_OPTIONS }, // cta align text
                ],
            },
            {
                title: "Texto",
                subtitle: "Tipografía, tamaño, color y alineación.",
                fields: [
                    { key: "tcr", label: "CTA text color", kind: "color" }, // cta text color
                    { key: "tty", label: "CTA text typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // cta text typography
                    { key: "ttse", label: "CTA text size", kind: "text", placeholder: "16px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // cta text size
                    { key: "tatt", label: "CTA align text", kind: "select", options: ALIGN_OPTIONS }, // cta align text
                ],
            },
            {
                title: "Botón",
                subtitle: "Tipografía, tamaño y color del botón del CTA.",
                fields: [
                    { key: "btbdcr", label: "CTA button background color", kind: "color" }, // cta button background color
                    { key: "btbdcrhv", label: "CTA button hover background color", kind: "color" }, // cta background color
                    { key: "btbr", label: "CTA button border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" }, // cta border
                    { key: "btbrcr", label: "CTA button border color", kind: "color" }, // cta border color
                    { key: "btrs", label: "CTA radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" }, // cta radius
                    { key: "btcr", label: "CTA button text color", kind: "color" }, // cta button text color
                    { key: "btty", label: "CTA button typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // cta button typography
                    { key: "bttse", label: "CTA button text size", kind: "text", placeholder: "18px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // cta button text size
                    { key: "btan", label: "CTA button align", kind: "select", options: ALIGN_OPTIONS }, // cta align text
                ],
            },
        ],
    },

    productive: {
        title: "Productive",
        subtitle: "Sección productiva / lista.",
        groups: [
            {
                title: "Contenedor",
                subtitle: "Fondo, borde, radio.",
                fields: [
                    { key: "bgcr", label: "Productive background color", kind: "color" }, // productive background color
                    { key: "br", label: "Productive border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" }, // productive border
                    { key: "bcr", label: "Productive border color", kind: "color" }, // productive border color
                    { key: "rs", label: "Productive radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" }, // productive radius
                ],
            },
            {
                title: "Título",
                subtitle: "Encabezado de la sección.",
                fields: [
                    { key: "tcr", label: "Productive title color", kind: "color" }, // productive title color
                    { key: "tty", label: "Productive title typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // productive title typography
                    { key: "yyse", label: "Productive title text size", kind: "text", placeholder: "20px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // productive title text size
                    { key: "tatt", label: "Productive title align text", kind: "select", options: ALIGN_OPTIONS }, // productive title align text
                ],
            },
            {
                title: "Items: título",
                subtitle: "Título de cada item.",
                fields: [
                    { key: "itcr", label: "Item title color", kind: "color" }, // item title color
                    { key: "itty", label: "Item title typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // item title typography
                    { key: "itse", label: "Item title text size", kind: "text", placeholder: "18px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // item title text size
                    { key: "itatt", label: "Item align text", kind: "select", options: ALIGN_OPTIONS }, // item align text
                ],
            },
            {
                title: "Items: texto",
                subtitle: "Descripción / texto de cada item.",
                fields: [
                    { key: "itxcr", label: "Item text color", kind: "color" }, // item text color
                    { key: "itxty", label: "Item text typography", kind: "select", options: TYPO_OPTIONS, isFont: true }, // item text typography
                    { key: "itxtse", label: "Item text text size", kind: "text", placeholder: "16px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true }, // item text text size
                    { key: "itxatt", label: "Item text align text", kind: "select", options: ALIGN_OPTIONS }, // item text align text
                ],
            },
        ],
    },

    components: {
        title: "Componentes",
        subtitle: "Variantes globales para botones y cards.",
        groups: [
            {
                title: "Botón",
                subtitle: "Estilo global para la variante del botón.",
                fields: [
                    {
                        key: "button.variant",
                        label: "Button variant",
                        kind: "select",
                        options: ["solid", "soft", "outline"] as const,
                    }, // button variant
                ],
            },
            {
                title: "Card",
                subtitle: "Sombra de cards.",
                fields: [
                    {
                        key: "card.shadow",
                        label: "Card shadow",
                        kind: "select",
                        options: ["none", "sm", "md"] as const,
                    }, // card shadow
                ],
            },
        ],
    },
};

export function BusinessThemeEditor({
    businessId,
    businessSlug,
    businessName,
    initialTheme,
}: {
    businessId: number;
    businessSlug: string;
    businessName: string;
    initialTheme: BusinessThemeConfig;
}) {
    const [theme, setTheme] = useState<BusinessThemeConfig>(() => mergeTheme(initialTheme));
    const [pending, startTransition] = useTransition();
    const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

    const [compactMode, setCompactMode] = useState(false);

    const previewHref = useMemo(() => `/b/${businessSlug}`, [businessSlug]);
    const backHref = useMemo(() => `/studio/business/${businessId}`, [businessId]);

    const presets = useMemo(() => Object.keys(THEME_PRESETS) as ThemePresetId[], []);

    function setPreset(preset: ThemePresetId) {
        const presetTheme = THEME_PRESETS[preset];
        setTheme((prev) => mergeTheme({ ...presetTheme, preset }, prev));
    }

    function resetSectionToPreset<S extends keyof BusinessThemeConfig>(section: S) {
        const presetTheme = THEME_PRESETS[theme.preset] ?? THEME_PRESETS.classic;

        setTheme((prev) => {
            if (section === "preset") return mergeTheme(presetTheme);

            if (section === "components") {
                return {
                    ...prev,
                    components: {
                        button: { ...presetTheme.components.button },
                        card: { ...presetTheme.components.card },
                    },
                };
            }

            return {
                ...prev,
                [section]: { ...(presetTheme as any)[section] },
            };
        });
    }

    function updateSection<
        S extends Exclude<keyof BusinessThemeConfig, "preset" | "components">,
        K extends keyof BusinessThemeConfig[S],
    >(section: S, key: K, value: BusinessThemeConfig[S][K]) {
        setTheme((prev) => ({
            ...prev,
            [section]: {
                ...(prev[section] as any),
                [key]: value,
            },
        }));
    }

    function updateComponentPath(path: "button.variant" | "card.shadow", value: any) {
        const [comp, key] = path.split(".") as ["button" | "card", "variant" | "shadow"];
        setTheme((prev) => ({
            ...prev,
            components: {
                ...prev.components,
                [comp]: {
                    ...(prev.components as any)[comp],
                    [key]: value,
                },
            },
        }));
    }

    function save() {
        setStatus(null);

        startTransition(async () => {
            try {
                const res = await fetch(`/api/studio/business/${businessId}/theme`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ themeConfig: theme }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setStatus({ ok: false, msg: data?.error || "No se pudo guardar." });
                    return;
                }

                setStatus({ ok: true, msg: "Guardado ✅" });
            } catch {
                setStatus({ ok: false, msg: "Error de red." });
            }
        });
    }

    function renderField(sectionKey: keyof typeof UI_SECTIONS, def: FieldDef) {
        // components con path
        if (sectionKey === "components") {
            const path = def.key as "button.variant" | "card.shadow";
            const value =
                path === "button.variant"
                    ? theme.components.button.variant
                    : theme.components.card.shadow;

            if (def.kind === "select") {
                return (
                    <label key={`components.${def.key}`} className="text-xs text-slate-400">
                        {def.label}
                        <select
                            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            value={String(value)}
                            onChange={(e) => updateComponentPath(path, e.target.value as any)}
                        >
                            {(def.options ?? []).map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </label>
                );
            }

            return (
                <FieldShell key={`components.${def.key}`} label={def.label}>
                    <input
                        value={String(value)}
                        onChange={(e) => updateComponentPath(path, e.target.value)}
                        className="w-full bg-transparent outline-none text-sm text-slate-100"
                        spellCheck={false}
                    />
                </FieldShell>
            );
        }

        const section = sectionKey as Exclude<keyof BusinessThemeConfig, "preset" | "components">;
        const current = (theme as any)[section]?.[def.key] ?? "";

        if (def.kind === "color") {
            const v = clampHex(String(current));
            return (
                <FieldShell key={`${section}.${def.key}`} label={def.label}>
                    <input
                        type="color"
                        value={v}
                        onChange={(e) =>
                            updateSection(section as any, def.key as any, clampHex(e.target.value) as any)
                        }
                        className="h-7 w-10 bg-transparent border-0 p-0"
                        title={def.label}
                    />
                    <input
                        value={String(current)}
                        onChange={(e) =>
                            updateSection(section as any, def.key as any, clampHex(e.target.value) as any)
                        }
                        className="w-full bg-transparent outline-none text-sm text-slate-100"
                        spellCheck={false}
                    />
                </FieldShell>
            );
        }

        if (def.kind === "select") {
            const isFont = def.isFont === true;

            return (
                <label key={`${section}.${def.key}`} className="text-xs text-slate-400">
                    {def.label}

                    <select
                        className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                        value={String(current)}
                        onChange={(e) => updateSection(section as any, def.key as any, e.target.value as any)}
                        style={isFont ? { fontFamily: previewFontFamily(String(current)) } : undefined}
                    >
                        {(def.options ?? []).map((opt) => (
                            <option
                                key={opt}
                                value={opt}
                                style={isFont ? { fontFamily: previewFontFamily(opt) } : undefined}
                            >
                                {opt}
                            </option>
                        ))}
                    </select>
                </label>
            );
        }

        const normalize = def.normalize ?? ((v: string) => clampText(v));

        const wantsDatalist = def.isFontSize === true || def.pxPreset != null;
        const datalistId = wantsDatalist ? `${section}.${def.key}.datalist` : undefined;

        let sizeOptions: string[] | null = null;

        if (def.isFontSize) {
            const currentPx = parsePx(String(current));
            const maxPx = Math.max(72, currentPx ?? 72);
            sizeOptions = buildFontSizeOptions(maxPx);
        } else if (def.pxPreset === "radius") {
            const currentPx = parsePx(String(current));
            const maxPx = Math.max(64, currentPx ?? 64);
            sizeOptions = buildRadiusOptions(maxPx);
        } else if (def.pxPreset === "gap") {
            const currentPx = parsePx(String(current));
            const maxPx = Math.max(64, currentPx ?? 64);
            sizeOptions = buildGapOptions(maxPx);
        } else if (def.pxPreset === "border") {
            sizeOptions = buildBorderOptions();
        }

        // asegurar que el valor actual esté en la lista si es px
        if (sizeOptions) {
            const cur = String(current).trim();
            const curPx = parsePx(cur);
            if (curPx != null && !sizeOptions.includes(`${curPx}px`)) {
                sizeOptions.push(`${curPx}px`);
                sizeOptions.sort((a, b) => (parsePx(a) ?? 0) - (parsePx(b) ?? 0));
            }
        }

        const allowEmptyWhileEditing =
            def.isFontSize === true || def.pxPreset != null;

        const fallbackOnBlur = getPxFallback(def);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;

            const next = allowEmptyWhileEditing
                ? clampTextAllowEmpty(raw) // ✅ permite "" mientras editás
                : normalize(raw);

            updateSection(section as any, def.key as any, next as any);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            if (!allowEmptyWhileEditing) return;

            const s = String(e.target.value ?? "").trim();
            if (s.length === 0) {
                updateSection(section as any, def.key as any, fallbackOnBlur as any);
            }
        };

        return (
            <FieldShell key={`${section}.${def.key}`} label={def.label}>
                <input
                    value={String(current)}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full bg-transparent outline-none text-sm text-slate-100"
                    spellCheck={false}
                    placeholder={def.placeholder}
                    list={datalistId}
                />

                {sizeOptions && datalistId ? (
                    <datalist id={datalistId}>
                        {sizeOptions.map((opt) => (
                            <option key={opt} value={opt} />
                        ))}
                    </datalist>
                ) : null}
            </FieldShell>
        );
    }

    function getAllFieldsOfSection(sectionKey: keyof typeof UI_SECTIONS): FieldDef[] {
        const s = UI_SECTIONS[sectionKey];
        return s.groups.flatMap((g) => g.fields);
    }

    return (
        <div className="min-h-dvh bg-slate-950 text-slate-100">
            {/* Header */}
            <div className="border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900">
                <div className="mx-auto w-full max-w-6xl px-3 py-6">
                    <div className="flex flex-col gap-2">
                        <div className="text-xl font-semibold">Tema / Estilos</div>
                        <div className="text-sm text-slate-400">
                            Negocio: <span className="text-slate-200">{businessName}</span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
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

                            <Link
                                href={previewHref}
                                target="_blank"
                                className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                            >
                                <ExternalLink size={16} className="mr-2 opacity-80" />
                                Ver público
                            </Link>

                            <Link
                                href={backHref}
                                className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                            >
                                Volver
                            </Link>

                            {/* Toggle compact mode */}
                            <button
                                type="button"
                                onClick={() => setCompactMode((v) => !v)}
                                className={cn(
                                    "inline-flex items-center gap-2 px-3 py-2 text-sm rounded-xl border",
                                    compactMode
                                        ? "bg-slate-800 border-slate-600 text-sky-200"
                                        : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                                )}
                                title="Alternar modo compacto"
                            >
                                <span className="text-xs">Modo compacto</span>
                                <span className={cn("text-xs", compactMode ? "text-sky-200" : "text-slate-400")}>
                                    {compactMode ? "ON" : "OFF"}
                                </span>
                            </button>

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
                    <div className="grid gap-4">
                        {/* Presets */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                            <div className="font-medium">Preset</div>
                            <div className="text-sm text-slate-400 mt-1">
                                Elegí un preset como base. Después podés ajustar todo manualmente.
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {presets.map((p) => {
                                    const active = theme.preset === p;
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPreset(p)}
                                            className={[
                                                "px-3 py-2 rounded-xl border text-sm",
                                                active
                                                    ? "bg-slate-800 border-slate-600 text-sky-200"
                                                    : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800",
                                            ].join(" ")}
                                            title={`Aplicar preset ${p}`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Secciones */}
                        {(
                            [
                                "main",
                                "header",
                                "hero",
                                "features",
                                "gallery",
                                "text",
                                "cta",
                                "productive",
                                "components",
                            ] as (keyof typeof UI_SECTIONS)[]
                        ).map((sectionKey) => {
                            const s = UI_SECTIONS[sectionKey];
                            const allFields = getAllFieldsOfSection(sectionKey);

                            return (
                                <SectionBlock
                                    key={sectionKey}
                                    title={s.title}
                                    subtitle={
                                        compactMode
                                            ? `${s.subtitle ?? ""} (compacto)`
                                            : s.subtitle
                                    }
                                    right={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-xl border-slate-800 bg-slate-900 hover:bg-slate-800"
                                            onClick={() => resetSectionToPreset(sectionKey as any)}
                                            title="Resetear esta sección al preset actual"
                                        >
                                            <RotateCcw size={16} className="mr-2 opacity-80" />
                                            Reset sección
                                        </Button>
                                    }
                                >
                                    {/* Normal: con subgrupos */}
                                    {!compactMode && (
                                        <>
                                            {s.groups.map((g) => (
                                                <GroupBlock
                                                    key={`${sectionKey}.${g.title}`}
                                                    title={g.title}
                                                    subtitle={g.subtitle}
                                                >
                                                    {g.fields.map((f) => renderField(sectionKey, f))}
                                                </GroupBlock>
                                            ))}
                                        </>
                                    )}

                                    {/* Compacto: un grid grande (sin subgrupos) */}
                                    {compactMode && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                            <div className="text-xs text-slate-400">
                                                Todos los campos de <span className="text-slate-200">{s.title}</span> en una sola grilla.
                                            </div>
                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {allFields.map((f) => renderField(sectionKey, f))}
                                            </div>
                                        </div>
                                    )}
                                </SectionBlock>
                            );
                        })}
                    </div>
                </Card>
            </main>
        </div>
    );
}

export default BusinessThemeEditor;