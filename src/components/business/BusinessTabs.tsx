// src/components/business/BusinessTabs.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type BusinessNavItem =
    | { kind: "home"; title: string; visible: boolean; order: number }
    | { kind: "products"; title: string; visible: boolean; order: number }
    | { kind: "services"; title: string; visible: boolean; order: number }
    | { kind: "wall"; title: string; visible: boolean; order: number }
    | { kind: "contact"; title: string; visible: boolean; order: number }
    | { kind: "page"; slug: string; title: string; visible: boolean; order: number }
    | { kind: "external"; href: string; title: string; visible: boolean; order: number };

function safeStr(v: any, fallback = ""): string {
    const s = typeof v === "string" ? v.trim() : "";
    return s || fallback;
}

function safeBool(v: any, fallback = true): boolean {
    if (typeof v === "boolean") return v;
    return fallback;
}

function safeNum(v: any, fallback = 0): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function normalizeActiveKey(v: any): string {
    return safeStr(v, "").trim();
}

function tabKey(item: BusinessNavItem): string {
    if (item.kind === "home") return "home";
    if (item.kind === "products") return "products";
    if (item.kind === "services") return "services";
    if (item.kind === "wall") return "wall";
    if (item.kind === "contact") return "contact";
    if (item.kind === "page") return safeStr(item.slug, "page");
    if (item.kind === "external") return safeStr(item.href, "external");
    return "home";
}

function tabHref(slug: string, item: BusinessNavItem): string {
    if (item.kind === "home") return `/b/${slug}/home`;
    if (item.kind === "products") return `/b/${slug}/products`;
    if (item.kind === "services") return `/b/${slug}/services`;
    if (item.kind === "wall") return `/b/${slug}/wall`;
    if (item.kind === "contact") return `/b/${slug}/contact`;
    if (item.kind === "page") return `/b/${slug}/${safeStr(item.slug)}`;
    if (item.kind === "external") return safeStr(item.href);
    return `/b/${slug}`;
}

export function BusinessTabs({
    slug,
    nav,
    activeTab,
    pages,
}: {
    slug: string;
    nav: BusinessNavItem[];
    activeTab: string;
    pages: { id: number; slug: string; title: string }[];
}) {
    const items = useMemo(() => {
        const base = Array.isArray(nav) ? nav : [];

        // solo permitimos pages que existan realmente (para evitar links rotos)
        const pageSlugs = new Set((pages ?? []).map((p) => safeStr(p.slug)));

        return base
            .filter((x) => !!x)
            .filter((x) => safeBool((x as any).visible, true))
            .filter((x) => (x.kind === "page" ? pageSlugs.has(safeStr(x.slug)) : true))
            .slice()
            .sort((a, b) => safeNum(a.order, 0) - safeNum(b.order, 0));
    }, [nav, pages]);

    const activeKey = normalizeActiveKey(activeTab);

    return (
        <div
            className="flex flex-row flex-wrap p-2 w-full gap-[var(--b-hr-bgp)]"
            style={{ justifyContent: "var(--b-hr-ban)" }}
        >
            {items.map((item) => {
                const key = tabKey(item);
                const isActive = key === activeKey;

                const common =
                    "px-2 py-0 rounded-[var(--b-hr-brs)] transition select-none";

                const className = cn(
                    common,
                    isActive
                        ? "bg-[var(--b-hr-bbae)] border-[var(--b-hr-bbcae)] text-[var(--b-hr-bcae)]"
                        : "bg-[var(--b-hr-bbg)] border-[var(--b-hr-bbcr)] text-[var(--b-hr-bcr)] hover:bg-[var(--b-hr-bbhr)]"
                );

                const href = tabHref(slug, item);

                // ✅ external => <a>
                if (item.kind === "external") {
                    return (
                        <a
                            key={key}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                                common,
                                "bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800"
                            )}
                            style={{
                                borderWidth: "var(--b-hr-bbr)",
                                fontSize: "var(--b-hr-btse)",
                                fontFamily: "var(--b-hr-bty)",
                            }}
                        >
                            {safeStr(item.title, "Link")}
                        </a>
                    );
                }

                return (
                    <Link
                        key={key}
                        href={href}
                        className={className}
                        style={{
                            borderWidth: "var(--b-hr-bbr)",
                            fontSize: "var(--b-hr-btse)",
                            fontFamily: "var(--b-hr-bty)",
                        }}
                    >
                        {safeStr(item.title, "Tab")}
                    </Link>
                );
            })}
        </div>
    );
}


