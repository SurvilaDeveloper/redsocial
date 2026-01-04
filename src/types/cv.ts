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

export type ExperienceData = {
    company: string;
    role: string;
    startDate: string;
    endDate?: string;
    description?: string;
};

export type EducationData = {
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
    description?: string;
};

export type SkillData = {
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

/* ================= MAPA ================= */

export interface CVSectionDataMap {
    experience: ExperienceData;
    education: EducationData;
    skills: SkillData[];
    profile: {
        fullName: string;
        headline?: string;
        location?: string;
    };
    projects: ProjectData[];
    languages: LanguageData[];
    custom: Record<string, any>;
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
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}


