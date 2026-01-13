// src/components/cv/CVPreviewSheet.tsx
"use client";

import React, { useMemo } from "react";
import type { Curriculum, CVStyleConfig, CVStyleElement, CVTextStyle, CVThemeColor } from "@/types/cv";
import { coerceThemeColor } from "@/types/cv";
import { CVRendererSwitch } from "@/components/cv/renderers/CVRendererSwitch";

type Props = {
    cv: Curriculum;
    scale?: number; // default 1
};

/* ===========================
   Fallback styleConfig (same defaults as CVEditor)
=========================== */

const FONT_FAMILIES = ["sans-serif", "serif", "monospace", "cursive", "fantasy"] as const;
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px"] as const;

const STYLE_KEYS: CVStyleElement[] = [
    "docTitle",
    "name",
    "headline",
    "summary",
    "personal",
    "title",
    "subtitle",
    "description",
    "date",
    "itemTitle",
    "itemSubtitle",
    "link",
] as const;

const makeStyle = (
    fontSize: (typeof FONT_SIZES)[number],
    opts?: Partial<Pick<CVTextStyle, "fontFamily" | "color">>
): CVTextStyle => ({
    fontFamily: opts?.fontFamily ?? FONT_FAMILIES[0],
    fontSize,
    color: opts?.color ?? "#000000",
});

const DEFAULTS_BY_KEY: Record<CVStyleElement, CVTextStyle> = {
    docTitle: makeStyle("20px"),
    name: makeStyle("24px"),
    headline: makeStyle("14px", { color: "#374151" }),
    summary: makeStyle("12px", { color: "#374151" }),

    personal: makeStyle("12px", { color: "#374151" }),

    title: makeStyle("14px"),
    subtitle: makeStyle("12px", { color: "#374151" }),
    description: makeStyle("12px"),
    date: makeStyle("12px", { color: "#6B7280" }),

    itemTitle: makeStyle("14px"),
    itemSubtitle: makeStyle("12px", { color: "#374151" }),

    link: makeStyle("12px"),
};

const DEFAULT_STYLE_CONFIG: CVStyleConfig = {
    ...DEFAULTS_BY_KEY,
    showDocTitle: true,
    template: "classic",
    theme: { color: "slate" as CVThemeColor },
};

// ✅ Retrocompatible (+ theme.color)
function normalizeStyleConfig(value: unknown): CVStyleConfig {
    const fb = DEFAULT_STYLE_CONFIG;

    if (!value || typeof value !== "object") return fb;
    const obj = value as Record<string, any>;

    const out: any = {
        showDocTitle: typeof obj.showDocTitle === "boolean" ? obj.showDocTitle : fb.showDocTitle,
    };

    for (const key of STYLE_KEYS) {
        const v = obj[key];
        const base = DEFAULTS_BY_KEY[key];

        out[key] = {
            fontFamily: typeof v?.fontFamily === "string" ? v.fontFamily : base.fontFamily,
            fontSize: typeof v?.fontSize === "string" ? v.fontSize : base.fontSize,
            color: typeof v?.color === "string" ? v.color : base.color,
        };
    }

    out.template = obj.template ? obj.template : "classic";
    out.theme = {
        ...(obj.theme ?? {}),
        color: coerceThemeColor(obj?.theme?.color),
    };

    return out as CVStyleConfig;
}

/* ===========================
   Component
=========================== */

export function CVPreviewSheet({ cv, scale = 1 }: Props) {
    const effectiveStyle = useMemo(() => normalizeStyleConfig(cv.styleConfig), [cv.styleConfig]);

    const showDocTitle = Boolean(effectiveStyle?.showDocTitle);

    return (
        <div className="cv-sheet flex justify-center">
            <div
                className="bg-white text-black cv-root shadow-lg"
                style={{
                    width: "210mm",
                    minHeight: "297mm",
                    padding: "16mm",
                    transform: `scale(${scale})`,
                    transformOrigin: "top center",

                    ["--cv-title-font" as any]: effectiveStyle.title.fontFamily,
                    ["--cv-title-size" as any]: effectiveStyle.title.fontSize,
                    ["--cv-title-color" as any]: effectiveStyle.title.color,

                    ["--cv-subtitle-font" as any]: effectiveStyle.subtitle.fontFamily,
                    ["--cv-subtitle-size" as any]: effectiveStyle.subtitle.fontSize,
                    ["--cv-subtitle-color" as any]: effectiveStyle.subtitle.color,

                    ["--cv-text-font" as any]: effectiveStyle.description.fontFamily,
                    ["--cv-text-size" as any]: effectiveStyle.description.fontSize,
                    ["--cv-text-color" as any]: effectiveStyle.description.color,

                    ["--cv-date-font" as any]: effectiveStyle.date.fontFamily,
                    ["--cv-date-size" as any]: effectiveStyle.date.fontSize,
                    ["--cv-date-color" as any]: effectiveStyle.date.color,

                    ["--cv-doc-title-font" as any]: effectiveStyle.docTitle.fontFamily,
                    ["--cv-doc-title-size" as any]: effectiveStyle.docTitle.fontSize,
                    ["--cv-doc-title-color" as any]: effectiveStyle.docTitle.color,

                    ["--cv-item-title-font" as any]: effectiveStyle.itemTitle.fontFamily,
                    ["--cv-item-title-size" as any]: effectiveStyle.itemTitle.fontSize,
                    ["--cv-item-title-color" as any]: effectiveStyle.itemTitle.color,

                    ["--cv-item-subtitle-font" as any]: effectiveStyle.itemSubtitle.fontFamily,
                    ["--cv-item-subtitle-size" as any]: effectiveStyle.itemSubtitle.fontSize,
                    ["--cv-item-subtitle-color" as any]: effectiveStyle.itemSubtitle.color,

                    ["--cv-name-font" as any]: effectiveStyle.name.fontFamily,
                    ["--cv-name-size" as any]: effectiveStyle.name.fontSize,
                    ["--cv-name-color" as any]: effectiveStyle.name.color,

                    ["--cv-headline-font" as any]: effectiveStyle.headline.fontFamily,
                    ["--cv-headline-size" as any]: effectiveStyle.headline.fontSize,
                    ["--cv-headline-color" as any]: effectiveStyle.headline.color,

                    ["--cv-summary-font" as any]: effectiveStyle.summary.fontFamily,
                    ["--cv-summary-size" as any]: effectiveStyle.summary.fontSize,
                    ["--cv-summary-color" as any]: effectiveStyle.summary.color,

                    ["--cv-personal-font" as any]: effectiveStyle.personal.fontFamily,
                    ["--cv-personal-size" as any]: effectiveStyle.personal.fontSize,
                    ["--cv-personal-color" as any]: effectiveStyle.personal.color,

                    ["--cv-description-font" as any]: effectiveStyle.description.fontFamily,
                    ["--cv-description-size" as any]: effectiveStyle.description.fontSize,
                    ["--cv-description-color" as any]: effectiveStyle.description.color,

                    ["--cv-link-font" as any]: effectiveStyle.link.fontFamily,
                    ["--cv-link-size" as any]: effectiveStyle.link.fontSize,
                    ["--cv-link-color" as any]: effectiveStyle.link.color,
                }}
            >
                {showDocTitle && cv.title?.trim() ? (
                    <div className="mb-6 text-center">
                        <h1 className="cv-doc-title tracking-tight">{cv.title}</h1>
                    </div>
                ) : null}

                <CVRendererSwitch cv={cv} />
            </div>
        </div>
    );
}



