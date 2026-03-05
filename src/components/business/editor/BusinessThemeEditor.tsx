// src/components/business/editor/BusinessThemeEditor.tsx
"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
    ExternalLink,
    Loader2,
    Save,
    RotateCcw,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
    BusinessThemeConfig,
    ThemePresetId,
    DefaultThemePresetId,
} from "@/types/business-theme";
import { DEFAULT_PRESETS, THEME_PRESETS, mergeTheme } from "@/types/business-theme";

import { previewFontFamily } from "@/lib/fonts/families";
import { TYPO_OPTIONS } from "@/lib/fonts/families";

import BackToStudioBusiness from "@/components/custom/BackToStudioBusiness";

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

    pushRange(12, Math.min(24, maxPx), 1);
    if (maxPx >= 26) pushRange(26, Math.min(48, maxPx), 2);
    if (maxPx >= 52) pushRange(52, maxPx, 4);

    const exact = `${maxPx}px`;
    if (maxPx >= 12 && !out.includes(exact)) out.push(exact);

    out.sort((a, b) => (parsePx(a) ?? 0) - (parsePx(b) ?? 0));
    return out;
}

function buildRadiusOptions(maxPx: number): string[] {
    const out: string[] = [];
    for (let n = 0; n <= Math.min(24, maxPx); n += 1) out.push(`${n}px`);
    for (let n = 28; n <= Math.min(64, maxPx); n += 4) out.push(`${n}px`);

    const exact = `${maxPx}px`;
    if (maxPx >= 0 && !out.includes(exact)) out.push(exact);

    out.sort((a, b) => (parsePx(a) ?? 0) - (parsePx(b) ?? 0));
    return out;
}

function buildGapOptions(maxPx: number): string[] {
    const base = [0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64];
    const out = base.filter((n) => n <= maxPx).map((n) => `${n}px`);

    const exact = `${maxPx}px`;
    if (maxPx >= 0 && !out.includes(exact)) out.push(exact);

    out.sort((a, b) => (parsePx(a) ?? 0) - (parsePx(b) ?? 0));
    return out;
}

function buildBorderOptions(): string[] {
    return ["0px", "1px", "2px", "3px", "4px", "6px", "8px"];
}

type Align = "start" | "center" | "end";
const ALIGN_OPTIONS: Align[] = ["start", "center", "end"];

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

function CollapsibleSectionBlock({
    sectionKey,
    title,
    subtitle,
    right,
    open,
    onToggle,
    children,
}: {
    sectionKey: string;
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <button
                    type="button"
                    onClick={onToggle}
                    className="group flex min-w-[240px] flex-1 items-start gap-3 text-left"
                    aria-expanded={open}
                    aria-controls={`section-${sectionKey}`}
                >
                    <span className="mt-0.5 text-slate-300 group-hover:text-slate-100">
                        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>

                    <span className="block">
                        <span className="block font-medium text-slate-100">{title}</span>
                        {subtitle ? <span className="block text-sm text-slate-400 mt-1">{subtitle}</span> : null}
                    </span>
                </button>

                {right ? <div className="shrink-0">{right}</div> : null}
            </div>

            {open ? (
                <div id={`section-${sectionKey}`} className="mt-4 flex flex-col items-center justify-center max-w-2xl gap-4">
                    {children}
                </div>
            ) : null}
        </div>
    );
}

/**
 * Config explícita: secciones -> subgrupos -> fields
 */
const UI_SECTIONS: Record<
    Exclude<keyof BusinessThemeConfig, "preset">,
    SectionDef
> = {
    header: {
        title: "Barra de navegación",
        subtitle: "Estilo de la barra de navegación (pestañas).",
        groups: [
            {
                title: "Barra de navegación",
                subtitle: "Pestañas de la barra de navegación (ej: contacto / comprar).",
                fields: [
                    { key: "bbg", label: "Tabs background", kind: "color" },
                    { key: "bbhr", label: "Tabs background hover", kind: "color" },
                    { key: "bcr", label: "Tabs text color", kind: "color" },

                    { key: "bbae", label: "Tabs background (active)", kind: "color" },
                    { key: "bcae", label: "Tabs text color (active)", kind: "color" },
                    { key: "bbcae", label: "Tabs border color (active)", kind: "color" },

                    { key: "bty", label: "Tabs typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "btse", label: "Tabs text size", kind: "text", placeholder: "20px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "bbr", label: "Tabs border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "bbcr", label: "Tabs border color", kind: "color" },
                    { key: "brs", label: "Tabs radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" },
                    { key: "ban", label: "Tabs align", kind: "select", options: ALIGN_OPTIONS },
                    { key: "bgp", label: "Tabs gap", kind: "text", placeholder: "4px", normalize: (v) => clampText(v, "4px"), pxPreset: "gap" },
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
                    { key: "bgcr", label: "Hero background color", kind: "color" },
                    { key: "br", label: "Hero border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "bcr", label: "Hero border color", kind: "color" },
                    { key: "rs", label: "Hero radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" },
                ],
            },
            {
                title: "Título",
                subtitle: "Tipografía, tamaño, color y alineación del título.",
                fields: [
                    { key: "tcr", label: "Hero title color", kind: "color" },
                    { key: "tty", label: "Hero title typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "ttse", label: "Hero title text size", kind: "text", placeholder: "20px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "tatt", label: "Hero title align text", kind: "select", options: ALIGN_OPTIONS },
                ],
            },
            {
                title: "Subtítulo",
                subtitle: "Tipografía, tamaño, color y alineación del subtítulo.",
                fields: [
                    { key: "scr", label: "Hero subtitle color", kind: "color" },
                    { key: "sty", label: "Hero subtitle typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "stse", label: "Hero subtitle text size", kind: "text", placeholder: "18px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "satt", label: "Hero subtitle align text", kind: "select", options: ALIGN_OPTIONS },
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
                    { key: "bgcr", label: "Features background color", kind: "color" },
                    { key: "br", label: "Features border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "bcr", label: "Features border color", kind: "color" },
                    { key: "rs", label: "Features radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" },
                ],
            },
            {
                title: "Título de sección",
                subtitle: "Encabezado general de Features.",
                fields: [
                    { key: "tcr", label: "Features title color", kind: "color" },
                    { key: "tty", label: "Features title typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "ttse", label: "Features title text size", kind: "text", placeholder: "20px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "tatt", label: "Features title align text", kind: "select", options: ALIGN_OPTIONS },
                ],
            },
            {
                title: "items: contenedor",
                subtitle: "Fondo, borde, radio",
                fields: [
                    { key: "ibgcr", label: "Items background color", kind: "color" },
                    { key: "ibr", label: "Items border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "ibcr", label: "Items border color", kind: "color" },
                    { key: "irs", label: "Items radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" },
                ],
            },
            {
                title: "Items: título",
                subtitle: "Título de cada item.",
                fields: [
                    { key: "itcr", label: "Items title color", kind: "color" },
                    { key: "itty", label: "Items title typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "ittse", label: "Items title text size", kind: "text", placeholder: "18px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "itatt", label: "Items title align text", kind: "select", options: ALIGN_OPTIONS },
                ],
            },
            {
                title: "Items: texto",
                subtitle: "Texto/descripción de cada item.",
                fields: [
                    { key: "itxcr", label: "Items text color", kind: "color" },
                    { key: "itxty", label: "Items text typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "itxtse", label: "Items text size", kind: "text", placeholder: "16px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "itxatt", label: "Items text align text", kind: "select", options: ALIGN_OPTIONS },
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
                    { key: "bgcr", label: "Gallery background color", kind: "color" },
                    { key: "br", label: "Gallery border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "bcr", label: "Gallery border color", kind: "color" },
                    { key: "rs", label: "Gallery radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" },
                ],
            },
            {
                title: "Título",
                subtitle: "Encabezado de la galería.",
                fields: [
                    { key: "tcr", label: "Gallery title color", kind: "color" },
                    { key: "tty", label: "Gallery title typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "ttse", label: "Gallery title text size", kind: "text", placeholder: "16px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "tatt", label: "Gallery title align text", kind: "select", options: ALIGN_OPTIONS },
                ],
            },
            {
                title: "Tarjetas",
                subtitle: "color de fondo y redondeo de las tarjetas",
                fields: [
                    { key: "cbcr", label: "Gallery card background color", kind: "color" },
                    { key: "cbr", label: "Gallery card border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "cbrcr", label: "Gallery card border color", kind: "color" },
                    { key: "crs", label: "Gallery card radius", kind: "text", placeholder: "6px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" },
                ],
            },
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
                    { key: "bgcr", label: "Text background color", kind: "color" },
                    { key: "br", label: "Text border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "bcr", label: "Text border color", kind: "color" },
                    { key: "rs", label: "Text radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" },
                ],
            },
            {
                title: "Título",
                subtitle: "Encabezado del bloque de texto.",
                fields: [
                    { key: "tcr", label: "Text title color", kind: "color" },
                    { key: "tty", label: "Text title typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "ttsc", label: "Text title text size", kind: "text", placeholder: "20px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "tat", label: "Text title align text", kind: "select", options: ALIGN_OPTIONS },
                ],
            },
            {
                title: "Cuerpo",
                subtitle: "Texto principal (párrafos).",
                fields: [
                    { key: "bycr", label: "Text body color", kind: "color" },
                    { key: "byty", label: "Text body typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "bytse", label: "Text body text size", kind: "text", placeholder: "18px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "byatt", label: "Text body align text", kind: "select", options: ALIGN_OPTIONS },
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
                    { key: "bgcr", label: "CTA background color", kind: "color" },
                    { key: "br", label: "CTA border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "bcr", label: "CTA border color", kind: "color" },
                    { key: "rs", label: "CTA radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" },
                ],
            },
            {
                title: "Título",
                subtitle: "Tipografía, tamaño, color y alineación.",
                fields: [
                    { key: "ticr", label: "CTA title color", kind: "color" },
                    { key: "tity", label: "CTA title typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "titse", label: "CTA title size", kind: "text", placeholder: "16px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "tiatt", label: "CTA title align text", kind: "select", options: ALIGN_OPTIONS },
                ],
            },
            {
                title: "Texto",
                subtitle: "Tipografía, tamaño, color y alineación.",
                fields: [
                    { key: "tcr", label: "CTA text color", kind: "color" },
                    { key: "tty", label: "CTA text typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "ttse", label: "CTA text size", kind: "text", placeholder: "16px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "tatt", label: "CTA align text", kind: "select", options: ALIGN_OPTIONS },
                ],
            },
            {
                title: "Botón",
                subtitle: "Tipografía, tamaño y color del botón del CTA.",
                fields: [
                    { key: "btbdcr", label: "CTA button background color", kind: "color" },
                    { key: "btbdcrhv", label: "CTA button hover background color", kind: "color" },
                    { key: "btbr", label: "CTA button border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "btbrcr", label: "CTA button border color", kind: "color" },
                    { key: "btrs", label: "CTA radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" },
                    { key: "btcr", label: "CTA button text color", kind: "color" },
                    { key: "btty", label: "CTA button typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "bttse", label: "CTA button text size", kind: "text", placeholder: "18px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "btan", label: "CTA button align", kind: "select", options: ALIGN_OPTIONS },
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
                    { key: "bgcr", label: "Productive background color", kind: "color" },
                    { key: "br", label: "Productive border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "bcr", label: "Productive border color", kind: "color" },
                    { key: "rs", label: "Productive radius", kind: "text", placeholder: "8px", normalize: (v) => clampText(v, "8px"), pxPreset: "radius" },
                ],
            },
            {
                title: "Tarjeta",
                subtitle: "Fondo, borde, radio.",
                fields: [
                    { key: "cbgcr", label: "Productive card background color", kind: "color" },
                    { key: "cbr", label: "Productive card border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "cbrcr", label: "Productive card border color", kind: "color" },
                    { key: "crs", label: "Productive card radius", kind: "text", placeholder: "6px", normalize: (v) => clampText(v, "6px"), pxPreset: "radius" },
                ],
            },
            {
                title: "Título",
                subtitle: "Encabezado de la sección.",
                fields: [
                    { key: "tcr", label: "Productive title color", kind: "color" },
                    { key: "tty", label: "Productive title typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "yyse", label: "Productive title text size", kind: "text", placeholder: "20px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "tatt", label: "Productive title align text", kind: "select", options: ALIGN_OPTIONS },
                ],
            },
            {
                title: "Items: título",
                subtitle: "Título de cada item.",
                fields: [
                    { key: "itcr", label: "Item title color", kind: "color" },
                    { key: "itty", label: "Item title typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "itse", label: "Item title text size", kind: "text", placeholder: "18px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "itatt", label: "Item align text", kind: "select", options: ALIGN_OPTIONS },
                ],
            },
            {
                title: "Items: texto",
                subtitle: "Descripción / texto de cada item.",
                fields: [
                    { key: "itxcr", label: "Item text color", kind: "color" },
                    { key: "itxty", label: "Item text typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "itxtse", label: "Item text text size", kind: "text", placeholder: "16px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "itxatt", label: "Item text align text", kind: "select", options: ALIGN_OPTIONS },
                ],
            },
        ],
    },

    contact: {
        title: "Contacto",
        subtitle: "Formulario de contacto (card, inputs, labels, botón).",
        groups: [
            {
                title: "Contenedor",
                subtitle: "Fondo, borde y radio del bloque.",
                fields: [
                    { key: "bgcr", label: "Contact background color", kind: "color" },
                    { key: "br", label: "Contact border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "bcr", label: "Contact border color", kind: "color" },
                    { key: "rs", label: "Contact radius", kind: "text", placeholder: "16px", normalize: (v) => clampText(v, "16px"), pxPreset: "radius" },
                ],
            },
            {
                title: "Labels",
                subtitle: "Color y tipografía de labels.",
                fields: [
                    { key: "lcr", label: "Label color", kind: "color" },
                    { key: "lty", label: "Label typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "ltse", label: "Label size", kind: "text", placeholder: "12px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                ],
            },
            {
                title: "Inputs",
                subtitle: "Inputs + textarea.",
                fields: [
                    { key: "icr", label: "Input text color", kind: "color" },
                    { key: "ibgcr", label: "Input background", kind: "color" },
                    { key: "ibr", label: "Input border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "ibcr", label: "Input border color", kind: "color" },
                    { key: "irs", label: "Input radius", kind: "text", placeholder: "12px", normalize: (v) => clampText(v, "12px"), pxPreset: "radius" },
                    { key: "ipcr", label: "Placeholder color", kind: "color" },
                    { key: "ifcr", label: "Focus border color", kind: "color" },
                ],
            },
            {
                title: "Botón",
                subtitle: "Estilo del botón enviar.",
                fields: [
                    { key: "btbg", label: "Button background", kind: "color" },
                    { key: "btbgv", label: "Button hover background", kind: "color" },
                    { key: "btbr", label: "Button border", kind: "text", placeholder: "1px", normalize: (v) => clampText(v, "1px"), pxPreset: "border" },
                    { key: "btbrcr", label: "Button border color", kind: "color" },
                    { key: "btrs", label: "Button radius", kind: "text", placeholder: "12px", normalize: (v) => clampText(v, "12px"), pxPreset: "radius" },
                    { key: "btcr", label: "Button text color", kind: "color" },
                    { key: "btty", label: "Button typography", kind: "select", options: TYPO_OPTIONS, isFont: true },
                    { key: "bttse", label: "Button text size", kind: "text", placeholder: "16px", normalize: (v) => clampTextAllowEmpty(v), isFontSize: true },
                    { key: "btan", label: "Button align", kind: "select", options: ALIGN_OPTIONS },
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
                    },
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
                    },
                ],
            },
        ],
    },
};

function isDefaultPreset(p: ThemePresetId): p is DefaultThemePresetId {
    return (DEFAULT_PRESETS as readonly string[]).includes(p);
}

function buildThemeForPreset(
    preset: ThemePresetId,
    userPreset: BusinessThemeConfig | null
): BusinessThemeConfig {
    if (preset === "userPreset") {
        if (userPreset) return mergeTheme({ ...userPreset, preset: "userPreset" });
        return mergeTheme({ ...(THEME_PRESETS.classic as any), preset: "userPreset" });
    }
    return mergeTheme(THEME_PRESETS[preset]);
}

type SectionKey = keyof typeof UI_SECTIONS;

export function BusinessThemeEditor({
    businessId,
    businessSlug,
    businessName,
    initialPreset,
    initialUserPreset,
}: {
    businessId: number;
    businessSlug: string;
    businessName: string;
    initialPreset: ThemePresetId;
    initialUserPreset: BusinessThemeConfig | null;
}) {
    const [pending, startTransition] = useTransition();
    const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

    const [compactMode, setCompactMode] = useState(false);

    // ✅ preset activo (DB)
    const [preset, setPresetState] = useState<ThemePresetId>(() => initialPreset);

    // ✅ userPreset guardado (DB) — existe aunque el preset activo sea default
    const [userPreset, setUserPreset] = useState<BusinessThemeConfig | null>(() => initialUserPreset);

    // ✅ theme que editamos en el form (lo que ves en inputs)
    const [theme, setTheme] = useState<BusinessThemeConfig>(() =>
        buildThemeForPreset(initialPreset, initialUserPreset)
    );

    // ✅ si el usuario tocó algo estando en un preset default
    const [dirtyDefaultToUserPreset, setDirtyDefaultToUserPreset] = useState(false);

    const previewHref = useMemo(() => `/b/${businessSlug}`, [businessSlug]);

    // Presets visibles (userPreset aparece habilitable solo si existe config o si ya está activo)
    const presetButtons = useMemo(() => {
        const base: ThemePresetId[] = [...DEFAULT_PRESETS];
        base.push("userPreset");
        return base;
    }, []);

    const sectionOrder = useMemo(
        () =>
            [
                "header",
                "hero",
                "features",
                "gallery",
                "text",
                "cta",
                "productive",
                "contact",
                "components",
            ] as SectionKey[],
        []
    );

    // ✅ colapsables (sin persistencia)
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(sectionOrder.map((k) => [String(k), true]))
    );

    function toggleSection(k: SectionKey) {
        const key = String(k);
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function expandAllSections() {
        setOpenSections(Object.fromEntries(sectionOrder.map((k) => [String(k), true])));
    }

    function collapseAllSections() {
        setOpenSections(Object.fromEntries(sectionOrder.map((k) => [String(k), false])));
    }

    function selectPreset(next: ThemePresetId) {
        setDirtyDefaultToUserPreset(false);
        setPresetState(next);
        setTheme(buildThemeForPreset(next, userPreset));
        setStatus(null);
    }

    function markDirtyIfDefaultEditing() {
        if (preset !== "userPreset") {
            setDirtyDefaultToUserPreset(true);
        }
    }

    function resetSectionToPreset<S extends keyof BusinessThemeConfig>(section: S) {
        const base = buildThemeForPreset(preset, userPreset);

        setTheme((prev) => {
            if (section === "preset") return mergeTheme(base);

            if (section === "components") {
                return {
                    ...prev,
                    components: {
                        button: { ...base.components.button },
                        card: { ...base.components.card },
                    },
                };
            }

            return {
                ...prev,
                [section]: { ...(base as any)[section] },
            };
        });

        markDirtyIfDefaultEditing();
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
        markDirtyIfDefaultEditing();
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
        markDirtyIfDefaultEditing();
    }

    async function save() {
        setStatus(null);

        const shouldWriteUserPreset =
            preset === "userPreset" || (isDefaultPreset(preset) && dirtyDefaultToUserPreset);

        const nextPresetToDb: ThemePresetId = shouldWriteUserPreset ? "userPreset" : preset;

        const body: any = {
            themePreset: nextPresetToDb,
        };

        if (shouldWriteUserPreset) {
            body.themeConfig = { ...theme, preset: "userPreset" };
        }

        startTransition(async () => {
            try {
                const res = await fetch(`/api/studio/business/${businessId}/theme`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setStatus({ ok: false, msg: data?.error || "No se pudo guardar." });
                    return;
                }

                if (shouldWriteUserPreset) {
                    const saved = { ...theme, preset: "userPreset" } as BusinessThemeConfig;
                    setUserPreset(saved);
                    setPresetState("userPreset");
                    setTheme(mergeTheme(saved));
                    setDirtyDefaultToUserPreset(false);
                } else {
                    setPresetState(nextPresetToDb);
                    setTheme(buildThemeForPreset(nextPresetToDb, userPreset));
                    setDirtyDefaultToUserPreset(false);
                }

                setStatus({ ok: true, msg: "Guardado ✅" });
            } catch {
                setStatus({ ok: false, msg: "Error de red." });
            }
        });
    }

    function renderField(sectionKey: keyof typeof UI_SECTIONS, def: FieldDef) {
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

        if (sizeOptions) {
            const cur = String(current).trim();
            const curPx = parsePx(cur);
            if (curPx != null && !sizeOptions.includes(`${curPx}px`)) {
                sizeOptions.push(`${curPx}px`);
                sizeOptions.sort((a, b) => (parsePx(a) ?? 0) - (parsePx(b) ?? 0));
            }
        }

        const allowEmptyWhileEditing = def.isFontSize === true || def.pxPreset != null;
        const fallbackOnBlur = getPxFallback(def);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;

            const next = allowEmptyWhileEditing ? clampTextAllowEmpty(raw) : normalize(raw);
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

    const userPresetEnabled = userPreset != null || preset === "userPreset";

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

                            <BackToStudioBusiness label="Volver" />

                            {/* Expand / Collapse all */}
                            <button
                                type="button"
                                onClick={expandAllSections}
                                className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                title="Expandir todas las secciones"
                            >
                                Expandir todo
                            </button>
                            <button
                                type="button"
                                onClick={collapseAllSections}
                                className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                title="Colapsar todas las secciones"
                            >
                                Colapsar todo
                            </button>

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

                        {preset !== "userPreset" && dirtyDefaultToUserPreset && (
                            <div className="mt-2 text-xs text-amber-300">
                                Editaste campos en un preset default. Al guardar se creará/activará <b>userPreset</b>.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="mx-auto w-full max-w-6xl px-3 py-6">
                <Card className="bg-slate-950 border-slate-800 p-4 rounded-2xl">
                    <div className="grid grid-cols-1 gap-4">
                        {/* Presets */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                            <div className="font-medium">Preset</div>
                            <div className="text-sm text-slate-400 mt-1">
                                Elegí un preset. Si modificás un preset default, al guardar se genera un <b>userPreset</b>.
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {presetButtons.map((p) => {
                                    const active = preset === p;
                                    const disabled = p === "userPreset" ? !userPresetEnabled : false;

                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => selectPreset(p)}
                                            disabled={disabled}
                                            className={cn(
                                                "px-3 py-2 rounded-xl border text-sm transition",
                                                disabled
                                                    ? "bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed"
                                                    : active
                                                        ? "bg-slate-800 border-slate-600 text-sky-200"
                                                        : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                                            )}
                                            title={
                                                p === "userPreset" && !userPresetEnabled
                                                    ? "Todavía no existe userPreset. Editá algo y guardá para crearlo."
                                                    : `Aplicar preset ${p}`
                                            }
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Secciones colapsables */}
                        {sectionOrder.map((sectionKey) => {
                            const s = UI_SECTIONS[sectionKey];
                            const allFields = getAllFieldsOfSection(sectionKey);

                            const isOpen = openSections[String(sectionKey)] ?? true;

                            return (
                                <CollapsibleSectionBlock
                                    key={sectionKey}
                                    sectionKey={String(sectionKey)}
                                    title={s.title}
                                    subtitle={compactMode ? `${s.subtitle ?? ""} (compacto)` : s.subtitle}
                                    open={isOpen}
                                    onToggle={() => toggleSection(sectionKey)}
                                    right={
                                        <div className="flex flex-wrap gap-2">
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
                                        </div>
                                    }
                                >
                                    {!compactMode ? (
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
                                    ) : (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                            <div className="text-xs text-slate-400">
                                                Todos los campos de{" "}
                                                <span className="text-slate-200">{s.title}</span> en una sola grilla.
                                            </div>
                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {allFields.map((f) => renderField(sectionKey, f))}
                                            </div>
                                        </div>
                                    )}
                                </CollapsibleSectionBlock>
                            );
                        })}
                    </div>
                </Card>
            </main>
        </div>
    );
}

export default BusinessThemeEditor;