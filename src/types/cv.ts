// src/types/cv.ts

import type { CVStyleConfig } from "./cvStyle";

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

export type LanguageLevel =
    | "basic"
    | "intermediate"
    | "advanced"
    | "native";

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

    title: string;          // "Certificación AWS"
    subtitle?: string;      // "Amazon Web Services"
    description?: string;   // Texto libre
    date?: string;          // "2023", "2022–2024"
    url?: string;           // link externo
};

export type CustomData = {
    title: string;          // "Certificaciones", "Cursos", etc.
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

/* ================= CONTENT ================= */

export interface CVContent {
    sections: CVSection[];
}

/* ================= CV ================= */

export interface Curriculum {
    id: number;
    userId: number;
    title: string;
    summary: string;
    content: CVContent;
    styleConfig?: CVStyleConfig | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}


