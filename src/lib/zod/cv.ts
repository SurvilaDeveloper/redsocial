// src/lib/zod/cv.ts

import { z } from "zod";
import { COMMON_LANGUAGES } from "@/types/cv";
import { LANGUAGE_LABELS } from "@/types/cvLanguages";

export const cvContentSchema = z.object({
    sections: z.array(
        z.object({
            id: z.string(),
            type: z.string(),
        }).passthrough() // 👈 importante para flexibilidad
    ),
});

export const createCVSchema = z.object({
    title: z.string().min(1),
    summary: z.string().optional().default(""),
    content: cvContentSchema,
});

export const LANGUAGE_LEVELS = [
    "basic",
    "intermediate",
    "advanced",
    "native",
] as const;

export const languageLevelSchema = z.enum(LANGUAGE_LEVELS);


export const languageCodeSchema = z.enum([
    ...COMMON_LANGUAGES,
    "other",
]);

export const languageDataSchema = z.object({
    id: z.string(),
    code: languageCodeSchema,
    name: z.string().min(1, "El nombre del idioma es obligatorio"),
    level: languageLevelSchema,
    certification: z.string().optional(),
});

export const languageDataSchemaStrict = languageDataSchema.superRefine(
    (data, ctx) => {
        if (data.code !== "other") {
            const expected = LANGUAGE_LABELS[data.code];
            if (data.name !== expected) {
                ctx.addIssue({
                    path: ["name"],
                    message: "El nombre no coincide con el idioma seleccionado",
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    }
);

export const languagesSectionSchema = z.array(languageDataSchemaStrict)
    .max(10, "Demasiados idiomas")
    .refine(
        (langs) =>
            new Set(langs.map(l => `${l.code}:${l.name}`)).size === langs.length,
        { message: "No se pueden repetir idiomas" }
    );

export const cvSectionSchemas = {
    //experience: experienceSectionSchema,
    //education: educationSectionSchema,
    //skills: skillsSectionSchema,
    languages: languagesSectionSchema,
    //profile: profileSectionSchema,
    //projects: projectsSectionSchema,
    //custom: customSectionSchema,
} as const;


export const projectDataSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "El nombre del proyecto es obligatorio"),
    description: z.string().optional(),
    url: z.string().url().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const projectsSectionSchema = z
    .array(projectDataSchema)
    .max(10, "Demasiados proyectos")
    .refine(
        (projects) => new Set(projects.map((p) => p.name)).size === projects.length,
        { message: "No se pueden repetir nombres de proyectos" }
    );
