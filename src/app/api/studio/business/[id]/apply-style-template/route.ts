//src/app/api/studio/business/[id]/apply-style-template/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import {
    getSiteTemplateById,
    normalizeTemplateNav,
    getTemplateThemePreset,
    getTemplateThemeConfig,
} from "@/lib/site-templates/siteTemplates";

function safeStr(v: any) {
    return typeof v === "string" ? v.trim() : "";
}

function safeJson<T>(v: any, fallback: T): T {
    try {
        if (v == null) return fallback;
        if (typeof v === "string") return JSON.parse(v) as T;
        return v as T;
    } catch {
        return fallback;
    }
}

function safeNum(v: any, fallback: number) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function clampInt(v: any, min: number, max: number, fallback: number) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(n)));
}

function clampText(v: any, max: number, fallback = "") {
    const s = safeStr(v);
    if (!s) return fallback;
    return s.slice(0, max);
}

function clampHex(v: any, fallback: string) {
    const s = safeStr(v);
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
    return fallback;
}

// ✅ Enums del schema (validación dura + defaults)
type BusinessWidth = "full" | "xl" | "lg" | "md" | "sm";
type BusinessHeaderHeight = "full" | "xl" | "lg" | "md" | "sm";
type HeaderBgSize = "cover" | "contain";
type HeaderBgPosition = "left" | "center" | "right";
type HeaderOverlayPosition = "left" | "center" | "right" | "none";
type BusinessAlignText = "start" | "center" | "end";

function clampWidth(v: any, fallback: BusinessWidth = "xl"): BusinessWidth {
    const s = safeStr(v);
    return s === "full" || s === "xl" || s === "lg" || s === "md" || s === "sm" ? s : fallback;
}

function clampHeaderHeight(v: any, fallback: BusinessHeaderHeight = "md"): BusinessHeaderHeight {
    const s = safeStr(v);
    return s === "full" || s === "xl" || s === "lg" || s === "md" || s === "sm" ? s : fallback;
}

function clampHeaderBgSize(v: any, fallback: HeaderBgSize = "cover"): HeaderBgSize {
    const s = safeStr(v);
    return s === "cover" || s === "contain" ? s : fallback;
}

function clampHeaderBgPosition(v: any, fallback: HeaderBgPosition = "left"): HeaderBgPosition {
    const s = safeStr(v);
    return s === "left" || s === "center" || s === "right" ? s : fallback;
}

function clampOverlayPosition(v: any, fallback: HeaderOverlayPosition = "none"): HeaderOverlayPosition {
    const s = safeStr(v);
    return s === "left" || s === "center" || s === "right" || s === "none" ? s : fallback;
}

function clampAlignText(v: any, fallback: BusinessAlignText = "center"): BusinessAlignText {
    const s = safeStr(v);
    return s === "start" || s === "center" || s === "end" ? s : fallback;
}

function clampTypography(v: any, fallback = "system") {
    // En tu sistema esto a veces es "Inter, system-ui, sans-serif"
    // Guardamos tal cual, pero acotado para DB.
    return clampText(v, 100, fallback) || fallback;
}

function clampFontSize(v: any, fallback: number) {
    // mantenelo simple y seguro (TinyInt)
    return clampInt(v, 8, 72, fallback);
}

function toBool(v: any, fallback = true): boolean {
    if (typeof v === "boolean") return v;
    if (v === 1 || v === "1") return true;
    if (v === 0 || v === "0") return false;
    return fallback;
}

// ✅ Limpia imágenes del content antes de guardar a DB
function stripImagesFromContent(content: any): any {
    const list = Array.isArray(content) ? content : [];

    return list.map((section) => {
        if (!section || typeof section !== "object") return section;

        // clone shallow
        const next = { ...section };
        const kind = String((next as any).kind ?? "").trim();

        // data clone
        const data =
            (next as any).data && typeof (next as any).data === "object"
                ? { ...(next as any).data }
                : null;

        // gallery: en DB lo guardamos vacío (sin urls, sin mediaIds)
        if (kind === "gallery" && data) {
            data.images = [];
            next.data = data;
            return next;
        }

        // productive: en templates es demo. En DB lo guardamos vacío (el user lo completa con listings reales).
        if (kind === "productive" && data) {
            data.items = [];
            next.data = data;
            return next;
        }

        // cta/hero/text/features: no toco nada
        if (data) next.data = data;

        return next;
    });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        const userId = session?.user?.id != null ? Number(session.user.id) : null;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const businessId = Number(id);
        if (Number.isNaN(businessId)) {
            return NextResponse.json({ error: "Invalid business id" }, { status: 400 });
        }

        const body = await req.json().catch(() => null);
        const templateId = safeStr(body?.templateId);
        if (!templateId) {
            return NextResponse.json({ error: "templateId requerido" }, { status: 400 });
        }

        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: { id: true, ownerId: true, deletedAt: true, active: true },
        });

        if (!business || business.deletedAt != null || business.active !== 1) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }
        if (business.ownerId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const t = getSiteTemplateById(templateId);
        if (!t) {
            return NextResponse.json({ error: "Template no encontrado" }, { status: 404 });
        }

        const tBusiness = (t as any).business ?? {};
        const tSite = (t as any).site ?? {};
        const tPages = Array.isArray((t as any).pages) ? (t as any).pages : [];

        const nav = normalizeTemplateNav(tSite?.nav);
        if (!nav.length) {
            return NextResponse.json({ error: "Template nav inválido (falta home/contacto)" }, { status: 400 });
        }

        // ✅ HomeContent: lo limpiamos para DB (sin imágenes)
        const homeContentRaw = safeJson<any>(tSite?.homeContent, []);
        const homeContent = stripImagesFromContent(homeContentRaw);

        // ✅ Theme: viene SOLO desde t.site (helpers tipados)
        const themeConfig = getTemplateThemeConfig(t);
        const themePreset = getTemplateThemePreset(t);

        // ✅ Business styles (robusto con fallbacks)
        const businessPatch = {
            surfaceBgColor: clampHex(tBusiness.surfaceBgColor, "#000000"),
            bgColor: clampHex(tBusiness.bgColor, "#000000"),
            width: clampWidth(tBusiness.width, "xl"),

            headerHeight: clampHeaderHeight(tBusiness.headerHeight, "md"),
            headerBgColor: clampHex(tBusiness.headerBgColor, "#222222"),
            headerBgSize: clampHeaderBgSize(tBusiness.headerBgSize, "cover"),
            headerBgPosition: clampHeaderBgPosition(tBusiness.headerBgPosition, "left"),

            // ✅ overlay header
            headerOpacityOverlay: clampInt(tBusiness.headerOpacityOverlay, 0, 100, 0),
            headerOverlayPosition: clampOverlayPosition(tBusiness.headerOverlayPosition, "none"),

            titleColor: clampHex(tBusiness.titleColor, "#cccccc"),
            titleTypography: clampTypography(tBusiness.titleTypography, "system"),
            titleTextSize: clampFontSize(tBusiness.titleTextSize, 24),
            titleAlignText: clampAlignText(tBusiness.titleAlignText, "center"),

            headlineColor: clampHex(tBusiness.headlineColor, "#cccccc"),
            headlineTypography: clampTypography(tBusiness.headlineTypography, "system"),
            headlineTextSize: clampFontSize(tBusiness.headlineTextSize, 20),
            headlineAlignText: clampAlignText(tBusiness.headlineAlignText, "center"),

            categoryColor: clampHex(tBusiness.categoryColor, "#cccccc"),
            categoryTypography: clampTypography(tBusiness.categoryTypography, "system"),
            categoryTextSize: clampFontSize(tBusiness.categoryTextSize, 20),
            categoryAlignText: clampAlignText(tBusiness.categoryAlignText, "center"),
        } satisfies Record<string, any>;

        await prisma.$transaction(async (tx) => {
            // 1) Update Business styles
            await tx.business.update({
                where: { id: businessId },
                data: businessPatch,
            });

            // 2) Upsert BusinessSite
            const siteCreate: any = {
                businessId,
                showContactForm: toBool(tSite?.showContactForm, true),
            };

            if (themePreset) siteCreate.themePreset = themePreset;
            if (themeConfig && typeof themeConfig === "object") siteCreate.themeConfig = themeConfig;

            await tx.businessSite.upsert({
                where: { businessId },
                create: siteCreate,
                update: {
                    ...(themePreset ? { themePreset } : {}),
                    ...(themeConfig && typeof themeConfig === "object" ? { themeConfig } : {}),
                    showContactForm: toBool(tSite?.showContactForm, true),
                },
            });
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("POST /api/studio/business/[id]/apply-style-template error:", e);
        return NextResponse.json(
            { error: "Internal error", detail: String(e?.message ?? e) },
            { status: 500 }
        );
    }
}