// src/components/cv/preview/HeaderPreview.tsx
"use client";

import React from "react";
import type { ProfileData } from "@/types/cv";
import { cn } from "@/lib/utils";

type Props = {
    profile: ProfileData;
    summary?: string | null;

    /** ✅ NUEVO: imagen + flag */
    imageUrl?: string | null;
    showImage?: boolean;

    className?: string;
};

export function HeaderPreview({
    profile,
    summary,
    imageUrl,
    showImage,
    className,
}: Props) {
    const fullName = profile.fullName?.trim() || "Nombre Apellido";
    const headline = profile.headline?.trim() || "";
    const summaryText = (summary ?? "").trim();

    const canShowImage = Boolean(showImage) && Boolean(imageUrl);

    if (!fullName && !headline && !summaryText && !canShowImage) return null;

    return (
        <header className={cn("cv-block space-y-2 border-b pb-4 mb-6", className)}>
            {canShowImage ? (
                <div className="mb-2 flex justify-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={String(imageUrl)}
                        alt="Foto de perfil"
                        className="h-16 w-16 rounded-full object-cover border border-slate-300"
                    />
                </div>
            ) : null}

            <h1 className="cv-name">{fullName}</h1>

            {headline ? <p className="cv-headline">{headline}</p> : null}

            {summaryText ? (
                <p className="cv-summary whitespace-pre-line">{summaryText}</p>
            ) : null}
        </header>
    );
}
