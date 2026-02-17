// src/app/studio/business/[id]/theme/page.tsx
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/custom/navbar";
import BusinessThemeEditor from "@/components/business/editor/BusinessThemeEditor";
import type { BusinessThemeConfig, ThemePresetId } from "@/types/business-theme";

function safeParseJson<T>(v: any, fallback: T): T {
    try {
        if (v == null) return fallback;
        if (typeof v === "string") return JSON.parse(v) as T;
        return v as T;
    } catch {
        return fallback;
    }
}

function safeParseUserPreset(v: any): BusinessThemeConfig | null {
    const obj = safeParseJson<any>(v, null);
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;

    // mínima validación “shape”: si no tiene header/hero/etc, igual dejamos que mergeTheme lo complete,
    // pero necesitamos que sea object.
    return obj as BusinessThemeConfig;
}

function clampPreset(v: any): ThemePresetId {
    const s = String(v ?? "").trim();
    if (s === "classic" || s === "modern" || s === "bold" || s === "minimal" || s === "userPreset") return s;
    return "classic";
}

export default async function BusinessThemeStudioPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) redirect("/api/auth/signin");

    const { id } = await params;
    const businessId = Number(id);
    if (Number.isNaN(businessId)) notFound();

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { site: true },
    });

    if (!business || business.deletedAt != null || business.active !== 1) notFound();
    if (business.ownerId !== userId) notFound();

    const initialPreset = clampPreset(business.site?.themePreset);
    const initialUserPreset = safeParseUserPreset(business.site?.themeConfig);

    return (
        <>
            <Navbar />
            <BusinessThemeEditor
                businessId={business.id}
                businessSlug={business.slug}
                businessName={business.name}
                initialPreset={initialPreset}
                initialUserPreset={initialUserPreset}
            />
        </>
    );
}