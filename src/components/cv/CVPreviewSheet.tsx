// src/components/cv/CVPreviewSheet.tsx
"use client";

import React from "react";
import type { EditorCV } from "@/types/cvEditor";
import type { CVStyleConfig } from "@/types/cvStyle";
import { CVRendererSwitch } from "@/components/cv/renderers/CVRendererSwitch";

type Props = {
    cv: EditorCV;
    styleConfig: CVStyleConfig;
    scale?: number; // default 1
};

export function CVPreviewSheet({ cv, styleConfig, scale = 1 }: Props) {
    const showDocTitle = Boolean(styleConfig?.showDocTitle);

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

                    ["--cv-title-font" as any]: styleConfig.title.fontFamily,
                    ["--cv-title-size" as any]: styleConfig.title.fontSize,
                    ["--cv-title-color" as any]: styleConfig.title.color,

                    ["--cv-subtitle-font" as any]: styleConfig.subtitle.fontFamily,
                    ["--cv-subtitle-size" as any]: styleConfig.subtitle.fontSize,
                    ["--cv-subtitle-color" as any]: styleConfig.subtitle.color,

                    ["--cv-text-font" as any]: styleConfig.description.fontFamily,
                    ["--cv-text-size" as any]: styleConfig.description.fontSize,
                    ["--cv-text-color" as any]: styleConfig.description.color,

                    ["--cv-date-font" as any]: styleConfig.date.fontFamily,
                    ["--cv-date-size" as any]: styleConfig.date.fontSize,
                    ["--cv-date-color" as any]: styleConfig.date.color,

                    ["--cv-doc-title-font" as any]: styleConfig.docTitle.fontFamily,
                    ["--cv-doc-title-size" as any]: styleConfig.docTitle.fontSize,
                    ["--cv-doc-title-color" as any]: styleConfig.docTitle.color,

                    ["--cv-item-title-font" as any]: styleConfig.itemTitle.fontFamily,
                    ["--cv-item-title-size" as any]: styleConfig.itemTitle.fontSize,
                    ["--cv-item-title-color" as any]: styleConfig.itemTitle.color,

                    ["--cv-item-subtitle-font" as any]: styleConfig.itemSubtitle.fontFamily,
                    ["--cv-item-subtitle-size" as any]: styleConfig.itemSubtitle.fontSize,
                    ["--cv-item-subtitle-color" as any]: styleConfig.itemSubtitle.color,

                    ["--cv-name-font" as any]: styleConfig.name.fontFamily,
                    ["--cv-name-size" as any]: styleConfig.name.fontSize,
                    ["--cv-name-color" as any]: styleConfig.name.color,

                    ["--cv-headline-font" as any]: styleConfig.headline.fontFamily,
                    ["--cv-headline-size" as any]: styleConfig.headline.fontSize,
                    ["--cv-headline-color" as any]: styleConfig.headline.color,

                    ["--cv-summary-font" as any]: styleConfig.summary.fontFamily,
                    ["--cv-summary-size" as any]: styleConfig.summary.fontSize,
                    ["--cv-summary-color" as any]: styleConfig.summary.color,

                    ["--cv-description-font" as any]: styleConfig.description.fontFamily,
                    ["--cv-description-size" as any]: styleConfig.description.fontSize,
                    ["--cv-description-color" as any]: styleConfig.description.color,
                }}
            >
                {showDocTitle && cv.title?.trim() ? (
                    <div className="mb-6 text-center">
                        <h1 className="cv-doc-title tracking-tight">{cv.title}</h1>
                    </div>
                ) : null}

                <CVRendererSwitch cv={cv} styleConfig={styleConfig} />
            </div>
        </div>
    );
}

