// src/components/business/BusinessSiteHeader.tsx
"use client";

import { resolveFontFamily } from "@/lib/fonts/families";

type OverlayPosition = "left" | "center" | "right" | "none";

export function BusinessSiteHeader({
    name,
    headline,
    category,
    bgImageUrl,

    headerHeight,
    headerBgColor,
    headerOpacityOverlay,

    headerBgSize,
    headerBgPosition,

    headerOverlayPosition, // ✅ NUEVO

    titleColor,
    titleTypography,
    titleTextSize,
    titleAlignText,

    headlineColor,
    headlineTypography,
    headlineTextSize,
    headlineAlignText,

    categoryColor,
    categoryTypography,
    categoryTextSize,
    categoryAlignText,
}: {
    name?: string;
    headline?: string;
    category?: string;
    bgImageUrl?: string | null;

    headerHeight?: string;
    headerBgColor?: string;
    headerOpacityOverlay?: number; // 0..100 (ej: 0,10,20,...)

    headerBgSize?: string;
    headerBgPosition?: string;

    // ✅ NUEVO
    headerOverlayPosition?: OverlayPosition; // left | center | right | none

    titleColor?: string;
    titleTypography?: string;
    titleTextSize?: number;
    titleAlignText?: string;

    headlineColor?: string;
    headlineTypography?: string;
    headlineTextSize?: number;
    headlineAlignText?: string;

    categoryColor?: string;
    categoryTypography?: string;
    categoryTextSize?: number;
    categoryAlignText?: string;
}) {
    const headerHeightPx =
        headerHeight === "full"
            ? "320px"
            : headerHeight === "xl"
                ? "270px"
                : headerHeight === "lg"
                    ? "220px"
                    : headerHeight === "md"
                        ? "170px"
                        : headerHeight === "sm"
                            ? "120px"
                            : "170px";

    const titleSize = String(titleTextSize) + "px";
    const headlineSize = String(headlineTextSize) + "px";
    const categorySize = String(categoryTextSize) + "px";

    const headerBgSizeFallback = headerBgSize ? headerBgSize : "contain";
    const headerBgPositionFallback = headerBgPosition ? headerBgPosition : "left";

    // ✅ overlay opacity (0..100) -> CSS opacity (0..1)
    const overlayPct =
        typeof headerOpacityOverlay === "number"
            ? Math.max(0, Math.min(100, headerOpacityOverlay))
            : 0;
    const overlayOpacity = overlayPct / 100;

    // ✅ Define el tipo de overlay horizontal
    const overlayPos: OverlayPosition = headerOverlayPosition ?? "none";

    const overlayBackgroundImage =
        overlayPos === "left"
            ? "linear-gradient(to right, #000 0%, #000 55%, transparent 100%)"
            : overlayPos === "center"
                ? "linear-gradient(to right, transparent 0%, #000 50%, transparent 100%)"
                : overlayPos === "right"
                    ? "linear-gradient(to right, transparent 0%, #000 45%, #000 100%)"
                    : undefined;

    return (
        <div className="mx-auto mb-4 w-full">
            <div className="flex flex-col">
                <div
                    className="relative flex flex-col w-full items-center justify-center gap-4 p-4 lg:min-h-[160px] min-h-[120px]"
                    style={{
                        backgroundColor: headerBgColor,
                        height: headerHeightPx,
                    }}
                >
                    {/* ✅ Capa de imagen */}
                    {bgImageUrl && (
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `url(${bgImageUrl})`,
                                backgroundSize: headerBgSizeFallback,
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: headerBgPositionFallback,
                                pointerEvents: "none",
                            }}
                        >
                            {/* ✅ Overlay SOLO sobre la imagen */}
                            {overlayOpacity > 0 && (
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundColor: overlayPos === "none" ? "#000" : undefined,
                                        backgroundImage: overlayBackgroundImage,
                                        opacity: overlayOpacity,
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* ✅ Contenido arriba del overlay */}
                    <div
                        className="relative z-10 flex flex-row w-full font-semibold leading-tight"
                        style={{
                            color: titleColor,
                            fontSize: titleSize,
                            justifyContent: titleAlignText,
                            fontFamily: resolveFontFamily(titleTypography ?? "system"),
                        }}
                    >
                        {name}
                    </div>

                    {!!headline && (
                        <div
                            className="relative z-10 flex flex-row w-full"
                            style={{
                                color: headlineColor,
                                fontSize: headlineSize,
                                justifyContent: headlineAlignText,
                                fontFamily: resolveFontFamily(headlineTypography ?? "system"),
                            }}
                        >
                            {headline}
                        </div>
                    )}

                    {!!category && (
                        <div
                            className="relative z-10 flex flex-row w-full"
                            style={{
                                color: categoryColor,
                                fontSize: categorySize,
                                justifyContent: categoryAlignText,
                                fontFamily: resolveFontFamily(categoryTypography ?? "system"),
                            }}
                        >
                            {category}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}