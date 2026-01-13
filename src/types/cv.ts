// src/types/cv.ts

export type CVSectionType =
    | "profile"
    | "experience"
    | "education"
    | "skills"
    | "projects"
    | "languages"
    | "custom";

/* ================= DATA POR SECCIÓN ================= */

export type ExperienceItem = {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate?: string;
    description?: string;
    items: string[];
};

// ⬇️ ahora la sección experience guarda un array
export type ExperienceData = ExperienceItem[];

export type EducationItem = {
    id: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
    description?: string;
};

export type EducationData = EducationItem[];

export type SkillData = {
    id: string;
    name: string;
    level?: "basic" | "intermediate" | "advanced" | "expert";
};

export const COMMON_LANGUAGES = [
    "spanish",
    "english",
    "portuguese",
    "french",
    "german",
    "italian",
] as const;

export type CommonLanguage = typeof COMMON_LANGUAGES[number];

export type LanguageLevel = "basic" | "intermediate" | "advanced" | "native";

export type LanguageData = {
    id: string;
    code: CommonLanguage | "other";
    name?: string;
    level: LanguageLevel;
    certification?: string;
};

export type ProjectData = {
    id: string;
    name: string;
    description?: string;
    url?: string;
    startDate?: string;
    endDate?: string;
};

export type ProfileData = {
    // Identidad
    fullName: string;
    headline?: string;

    // Ubicación
    address?: string;
    postalCode?: string;
    city?: string;

    // Datos personales
    birthPlace?: string;
    nationality?: string;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";
    maritalStatus?: "single" | "married" | "divorced" | "widowed";
    drivingLicense?: string;

    // 🔒 VISIBILIDAD (UI / Preview)
    showBirthDate?: boolean;
    showAddress?: boolean;
    showGender?: boolean;

    // Contacto
    email?: string;
    phone?: string;
    website?: string;

    // Profesional
    linkedin?: string;
    github?: string;

    // Redes
    facebook?: string;
    instagram?: string;
    youtube?: string;
    x?: string;
    discord?: string;

    // Contenido
    medium?: string;
    devto?: string;
};

export type CustomItem = {
    id: string;

    title: string; // "Certificación AWS"
    subtitle?: string; // "Amazon Web Services"
    description?: string; // Texto libre
    date?: string; // "2023", "2022–2024"
    url?: string; // link externo
};

export type CustomData = {
    title: string; // "Certificaciones", "Cursos", etc.
    items: CustomItem[];
};

/* ================= MAPA ================= */

export interface CVSectionDataMap {
    experience: ExperienceData;
    education: EducationData;
    skills: SkillData[];
    profile: ProfileData;
    projects: ProjectData[];
    languages: LanguageData[];
    custom: CustomData;
}

/* ================= SECTION ================= */

export interface CVSection<T extends CVSectionType = CVSectionType> {
    id: string;
    type: T;
    data: CVSectionDataMap[T];
}

/* ================ IMAGE =============== */

// ✅ no opcional: en toda la app lo normalizás a null/boolean
export type HeaderImageMeta = {
    url: string | null;
    publicId: string | null;
    show: boolean;
};

/* ================= CONTENT ================= */

export type CVContent = {
    sections: CVSection[];
    meta?: {
        headerImage?: HeaderImageMeta;
    };
};

/* ================= CURRICULUM ================= */

export type Curriculum = {
    id: number | null;
    userId: number | null;
    title: string;
    summary: string;
    birthDate: string | null;

    content: CVContent;

    // ✅ mejor sin "?" para no tener undefined vs null (si querés compat, lo volvemos opcional)
    styleConfig: CVStyleConfig | null;

    isPublic: boolean;

    createdAt: string;
    updatedAt: string;
};

/* =============== THEME ================ */

export type CVThemeColor = "slate" | "blue" | "green" | "red" | "violet" | "amber";

export type Tone = {
    // backgrounds
    bg900: string;
    bg800: string;
    bg700: string;
    bg600: string;
    bg500: string;
    bg400: string;
    bg300: string;
    bg200: string;
    bg100: string;
    bg50: string;

    // borders/rings/text accents
    ring200: string;
    border200: string;
    text900: string;
    text700: string;
};

export const TONES: Record<CVThemeColor, Tone> = {
    slate: {
        bg900: "bg-slate-900",
        bg800: "bg-slate-800",
        bg700: "bg-slate-700",
        bg600: "bg-slate-600",
        bg500: "bg-slate-500",
        bg400: "bg-slate-400",
        bg300: "bg-slate-300",
        bg200: "bg-slate-200",
        bg100: "bg-slate-100",
        bg50: "bg-slate-50",
        ring200: "ring-slate-200",
        border200: "border-slate-200",
        text900: "text-slate-900",
        text700: "text-slate-700",
    },
    blue: {
        bg900: "bg-blue-900",
        bg800: "bg-blue-800",
        bg700: "bg-blue-700",
        bg600: "bg-blue-600",
        bg500: "bg-blue-500",
        bg400: "bg-blue-400",
        bg300: "bg-blue-300",
        bg200: "bg-blue-200",
        bg100: "bg-blue-100",
        bg50: "bg-blue-50",
        ring200: "ring-blue-200",
        border200: "border-blue-200",
        text900: "text-blue-900",
        text700: "text-blue-700",
    },
    green: {
        bg900: "bg-green-900",
        bg800: "bg-green-800",
        bg700: "bg-green-700",
        bg600: "bg-green-600",
        bg500: "bg-green-500",
        bg400: "bg-green-400",
        bg300: "bg-green-300",
        bg200: "bg-green-200",
        bg100: "bg-green-100",
        bg50: "bg-green-50",
        ring200: "ring-green-200",
        border200: "border-green-200",
        text900: "text-green-900",
        text700: "text-green-700",
    },
    red: {
        bg900: "bg-red-900",
        bg800: "bg-red-800",
        bg700: "bg-red-700",
        bg600: "bg-red-600",
        bg500: "bg-red-500",
        bg400: "bg-red-400",
        bg300: "bg-red-300",
        bg200: "bg-red-200",
        bg100: "bg-red-100",
        bg50: "bg-red-50",
        ring200: "ring-red-200",
        border200: "border-red-200",
        text900: "text-red-900",
        text700: "text-red-700",
    },
    violet: {
        bg900: "bg-violet-900",
        bg800: "bg-violet-800",
        bg700: "bg-violet-700",
        bg600: "bg-violet-600",
        bg500: "bg-violet-500",
        bg400: "bg-violet-400",
        bg300: "bg-violet-300",
        bg200: "bg-violet-200",
        bg100: "bg-violet-100",
        bg50: "bg-violet-50",
        ring200: "ring-violet-200",
        border200: "border-violet-200",
        text900: "text-violet-900",
        text700: "text-violet-700",
    },
    amber: {
        bg900: "bg-amber-900",
        bg800: "bg-amber-800",
        bg700: "bg-amber-700",
        bg600: "bg-amber-600",
        bg500: "bg-amber-500",
        bg400: "bg-amber-400",
        bg300: "bg-amber-300",
        bg200: "bg-amber-200",
        bg100: "bg-amber-100",
        bg50: "bg-amber-50",
        ring200: "ring-amber-200",
        border200: "border-amber-200",
        text900: "text-amber-900",
        text700: "text-amber-700",
    },
};

export function coerceThemeColor(input: unknown): CVThemeColor {
    const v = typeof input === "string" ? (input.trim() as CVThemeColor) : null;
    return v && v in TONES ? v : "slate";
}

/* =================== STYLE ==================== */

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
    | "personal"
    | "title"
    | "subtitle"
    | "description"
    | "date"
    | "itemTitle"
    | "itemSubtitle"
    | "link";

// ✅ alineá con tu zod cvTemplateIdSchema
export const CV_TEMPLATES = [
    "classic",
    "compact",
    "modernSidebar",
    "timeline",
    "rightProfileAccent",
    "ribbonTheme",
] as const;

export type CVTemplateId = (typeof CV_TEMPLATES)[number];


export type CVStyleConfig = {
    // estilos por rol
    docTitle: CVTextStyle;
    name: CVTextStyle;
    headline: CVTextStyle;
    summary: CVTextStyle;

    personal: CVTextStyle;

    title: CVTextStyle;
    subtitle: CVTextStyle;
    description: CVTextStyle;
    date: CVTextStyle;

    itemTitle: CVTextStyle;
    itemSubtitle: CVTextStyle;

    link: CVTextStyle;

    // flags de layout
    showDocTitle: boolean;

    // ✅ template tipado
    template: CVTemplateId;

    // theme (opcional por compat)
    theme?: {
        color?: CVThemeColor;
    };
};
