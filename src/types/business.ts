// src/types/business.ts
import type { BusinessPageContent } from "@/types/business-sections";

export type BusinessNavKind = "home" | "page";
export type HeaderOverlayPosition = "left" | "center" | "right" | "none";

/**
 * Regla: tab === navItem.slug SIEMPRE.
 * kind solo indica el “tipo” de página.
 */
export type BusinessNavItem =
    | { kind: "home"; slug: "home"; title: string; order: number; visible: boolean }
    | { kind: "page"; slug: string; title: string; order: number; visible: boolean };

export type BusinessPageDTO = {
    id: number;
    slug: string;
    title: string;
    content: BusinessPageContent;
};

export type BusinessDTO = {
    id: number;
    slug: string;
    name: string;
    headline: string;
    category: string;

    surfaceBgColor: string;

    bgColor: string;
    width: string;

    headerHeight: string;
    headerBgColor: string;

    headerOpacityOverlay: number;
    headerOverlayPosition: HeaderOverlayPosition;

    headerBgSize: string;
    headerBgPosition: string;

    titleColor: string;
    titleTypography: string;
    titleTextSize: number;
    titleAlignText: string;

    headlineColor: string;
    headlineTypography: string;
    headlineTextSize: number;
    headlineAlignText: string;

    categoryColor: string;
    categoryTypography: string;
    categoryTextSize: number;
    categoryAlignText: string;

    ownerName: string;
    headerBgImageUrl?: string | null;
};

export type BusinessSiteDTO = {
    nav: BusinessNavItem[];
    homeContent: BusinessPageContent;

    // preset activo en el sitio público
    themePreset: string;

    // userPreset guardado (si existe). En público NO manda, manda themePreset.
    themeConfig: any;

    // ⛔️ ya NO es necesario forzar contacto por flag
    // showContactForm: boolean;
    // contactEmailExists: boolean;
};