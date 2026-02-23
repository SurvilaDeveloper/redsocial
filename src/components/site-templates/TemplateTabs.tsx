//src/components/site-templates/TemplateTabs.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type TemplateNavItem = { kind: "home" | "page"; slug: string; title: string; order: number; visible: boolean };

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
function tabKey(item: TemplateNavItem): string {
    return item.slug;
}
function tabHref(templateId: string, item: TemplateNavItem): string {
    return `/t/${templateId}/${item.slug}`;
}

export function TemplateTabs({
    templateId,
    nav,
    activeTab,
    pages,
}: {
    templateId: string;
    nav: TemplateNavItem[];
    activeTab: string;
    pages: { id: number; slug: string; title: string }[];
}) {
    const items = useMemo(() => {
        const base = Array.isArray(nav) ? nav : [];
        const pageSlugs = new Set((pages ?? []).map((p) => safeStr(p.slug)));

        return base
            .filter(Boolean)
            .filter((x) => safeBool((x as any).visible, true))
            .filter((x) => (x.kind !== "page" ? true : pageSlugs.has(safeStr(x.slug))))
            .slice()
            .sort((a, b) => safeNum(a.order, 0) - safeNum(b.order, 0));
    }, [nav, pages]);

    const activeKey = normalizeActiveKey(activeTab);

    return (
        <div
            className="flex flex-row flex-wrap p-2 w-full gap-[var(--t-hr-bgp)]"
            style={{ justifyContent: "var(--t-hr-ban)" }}
        >
            {items.map((item) => {
                const key = tabKey(item);
                const isActive = key === activeKey;

                const common = "px-2 py-0 rounded-[var(--t-hr-brs)] transition select-none";

                const className = cn(
                    common,
                    isActive
                        ? "bg-[var(--t-hr-bbae)] border-[var(--t-hr-bbcae)] text-[var(--t-hr-bcae)]"
                        : "bg-[var(--t-hr-bbg)] border-[var(--t-hr-bbcr)] text-[var(--t-hr-bcr)] hover:bg-[var(--t-hr-bbhr)]"
                );

                const href = tabHref(templateId, item);

                return (
                    <Link
                        key={key}
                        href={href}
                        className={className}
                        style={{
                            borderWidth: "var(--t-hr-bbr)",
                            fontSize: "var(--t-hr-btse)",
                            fontFamily: "var(--t-hr-bty)",
                        }}
                    >
                        {safeStr(item.title, "Tab")}
                    </Link>
                );
            })}
        </div>
    );
}

