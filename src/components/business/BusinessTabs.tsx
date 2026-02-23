// src/components/business/BusinessTabs.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BusinessNavItem } from "@/types/business";

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
    return item.slug;
}
function tabHref(businessSlug: string, item: BusinessNavItem): string {
    return `/b/${businessSlug}/${item.slug}`;
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
        const pageSlugs = new Set((pages ?? []).map((p) => safeStr(p.slug)));

        return base
            .filter(Boolean)
            .filter((x) => safeBool((x as any).visible, true))
            .filter((x) => {
                if (x.kind !== "page") return true; // home ok
                return pageSlugs.has(safeStr(x.slug));
            })
            .slice()
            .sort((a, b) => safeNum(a.order, 0) - safeNum(b.order, 0));
    }, [nav, pages]);

    const activeKey = normalizeActiveKey(activeTab);

    return (
        <div className="flex flex-row flex-wrap p-2 w-full gap-[var(--b-hr-bgp)]" style={{ justifyContent: "var(--b-hr-ban)" }}>
            {items.map((item) => {
                const key = tabKey(item);
                const isActive = key === activeKey;
                const common = "px-2 py-0 rounded-[var(--b-hr-brs)] transition select-none";
                const className = cn(
                    common,
                    isActive
                        ? "bg-[var(--b-hr-bbae)] border-[var(--b-hr-bbcae)] text-[var(--b-hr-bcae)]"
                        : "bg-[var(--b-hr-bbg)] border-[var(--b-hr-bbcr)] text-[var(--b-hr-bcr)] hover:bg-[var(--b-hr-bbhr)]"
                );

                return (
                    <Link
                        key={key}
                        href={tabHref(slug, item)}
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
