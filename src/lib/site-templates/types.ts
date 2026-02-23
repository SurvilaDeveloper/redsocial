// src/lib/site-templates/types.ts
export type TemplateNavKind = "home" | "page";

export type TemplateNavItem =
    | { kind: "home"; slug: "home"; title: string; order: number; visible: boolean }
    | { kind: "page"; slug: string; title: string; order: number; visible: boolean };

export type TemplatePage = {
    id: number;
    slug: string;
    title: string;
    content: any[]; // (en /t no tipamos sections todavía, total es demo)
};

export type TemplateBusiness = {
    slug: string;
    name: string;
    headline: string;
    category: string;

    surfaceBgColor: string;
    bgColor: string;
    width: string;

    headerHeight: string;
    headerBgColor: string;
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

    headerBgImageUrl?: string | null;
};

export type TemplateSite = {
    nav: TemplateNavItem[];
    homeContent: any[];
    themePreset: string;       // "classic" | "minimal" | "userPreset" etc.
    themeConfig: any | null;   // overrides

    // los dejo porque dijiste no tocar otras cosas (y pueden seguir existiendo en templates)
    showContactForm: boolean;
    contactEmailExists: boolean;
};

export type SiteTemplate = {
    id: string;
    label: string;
    previewImage: string;

    business: TemplateBusiness;
    site: TemplateSite;
    pages: TemplatePage[];
};