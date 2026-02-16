//src/components/business/BusinessSiteHeader.tsx
"use client";

export function BusinessSiteHeader({
    name,
    headline,
    category,
    bgImageUrl,

    headerHeight,
    headerBgColor,

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

    const headerHeightPx = headerHeight === "full" ? "320px" :
        headerHeight === "xl" ? "270px" :
            headerHeight === "lg" ? "220px" :
                headerHeight === "md" ? "170px" :
                    headerHeight === "sm" ? "120px" : "170px";
    const titleSize = String(titleTextSize) + "px";
    const headlineSize = String(headlineTextSize) + "px";
    const categorySize = String(categoryTextSize) + "px";

    return (
        <div id="c" className="mx-auto mb-4 w-full">
            <div id="d" className="flex flex-col">
                <div
                    className="flex flex-col w-full items-center justify-center gap-4 p-4 lg:min-h-[160px] min-h-[120px]"
                    style={{
                        backgroundColor: headerBgColor,
                        ...(bgImageUrl
                            ? {
                                backgroundImage: `url(${bgImageUrl})`,
                                backgroundSize: "contain",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "left",
                            }
                            : {}),
                        height: headerHeightPx
                    }}
                >
                    <div
                        className="flex flex-row w-full font-semibold leading-tight"
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
                            className="flex flex-row w-full"
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
                            className="flex flex-row w-full"
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
