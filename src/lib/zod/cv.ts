// src/lib/zod/cv.ts
import { z } from "zod";
import { COMMON_LANGUAGES } from "@/types/cv";
import { LANGUAGE_LABELS } from "@/types/cvLanguages";
import { CV_TEMPLATES } from "@/types/cv";

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

const optionalTrimmedString = () => z.preprocess(trim, z.string().min(1).optional());

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
   Templates (lo subo antes para reusarlo en styleConfig)
========================================================= */

export const cvTemplateIdSchema = z.enum(CV_TEMPLATES).catch("classic");



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
    .passthrough()
    .optional();

export const cvContentSchema = z.object({
    // ✅ para permitir updates parciales (meta-only) sin romper Zod
    sections: z
        .array(
            z
                .object({
                    id: z.string(),
                    type: sectionTypeSchema,
                })
                .passthrough()
        )
        .optional(),

    meta: z
        .object({
            headerImage: headerImageSchema,
        })
        .passthrough()
        .optional(),
});

// content ESTRICTO para CREATE
export const cvContentCreateSchema = z.object({
    sections: z.array(
        z
            .object({
                id: z.string(),
                type: sectionTypeSchema,
            })
            .passthrough()
    ),
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

const cvThemeColorSchema = z.enum(["slate", "blue", "green", "red", "violet", "amber"]).catch("slate");

export const cvStyleConfigSchema = z
    .object({
        showDocTitle: z.boolean().optional(),

        // ✅ alinear con templates válidos
        template: cvTemplateIdSchema.optional(),

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

        theme: z
            .object({
                color: cvThemeColorSchema.optional(),
            })
            .optional(),
    })
    .passthrough();

export const createCVSchema = z.object({
    title: z.string().min(1),
    summary: z.string().optional().default(""),
    content: cvContentCreateSchema, // 👈 OJO ACÁ
    styleConfig: cvStyleConfigSchema.optional(),
    birthDate: optionalBirthDateSchema.optional(),
    isPublic: z.boolean().optional(),
});


/* =========================================================
   Languages
========================================================= */

const normalizeLangKey = (v: unknown) => {
    if (typeof v !== "string") return "";
    return v
        .trim()
        .toLowerCase()
        .normalize("NFD") // separa letras de diacríticos
        .replace(/[\u0300-\u036f]/g, "") // elimina diacríticos (tildes, etc)
        .replace(/\s+/g, " "); // colapsa espacios
};

// Aliases comunes ES/EN (normalizados)
// OJO: Las keys se normalizan con normalizeLangKey, así que acá podés escribir con o sin tildes.
const LANGUAGE_ALIASES: Record<string, string> = {
    // Spanish
    "espanol": "spanish",
    "español": "spanish",
    "spanish": "spanish",

    // English
    "ingles": "english",
    "inglés": "english",
    "english": "english",

    // Portuguese
    "portugues": "portuguese",
    "português": "portuguese",
    "portuguese": "portuguese",

    // French
    "frances": "french",
    "francés": "french",
    "french": "french",
    "francais": "french",
    "français": "french",

    // German
    "aleman": "german",
    "alemán": "german",
    "german": "german",
    "deutsch": "german",

    // Italian
    "italiano": "italian",
    "italian": "italian",
};


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
    .superRefine((langs, ctx) => {
        const seen = new Map<string, number>();

        // label normalizado → code  (ej: "ingles" -> "english")
        const labelToCode = new Map<string, string>(
            Object.entries(LANGUAGE_LABELS).map(([code, label]) => [
                normalizeLangKey(label),
                code,
            ])
        );

        // alias normalizado → code (ej: "english" -> "english", "ingles" -> "english")
        const aliasToCode = new Map<string, string>(
            Object.entries(LANGUAGE_ALIASES).map(([alias, code]) => [
                normalizeLangKey(alias),
                code,
            ])
        );

        const mapNameToCommonCode = (nameRaw: unknown): string | undefined => {
            const name = normalizeLangKey(nameRaw);
            if (!name) return undefined;

            // 1) match contra labels (lo que se ve en el Select)
            const byLabel = labelToCode.get(name);
            if (byLabel) return byLabel;

            // 2) match contra aliases (english/ingles/inglés, etc)
            const byAlias = aliasToCode.get(name);
            if (byAlias) return byAlias;

            return undefined;
        };

        // Clave de unicidad:
        // - Si code !== "other" → único por code
        // - Si code === "other" →
        //    - si el name mapea a un idioma común → lo tratamos como ese code (choca con el select)
        //    - si no, único por other:<nameNormalizado>
        const uniqueKeyFor = (lang: any) => {
            const code = lang?.code ?? "other";

            if (code !== "other") return `code:${code}`;

            const mapped = mapNameToCommonCode(lang?.name);
            if (mapped) return `code:${mapped}`;

            return `other:${normalizeLangKey(lang?.name)}`;
        };

        for (let i = 0; i < langs.length; i++) {
            const key = uniqueKeyFor(langs[i]);

            const firstIndex = seen.get(key);
            if (firstIndex === undefined) {
                seen.set(key, i);
                continue;
            }

            // ✅ error “apuntado” al ÚLTIMO duplicado (i), debajo del Select "Idioma"
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [i, "code"],
                message: "No se pueden repetir idiomas",
            });
        }
    });



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
    .superRefine((projects, ctx) => {
        const seen = new Map<string, number>();

        for (let i = 0; i < projects.length; i++) {
            const raw = projects[i]?.name ?? "";
            const normalized = raw.trim().toLowerCase();

            // si está vacío, que lo maneje el .min(1) del projectDataSchema
            if (!normalized) continue;

            const firstIndex = seen.get(normalized);
            if (firstIndex === undefined) {
                seen.set(normalized, i);
                continue;
            }

            // ✅ error apuntado al ÚLTIMO duplicado (i)
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [i, "name"],
                message: "No se pueden repetir nombres de proyectos",
            });
        }
    });

/* =========================================================
   Profile
========================================================= */

// No trimmea. Solo convierte "" o "   " => undefined.
// Mantiene espacios internos y también el espacio final si el usuario lo dejó.
const optionalSoftString = () =>
    z.preprocess((v) => {
        if (typeof v !== "string") return undefined;
        return v.length === 0 || v.replace(/\s/g, "").length === 0 ? undefined : v;
    }, z.string().optional());


const optionalTrimmed = () => z.preprocess(trim, z.string().optional());
// ya lo tenías

const optionalSoft = () => optionalSoftString();

const genderSchema = z.enum(["male", "female", "other", "prefer_not_to_say"]);
const maritalStatusSchema = z.enum(["single", "married", "divorced", "widowed"]);

export const profileSectionSchema = z.object({
    // Identidad
    fullName: z.preprocess(trim, z.string().min(1, "El nombre es obligatorio")),
    headline: optionalSoft(),

    // Ubicación
    address: optionalSoft(),
    postalCode: optionalTrimmed(), // o optionalSoft si querés
    city: optionalSoft(),

    // Datos personales
    birthPlace: optionalSoft(),
    nationality: optionalSoft(),
    gender: genderSchema.optional(),
    maritalStatus: maritalStatusSchema.optional(),
    drivingLicense: optionalSoft(),

    // Visibilidad
    showBirthDate: z.boolean().optional(),
    showAddress: z.boolean().optional(),
    showGender: z.boolean().optional(),

    // Contacto
    email: optionalEmail,      // hard (trim + valida email)
    phone: optionalSoft(),     // ✅ soft
    website: optionalUrl,      // hard

    // Profesional
    linkedin: optionalUrl,
    github: optionalUrl,

    // Redes
    facebook: optionalUrl,
    instagram: optionalUrl,
    youtube: optionalUrl,
    x: optionalUrl,
    discord: optionalSoft(),   // ✅ soft

    // Contenido
    medium: optionalUrl,
    devto: optionalUrl,
});



/* =========================================================
   Custom
========================================================= */

export const customItemSchema = z.object({
    id: z.string(),
    title: z.preprocess(
        (v) => (typeof v === "string" ? v.trim() : v),
        z.string().min(1, "El título es obligatorio")
    ),
    subtitle: optionalTrimmedString(),
    description: optionalTrimmedString(),
    date: optionalYearOrMonth,
    url: optionalUrl,
});


export const customSectionSchema = z
    .object({
        title: z.string().min(1, "El título de la sección es obligatorio"),
        items: z.array(customItemSchema).max(20),
    })
    .superRefine((val, ctx) => {
        // ✅ No duplicar items por title (error en el ÚLTIMO duplicado)
        const seen = new Map<string, number>();

        for (let i = 0; i < (val.items?.length ?? 0); i++) {
            const rawTitle = val.items[i]?.title ?? "";
            const key = rawTitle.trim().toLowerCase();

            // si está vacío, ya lo maneja customItemSchema.min(1), no metemos ruido acá
            if (!key) continue;

            const firstIndex = seen.get(key);
            if (firstIndex === undefined) {
                seen.set(key, i);
                continue;
            }

            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["items", i, "title"], // 👈 cae debajo del Input Título del item duplicado
                message: "No se pueden repetir items con el mismo título",
            });
        }
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
        items: z
            .array(z.string())
            .max(10, "Máximo 10 items por experiencia")
            .default([]),

    })
    .superRefine(endAfterStartRefine);

export const experienceSectionSchema = z
    .array(experienceItemSchema)
    .max(10, "Demasiadas experiencias");

/* =========================================================
   Education
========================================================= */

export const educationItemSchema = z
    .object({
        id: z.string(),
        institution: z.string().min(1, "La institución es obligatoria"),
        degree: z.string().min(1, "El título / carrera es obligatorio"),
        startDate: yearOrMonth,
        endDate: optionalYearOrMonth,
        description: z.string().optional(),
    })
    .superRefine(endAfterStartRefine);

export const educationSectionSchema = z
    .array(educationItemSchema)
    .max(10, "Demasiadas entradas de educación");

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
    name: z.preprocess(
        (v) => (typeof v === "string" ? v.trim() : v),
        z.string().min(1, "El nombre del skill es obligatorio")
    ),
    level: z.enum(SKILL_LEVELS).optional(),
});


// cv.ts (skills)

export const skillsSectionSchema = z
    .array(skillDataSchema)
    .max(30, "Demasiados skills")
    .superRefine((skills, ctx) => {
        const seen = new Map<string, number>(); // key -> first index

        for (let i = 0; i < skills.length; i++) {
            const raw = skills[i]?.name ?? "";
            const key = raw.trim().toLowerCase(); // normalización

            if (!key) continue; // el min(1) del name ya se encarga del vacío

            const first = seen.get(key);

            if (first === undefined) {
                seen.set(key, i);
                continue;
            }

            // ✅ marcamos SOLO el último (el que se repite), no el primero
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [i, "name"],
                message: "No se puede repetir skills",
            });
        }
    });


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
   Upsert Curriculum (ROOT: incluye birthDate fuera del JSON)
========================================================= */

export const upsertCurriculumSchema = z.object({
    title: z.string().min(1),
    summary: z.string().max(400, "El resumen no puede superar 400 caracteres").optional().default(""),
    content: cvContentSchema,
    styleConfig: cvStyleConfigSchema.nullable().optional(),
    templateId: cvTemplateIdSchema.optional().default("classic"),
    birthDate: optionalBirthDateSchema,

    // ✅ ya lo tenías, perfecto
    isPublic: z.boolean().optional(),
});



// Re-export útiles (por compatibilidad si ya los importabas desde cv.ts)
export {
    monthYYYYMM,
    optionalMonthYYYYMM,
    yearYYYY,
    yearOrMonth,
    optionalYearOrMonth,
};
