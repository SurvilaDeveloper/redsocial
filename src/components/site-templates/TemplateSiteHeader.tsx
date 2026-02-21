//src/components/site-templates/TemplateSiteHeader.tsx
"use client";

type OverlayPosition = "left" | "center" | "right" | "none";

export function TemplateSiteHeader({
    name,
    headline,
    category,
    bgImageUrl,

    headerHeight,
    headerBgColor,

    // ✅ NUEVO
    headerOpacityOverlay,
    headerOverlayPosition,

    headerBgSize,
    headerBgPosition,

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

    // ✅ NUEVO
    headerOpacityOverlay?: number; // 0..100
    headerOverlayPosition?: OverlayPosition; // left | center | right | none

    headerBgSize?: string;
    headerBgPosition?: string;

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

    // templates: si no viene, fallback estable
    const headerBgSizeFallback = headerBgSize ? headerBgSize : "contain";
    const headerBgPositionFallback = headerBgPosition ? headerBgPosition : "left";

    // ✅ overlay opacity (0..100) -> CSS opacity (0..1)
    const overlayPct =
        typeof headerOpacityOverlay === "number"
            ? Math.max(0, Math.min(100, headerOpacityOverlay))
            : 0;
    const overlayOpacity = overlayPct / 100;

    // ✅ overlay position (default: none => parejo)
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
                            fontFamily: titleTypography,
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
                                fontFamily: headlineTypography,
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
                                fontFamily: categoryTypography,
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


