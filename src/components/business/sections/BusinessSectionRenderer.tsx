// src/components/business/sections/BusinessSectionRenderer.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import type { BusinessPageContent, BusinessSection } from "@/types/business-sections";
import { cn } from "@/lib/utils";
import type { MediaMap } from "@/hooks/useMediaByIds";
import { useMediaByIds } from "@/hooks/useMediaByIds";
import { Loader2 } from "lucide-react";
import { ImagesSwiperSites } from "@/components/custom/ImagesSwiperSites";

type TeaserItem = {
    id: number;
    thumbUrl: string | null;
};

function buildFrom(pathname: string, searchParams: URLSearchParams) {
    const qs = searchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname;
}

function safeInt(v: any) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.trunc(n);
}

function useListingTeasers(type: "product" | "service", ids: number[]) {
    const [items, setItems] = React.useState<Record<number, TeaserItem>>({});
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const unique = Array.from(new Set(ids.filter((n) => Number.isFinite(n) && n > 0)));

        if (unique.length === 0) {
            setItems({});
            setLoading(false);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/listings/teasers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type, ids: unique }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) return;
                if (cancelled) return;

                const next: Record<number, TeaserItem> = {};
                for (const it of (data.items ?? []) as Array<TeaserItem>) {
                    if (it && Number.isFinite(it.id)) next[it.id] = it;
                }
                setItems(next);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [type, ids.join(",")]);

    return { teasers: items, loading };
}

export function BusinessSectionRenderer({
    sections,
    mediaMap,
    businessSlug,
}: {
    sections: BusinessPageContent;
    mediaMap?: MediaMap;
    businessSlug?: string;
}) {
    const list = Array.isArray(sections) ? sections : [];

    return (
        <div className="flex flex-col gap-4">
            {list.map((s) => (
                <SectionView key={s.id} section={s} mediaMap={mediaMap} businessSlug={businessSlug} />
            ))}
        </div>
    );
}

function SectionView({
    section,
    mediaMap,
    businessSlug,
}: {
    section: BusinessSection;
    mediaMap?: MediaMap;
    businessSlug?: string;
}) {
    if (section.kind === "hero") {
        const { title, subtitle, align = "left" } = section.data;

        return (
            <Card
                className="bg-[var(--b-ho-bgcr)] p-6"
                style={{ border: "var(--b-ho-br) solid var(--b-ho-bcr)", borderRadius: "var(--b-ho-rs)" }}
            >
                <div
                    className={cn("flex flex-row items-center font-semibold w-full")}
                    style={{
                        color: "var(--b-ho-tcr)",
                        fontSize: "var(--b-ho-ttse)",
                        fontFamily: "var(--b-ho-tty)",
                        justifyContent: "var(--b-ho-tatt)",
                    }}
                >
                    {title}
                </div>
                {!!subtitle && (
                    <div
                        className={cn("flex flex-row items-center font-semibold w-full")}
                        style={{
                            color: "var(--b-ho-scr)",
                            fontSize: "var(--b-ho-stse)",
                            fontFamily: "var(--b-ho-sty)",
                            justifyContent: "var(--b-ho-satt)",
                        }}
                    >
                        {subtitle}
                    </div>
                )}
            </Card>
        );
    }

    if (section.kind === "text") {
        const { title, body } = section.data;

        return (
            <Card
                className="bg-[var(--b-tx-bgcr)] p-6"
                style={{ border: "var(--b-tx-br) solid var(--b-tx-bcr)", borderRadius: "var(--b-tx-rs)" }}
            >
                {!!title && (
                    <div
                        className="flex flex-row items-center font-semibold w-full"
                        style={{
                            color: "var(--b-tx-tcr)",
                            fontSize: "var(--b-tx-ttse)",
                            fontFamily: "var(--b-tx-tty)",
                            justifyContent: "var(--b-tx-tatt)",
                        }}
                    >
                        {title}
                    </div>
                )}
                <div
                    className="flex flex-row items-center w-full mt-2 whitespace-pre-wrap"
                    style={{
                        color: "var(--b-tx-bycr)",
                        fontSize: "var(--b-tx-bytse)",
                        fontFamily: "var(--b-tx-byty)",
                        justifyContent: "var(--b-tx-byatt)",
                    }}
                >
                    {body}
                </div>
            </Card>
        );
    }

    if (section.kind === "features") {
        const { title, items, columns } = section.data;
        const cols = columns === 2 ? "lg:grid-cols-2" : columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-1";

        return (
            <Card
                className="bg-[var(--b-fs-bgcr)] p-5"
                style={{ border: "var(--b-fs-br) solid var(--b-fs-bcr)", borderRadius: "var(--b-fs-rs)" }}
            >
                {!!title && (
                    <div
                        className="flex flex-row items-center font-semibold w-full"
                        style={{
                            color: "var(--b-fs-tcr)",
                            fontSize: "var(--b-fs-ttse)",
                            fontFamily: "var(--b-fs-tty)",
                            justifyContent: "var(--b-fs-tatt)",
                        }}
                    >
                        {title}
                    </div>
                )}

                <div className={cn("mt-3 grid grid-cols-1 gap-2", cols)}>
                    {items.map((it, idx) => (
                        <div
                            key={idx}
                            className="bg-[var(--b-fs-ibgcr)] p-3"
                            style={{
                                border: "var(--b-fs-ibr) solid var(--b-fs-ibcr)",
                                borderRadius: "var(--b-fs-irs)",
                            }}
                        >
                            <div
                                className="flex flex-row items-center font-medium w-full"
                                style={{
                                    color: "var(--b-fs-itcr)",
                                    fontSize: "var(--b-fs-ittse)",
                                    fontFamily: "var(--b-fs-itty)",
                                    justifyContent: "var(--b-fs-itatt)",
                                }}
                            >
                                {it.title}
                            </div>
                            {!!it.text && (
                                <div
                                    className="flex flex-row items-center w-full"
                                    style={{
                                        color: "var(--b-fs-itxcr)",
                                        fontSize: "var(--b-fs-itxtse)",
                                        fontFamily: "var(--b-fs-itxty)",
                                        justifyContent: "var(--b-fs-itxatt)",
                                    }}
                                >
                                    {it.text}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    if (section.kind === "gallery") {
        const { title, images = [], columns = 3, swiper, width, minWidth } = section.data;
        const cols =
            columns === 2
                ? "lg:grid-cols-2"
                : columns === 4
                    ? "lg:grid-cols-4"
                    : columns === 3
                        ? "lg:grid-cols-3"
                        : "lg:grid-cols-1";

        const wid =
            width === "25%"
                ? "lg:w-[25%]"
                : width === "33%"
                    ? "lg:w-[33%]"
                    : width === "50%"
                        ? "lg:w-[50%]"
                        : width === "66%"
                            ? "lg:w-[66%]"
                            : width === "75%"
                                ? "lg:w-[75%]"
                                : width === "83%"
                                    ? "lg:w-[83%]"
                                    : "lg:w-[100%]";

        const mWd =
            minWidth === "1024px"
                ? "lg:min-w-[1024px]"
                : minWidth === "384px"
                    ? "lg:min-w-[384px]"
                    : minWidth === "512px"
                        ? "lg:min-w-[512px]"
                        : minWidth === "640px"
                            ? "lg:min-w-[640px]"
                            : minWidth === "768px"
                                ? "lg:min-w-[768px]"
                                : "lg:min-w-[320px]";

        const allMediaIds: number[] = [];
        const imgs = (section.data as any)?.images ?? [];
        for (const row of imgs) {
            const id = Number(row?.mediaId);
            if (Number.isFinite(id) && id > 0) allMediaIds.push(id);
        }

        const { mediaMap: localMediaMap, loading } = useMediaByIds(allMediaIds);

        return (
            <Card
                className="bg-[var(--b-gy-bgcr)] p-5 flex flex-col items-center justify-center overflow-hidden"
                style={{ border: "var(--b-gy-br) solid var(--b-gy-bcr)", borderRadius: "var(--b-gy-rs)" }}
            >
                {!!title && (
                    <div
                        className="flex flex-row items-center font-semibold w-full"
                        style={{
                            color: "var(--b-gy-tcr)",
                            fontSize: "var(--b-gy-ttse)",
                            fontFamily: "var(--b-gy-tty)",
                            justifyContent: "var(--b-gy-tatt)",
                        }}
                    >
                        {title}
                    </div>
                )}

                <div className={cn("mt-3 grid grid-cols-1 gap-2 justify-center items-center", cols, wid, mWd)}>
                    {images && swiper === "true" && <ImagesSwiperSites mediaMap={localMediaMap as any} />}

                    {swiper === "false" &&
                        images.map((img: any, idx: number) => {
                            const mediaId = Number(img?.mediaId);
                            const resolvedUrl =
                                (typeof img?.url === "string" && img.url.trim()) ||
                                (Number.isFinite(mediaId) ? (localMediaMap as any)?.[mediaId]?.url : "") ||
                                "";

                            if (loading) {
                                return (
                                    <div
                                        key={idx}
                                        className="animate-pulse flex flex-row items-center justify-center w-full aspect-square"
                                    >
                                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                    </div>
                                );
                            }

                            if (!resolvedUrl) {
                                return (
                                    <div
                                        key={idx}
                                        className="h-32 w-full rounded-xl border border-slate-800 bg-slate-900"
                                        title={mediaId ? `mediaId: ${mediaId}` : "Sin imagen"}
                                    />
                                );
                            }

                            return (
                                <div
                                    key={idx}
                                    className="overflow-hidden border border-slate-500 bg-[var(--b-gy-cbcr)]"
                                    style={{ borderRadius: "var(--b-gy-crs)" }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={resolvedUrl}
                                        alt={img?.alt ?? ""}
                                        className="w-full aspect-square object-contain"
                                        loading="lazy"
                                    />
                                </div>
                            );
                        })}
                </div>
            </Card>
        );
    }

    if (section.kind === "productive") {
        const { title, type, items } = section.data;

        const pathname = usePathname();
        const sp = useSearchParams();
        const from = buildFrom(pathname, sp);

        const ids = React.useMemo(() => {
            return (items ?? [])
                .map((it) => safeInt(it.listingId))
                .filter((n): n is number => typeof n === "number");
        }, [items]);

        const { teasers } = useListingTeasers(type, ids);

        const base = businessSlug ? `/b/${businessSlug}` : "";

        return (
            <Card className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                {!!title && <div className="text-base font-semibold text-slate-100">{title}</div>}

                <div className="mt-2 text-[11px] text-slate-400">
                    {type === "product" ? "Productos" : "Servicios"} · {items?.length ?? 0}
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(items ?? []).map((it, idx) => {
                        const n = safeInt(it.listingId);
                        const canOpen = !!n && !!businessSlug;

                        const href = canOpen
                            ? `${base}/listing/${type}/${n}?from=${encodeURIComponent(from)}`
                            : "#";

                        const thumb = n ? teasers?.[n]?.thumbUrl ?? null : null;

                        return (
                            <Link
                                key={`${it.listingId}-${idx}`}
                                href={href}
                                className={cn(
                                    "block rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 overflow-hidden",
                                    !canOpen && "opacity-60 pointer-events-none"
                                )}
                                title={canOpen ? "Abrir" : "listingId inválido o falta businessSlug"}
                            >
                                {/* thumb */}
                                <div className="w-full h-[150px] bg-slate-950 border-b border-slate-800 flex items-center justify-center overflow-hidden">
                                    {thumb ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                        <div className="text-xs text-slate-600">Sin imagen</div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <div className="text-sm font-semibold text-slate-100 truncate">
                                        {it.title?.trim() ? it.title : "Sin título"}
                                    </div>

                                    {!!it.text?.trim() && <div className="mt-1 text-xs text-slate-400">{it.text}</div>}

                                    <div className="mt-3 text-[11px] text-slate-500">#{it.listingId}</div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </Card>
        );
    }

    if (section.kind === "cta") {
        const { title, text, buttonText = "Ver más", href } = section.data;

        return (
            <Card
                className="bg-[var(--b-ca-bgcr)] p-5 flex flex-col items-center justify-center"
                style={{ border: "var(--b-ca-br) solid var(--b-ca-bcr)", borderRadius: "var(--b-ca-rs)" }}
            >
                <div
                    className="flex flex-row items-center font-semibold w-full"
                    style={{
                        color: "var(--b-ca-ticr)",
                        fontSize: "var(--b-ca-titse)",
                        fontFamily: "var(--b-ca-tity)",
                        justifyContent: "var(--b-ca-tiatt)",
                    }}
                >
                    {title}
                </div>
                {!!text && (
                    <div
                        className="flex flex-row items-center font-semibold w-full"
                        style={{
                            color: "var(--b-ca-tcr)",
                            fontSize: "var(--b-ca-ttse)",
                            fontFamily: "var(--b-ca-tty)",
                            justifyContent: "var(--b-ca-tatt)",
                        }}
                    >
                        {text}
                    </div>
                )}

                {!!href && (
                    <div className="flex flex-row w-full" style={{ justifyContent: "var(--b-ca-btan)" }}>
                        <a
                            href={href}
                            className="mt-4 inline-flex px-3 py-2 bg-[var(--b-ca-btbdcr)] hover:bg-[var(--b-ca-btbdcrhv)] text-[var(--b-ca-btcr)]"
                            style={{
                                border: "var(--b-ca-btbr) solid var(--b-ca-btbrcr)",
                                borderRadius: "var(--b-ca-btrs)",
                                fontSize: "var(--b-ca-bttse)",
                                fontFamily: "var(--b-ca-btty)",
                            }}
                        >
                            {buttonText}
                        </a>
                    </div>
                )}
            </Card>
        );
    }

    return null;
}



