// src/types/cvStyle.ts

import { CVThemeColor } from "./cvTheme";

export type CVTextStyle = {
    fontFamily: string;
    fontSize: string;
    color: string;
};

// ✅ elementos que el usuario puede estilizar
export type CVStyleElement =
    | "docTitle"
    | "name"
    | "headline"
    | "summary"
    | "title"
    | "subtitle"
    | "description"
    | "date"
    | "itemTitle"
    | "itemSubtitle";

export type CVStyleConfig = {
    // estilos por rol
    docTitle: CVTextStyle;
    name: CVTextStyle;
    headline: CVTextStyle;
    summary: CVTextStyle;

    title: CVTextStyle;
    subtitle: CVTextStyle;
    description: CVTextStyle;
    date: CVTextStyle;

    itemTitle: CVTextStyle;
    itemSubtitle: CVTextStyle;

    // flags de layout (por ahora)
    showDocTitle: boolean;

    template: string;

    // ✅ NUEVO: theme (opcional por compatibilidad con CVs viejos)
    theme?: {
        color?: CVThemeColor; // "slate" por defecto (lo resolvemos en zod/normalize)
    };
};

