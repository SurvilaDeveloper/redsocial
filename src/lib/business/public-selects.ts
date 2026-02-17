// src/lib/business/public-selects.ts
import type { Prisma } from "@prisma/client";

/**
 * Selects "fuertes" (reutilizables) para el negocio público.
 * No cambian lógica: solo evitan duplicación.
 */

/** Para /b/[slug]/layout.tsx (permisos + theme vars) */
export const PUBLIC_BUSINESS_LAYOUT_SELECT = {
    id: true,
    slug: true,
    name: true,
    ownerId: true,

    deletedAt: true,
    active: true,
    status: true,

    site: {
        select: {
            themePreset: true,
            themeConfig: true,
        },
    },
} satisfies Prisma.BusinessSelect;

/** Para /b/[slug]/[tab]/page.tsx (vista pública completa) */
export const PUBLIC_BUSINESS_TAB_PAGE_SELECT = {
    id: true,
    slug: true,
    name: true,
    headline: true,
    category: true,

    surfaceBgColor: true,

    bgColor: true,
    width: true,

    headerHeight: true,
    headerBgColor: true,

    headerBgSize: true,
    headerBgPosition: true,

    titleColor: true,
    titleTypography: true,
    titleTextSize: true,
    titleAlignText: true,

    headlineColor: true,
    headlineTypography: true,
    headlineTextSize: true,
    headlineAlignText: true,

    categoryColor: true,
    categoryTypography: true,
    categoryTextSize: true,
    categoryAlignText: true,

    deletedAt: true,
    active: true,

    headerBgImage: { select: { url: true } },

    site: {
        select: {
            nav: true,
            homeContent: true,
            themePreset: true,
            themeConfig: true,
            showContactForm: true,
            contactEmail: true,
        },
    },

    pages: {
        where: { deletedAt: null, active: 1 },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            slug: true,
            title: true,
            content: true,
        },
    },

    owner: { select: { id: true, name: true, email: true } },
} satisfies Prisma.BusinessSelect;

/** Para "chrome" del listing detail */
export const PUBLIC_BUSINESS_CHROME_SELECT = {
    id: true,
    slug: true,
    name: true,
    headline: true,
    category: true,

    surfaceBgColor: true,

    bgColor: true,
    width: true,

    headerHeight: true,
    headerBgColor: true,

    headerBgSize: true,
    headerBgPosition: true,

    titleColor: true,
    titleTypography: true,
    titleTextSize: true,
    titleAlignText: true,

    headlineColor: true,
    headlineTypography: true,
    headlineTextSize: true,
    headlineAlignText: true,

    categoryColor: true,
    categoryTypography: true,
    categoryTextSize: true,
    categoryAlignText: true,

    headerBgImage: { select: { url: true } },

    site: {
        select: {
            nav: true,
        },
    },

    pages: {
        where: { deletedAt: null, active: 1 },
        select: { id: true, slug: true, title: true },
        orderBy: { createdAt: "asc" },
    },
} satisfies Prisma.BusinessSelect;
