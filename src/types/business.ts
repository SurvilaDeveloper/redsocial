// src/types/business.ts
import type { BusinessPageContent } from "@/types/business-sections";

export type BusinessNavItem =
    | { kind: "home"; title: string; order: number; visible: boolean }
    | { kind: "products"; title: string; order: number; visible: boolean }
    | { kind: "services"; title: string; order: number; visible: boolean }
    | { kind: "wall"; title: string; order: number; visible: boolean }
    | { kind: "contact"; title: string; order: number; visible: boolean }
    | { kind: "page"; slug: string; title: string; order: number; visible: boolean }
    | { kind: "external"; href: string; title: string; order: number; visible: boolean };

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

    bgColor: string;
    width: string;

    headerHeight: string;
    headerBgColor: string;

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
    themeConfig: any;
    showContactForm: boolean;
    contactEmailExists: boolean;
};

