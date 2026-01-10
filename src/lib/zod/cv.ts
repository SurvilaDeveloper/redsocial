// src/lib/zod/cv.ts
import { z } from "zod";
import { COMMON_LANGUAGES } from "@/types/cv";
import { LANGUAGE_LABELS } from "@/types/cvLanguages";

import {
    optionalMonthYYYYMM,
    monthYYYYMM,
    yearYYYY,
    yearOrMonth,
    optionalYearOrMonth,
    endAfterStartRefine,
    optionalBirthDateSchema,
} from "@/lib/zod/dates";

/* =========================================================
   Helpers generales
========================================================= */

const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);

const optionalTrimmedString = () =>
    z.preprocess(trim, z.string().min(1).optional());

const optionalUrl = z.preprocess(
    (v) => {
        const t = typeof v === "string" ? v.trim() : "";
        return t ? t : undefined;
    },
    z.string().url().optional()
);

const optionalEmail = z.preprocess(
    (v) => {
        const t = typeof v === "string" ? v.trim() : "";
        return t ? t : undefined;
    },
    z.string().email().optional()
);

/* =========================================================
   CV root
========================================================= */

const sectionTypeSchema = z.enum([
    "profile",
    "experience",
    "education",
    "skills",
    "projects",
    "languages",
    "custom",
]);

const headerImageSchema = z
    .object({
        url: z.string().url().nullable().optional(),
        publicId: z.string().nullable().optional(),
        show: z.boolean().optional(),
    })
    .optional();

export const cvContentSchema = z.object({
    sections: z.array(
        z
            .object({
                id: z.string(),
                type: sectionTypeSchema,
            })
            .passthrough()
    ),

    // ✅ NUEVO
    meta: z
        .object({
            headerImage: headerImageSchema,
        })
        .passthrough()
        .optional(),
});


const styleElementSchema = z
    .object({
        fontFamily: z.string().min(1),
        fontSize: z.string().min(1),
        color: z.string().min(1).optional(),
    })
    .passthrough();

// + si querés, podés importar el tipo/const de colores; pero Zod necesita runtime,
// así que mejor definimos el enum acá:
const cvThemeColorSchema = z.enum(["slate", "blue", "green", "red", "violet", "amber"]).catch("slate");

export const cvStyleConfigSchema = z
    .object({
        showDocTitle: z.boolean().optional(),
        template: z.string().optional(), // ✅ alinear con TS

        docTitle: styleElementSchema.optional(),
        name: styleElementSchema.optional(),
        headline: styleElementSchema.optional(),
        summary: styleElementSchema.optional(),

        title: styleElementSchema.optional(),
        subtitle: styleElementSchema.optional(),
        description: styleElementSchema.optional(),
        date: styleElementSchema.optional(),

        itemTitle: styleElementSchema.optional(),
        itemSubtitle: styleElementSchema.optional(),

        // ✅ NUEVO
        theme: z
            .object({
                color: cvThemeColorSchema.optional(), // si viene basura => "slate" por .catch
            })
            .optional(),
    })
    .passthrough();


export const createCVSchema = z.object({
    title: z.string().min(1),
    summary: z.string().optional().default(""),
    content: cvContentSchema,
    styleConfig: cvStyleConfigSchema.optional(),
});

/* =========================================================
   Languages
========================================================= */

export const LANGUAGE_LEVELS = [
    "basic",
    "intermediate",
    "advanced",
    "native",
] as const;

export const languageLevelSchema = z.enum(LANGUAGE_LEVELS);

export const languageCodeSchema = z.enum([...COMMON_LANGUAGES, "other"]);

export const languageDataSchema = z.object({
    id: z.string(),
    code: languageCodeSchema,
    name: z.string().optional(),
    level: languageLevelSchema,
    certification: z.string().optional(),
});

export const languageDataSchemaStrict = languageDataSchema.superRefine(
    (data, ctx) => {
        if (data.code === "other") {
            if (!data.name || !data.name.trim()) {
                ctx.addIssue({
                    path: ["name"],
                    message: "El nombre del idioma es obligatorio",
                    code: z.ZodIssueCode.custom,
                });
            }
            return;
        }

        const expected = LANGUAGE_LABELS[data.code];
        if (data.name !== expected) {
            ctx.addIssue({
                path: ["name"],
                message: "El nombre no coincide con el idioma seleccionado",
                code: z.ZodIssueCode.custom,
            });
        }
    }
);

export const languagesSectionSchema = z
    .array(languageDataSchemaStrict)
    .max(10, "Demasiados idiomas")
    .refine(
        (langs) =>
            new Set(langs.map((l) => `${l.code}:${l.name}`)).size === langs.length,
        { message: "No se pueden repetir idiomas" }
    );

/* =========================================================
   Projects
========================================================= */

export const projectDataSchema = z
    .object({
        id: z.string(),
        name: z.string().min(1, "El nombre del proyecto es obligatorio"),
        description: z.string().optional(),
        url: optionalUrl,
        startDate: optionalMonthYYYYMM,
        endDate: optionalMonthYYYYMM,
    })
    .superRefine(endAfterStartRefine);

export const projectsSectionSchema = z
    .array(projectDataSchema)
    .max(10, "Demasiados proyectos")
    .refine(
        (projects) =>
            new Set(projects.map((p) => p.name.trim().toLowerCase())).size ===
            projects.length,
        { message: "No se pueden repetir nombres de proyectos" }
    );

/* =========================================================
   Profile
========================================================= */

const optionalTrimmed = () => z.preprocess(trim, z.string().optional());

const genderSchema = z.enum(["male", "female", "other", "prefer_not_to_say"]);
const maritalStatusSchema = z.enum(["single", "married", "divorced", "widowed"]);

export const profileSectionSchema = z.object({
    // Identidad
    fullName: z.preprocess(trim, z.string().min(1, "El nombre es obligatorio")),
    headline: optionalTrimmed(),

    // Ubicación
    address: optionalTrimmed(),
    postalCode: optionalTrimmed(),
    city: optionalTrimmed(),

    // Datos personales
    birthPlace: optionalTrimmed(),
    nationality: optionalTrimmed(),
    gender: genderSchema.optional(),
    maritalStatus: maritalStatusSchema.optional(),
    drivingLicense: optionalTrimmed(),

    // 🔒 VISIBILIDAD (UI / Preview)
    showBirthDate: z.boolean().optional(),
    showAddress: z.boolean().optional(),
    showGender: z.boolean().optional(),

    // Contacto
    email: optionalEmail,
    phone: optionalTrimmed(),
    website: optionalUrl,

    // Profesional
    linkedin: optionalUrl,
    github: optionalUrl,

    // Redes
    facebook: optionalUrl,
    instagram: optionalUrl,
    youtube: optionalUrl,
    x: optionalUrl,
    discord: optionalTrimmed(),

    // Contenido
    medium: optionalUrl,
    devto: optionalUrl,
});


/* =========================================================
   Custom
========================================================= */

export const customItemSchema = z.object({
    id: z.string(),
    title: z.string().min(1, "El título es obligatorio"),
    subtitle: optionalTrimmedString(),
    description: optionalTrimmedString(),
    date: optionalYearOrMonth,
    url: optionalUrl,
});

export const customSectionSchema = z.object({
    title: z.string().min(1, "El título de la sección es obligatorio"),
    items: z.array(customItemSchema).max(20),
});

/* =========================================================
   Experience
========================================================= */

export const experienceItemSchema = z
    .object({
        id: z.string(),
        company: z.string().min(1, "La empresa es obligatoria"),
        role: z.string().min(1, "El rol es obligatorio"),
        startDate: monthYYYYMM,
        endDate: optionalMonthYYYYMM,
        description: z.string().optional(),
        items: z.array(z.string()).default([]),
    })
    .superRefine(endAfterStartRefine);

export const experienceSectionSchema = z
    .array(experienceItemSchema)
    .max(20, "Demasiadas experiencias");

/* =========================================================
   Education
========================================================= */

export const educationItemSchema = z
    .object({
        id: z.string(),
        institution: z.string().min(1, "La institución es obligatoria"),
        degree: z.string().min(1, "El título / carrera es obligatorio"),
        startDate: monthYYYYMM,
        endDate: optionalMonthYYYYMM,
        description: z.string().optional(),
    })
    .superRefine(endAfterStartRefine);

export const educationSectionSchema = z
    .array(educationItemSchema)
    .max(20, "Demasiadas entradas de educación");

/* =========================================================
   Skills
========================================================= */

export const SKILL_LEVELS = [
    "basic",
    "intermediate",
    "advanced",
    "expert",
] as const;

export const skillDataSchema = z.object({
    name: z.string().min(1, "El nombre del skill es obligatorio"),
    level: z.enum(SKILL_LEVELS).optional(),
});

export const skillsSectionSchema = z
    .array(skillDataSchema)
    .max(20, "Demasiados skills")
    .refine(
        (skills) =>
            new Set(skills.map((s) => s.name.trim().toLowerCase())).size ===
            skills.length,
        { message: "No se pueden repetir skills" }
    );

/* =========================================================
   Export agrupado
========================================================= */

export const cvSectionSchemas = {
    experience: experienceSectionSchema,
    education: educationSectionSchema,
    skills: skillsSectionSchema,
    languages: languagesSectionSchema,
    profile: profileSectionSchema,
    projects: projectsSectionSchema,
    custom: customSectionSchema,
} as const;

/* =========================================================
   Templates
========================================================= */

export const cvTemplateIdSchema = z
    .enum(["classic", "twoColumns", "compact", "modernSidebar", "timeline", "rightProfileAccent"])
    .catch("classic");

/* =========================================================
   Upsert Curriculum (ROOT: incluye birthDate fuera del JSON)
========================================================= */

export const upsertCurriculumSchema = z.object({
    title: z.string().min(1),
    summary: z.string().max(400, "El resumen no puede superar 400 caracteres").optional().default(""),
    content: cvContentSchema,
    styleConfig: cvStyleConfigSchema.nullable().optional(),
    templateId: cvTemplateIdSchema.optional().default("classic"),
    birthDate: optionalBirthDateSchema,
});


// Re-export útiles (por compatibilidad si ya los importabas desde cv.ts)
export {
    monthYYYYMM,
    optionalMonthYYYYMM,
    yearYYYY,
    yearOrMonth,
    optionalYearOrMonth,
};
