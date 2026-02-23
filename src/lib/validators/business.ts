// src/lib/validators/business.ts
import { z } from "zod";
import { isReservedBusinessPageSlug, normalizeSlug } from "@/lib/slug";

const idSchema = z.string().min(1).max(80);

/* ──────────────────────────────────────
 * Sections
 * ────────────────────────────────────── */

export const BusinessHeroSectionSchema = z.object({
    id: idSchema,
    kind: z.literal("hero"),
    data: z.object({
        title: z.string().trim().min(1).max(120),
        subtitle: z.string().trim().max(200).optional(),
        align: z.enum(["left", "center"]).optional(),
    }),
});

export const BusinessTextSectionSchema = z.object({
    id: idSchema,
    kind: z.literal("text"),
    data: z.object({
        title: z.string().trim().max(120).optional(),
        body: z.string().trim().min(1).max(4000),
    }),
});

export const BusinessFeaturesSectionSchema = z.object({
    id: idSchema,
    kind: z.literal("features"),
    data: z.object({
        title: z.string().trim().max(120).optional(),
        columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
        items: z
            .array(
                z.object({
                    title: z.string().trim().min(1).max(80),
                    text: z.string().trim().max(200).optional(),
                    icon: z.string().trim().max(60).optional(),
                })
            )
            .min(1)
            .max(12),
    }),
});

export const BusinessGallerySectionSchema = z.object({
    id: idSchema,
    kind: z.literal("gallery"),
    data: z.object({
        title: z.string().trim().max(120).optional(),
        columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
        swiper: z.enum(["true", "false"]).optional(),
        images: z
            .array(
                z.object({
                    mediaId: z.number().int().positive(),
                    alt: z.string().trim().max(120).optional(),
                })
            )
            .max(12),
        width: z.enum(["25%", "33%", "50%", "66%", "75%", "83%", "100%"]).optional(),
        minWidth: z.enum(["320px", "384px", "512px", "640px", "768px", "1024px"]).optional(),
    }),
});

export const BusinessProductiveSectionSchema = z.object({
    id: idSchema,
    kind: z.literal("productive"),
    data: z.object({
        title: z.string().trim().max(120).optional(),
        type: z.enum(["product", "service"]),
        items: z
            .array(
                z.object({
                    title: z.string().trim().min(1).max(100),
                    listingId: z.number().int().positive(),
                    text: z.string().trim().max(300).optional(),
                })
            )
            .max(24)
            .default([]),
    }),
});

export const BusinessCTASectionSchema = z.object({
    id: idSchema,
    kind: z.literal("cta"),
    data: z.object({
        title: z.string().trim().min(1).max(120),
        text: z.string().trim().max(300).optional(),
        buttonText: z.string().trim().max(40).optional(),
        href: z.string().trim().max(2048).optional(),
    }),
});

/**
 * ✅ NUEVO: Contact Form section
 * - No envía emails desde acá (eso es endpoint).
 * - Solo define el contenido “decorativo” arriba del form.
 */
export const BusinessContactFormSectionSchema = z.object({
    id: idSchema,
    kind: z.literal("contactForm"),
    data: z.object({
        title: z.string().trim().max(120).optional(),
        description: z.string().trim().max(600).optional(),
    }),
});

export const BusinessSectionSchema = z.discriminatedUnion("kind", [
    BusinessHeroSectionSchema,
    BusinessTextSectionSchema,
    BusinessFeaturesSectionSchema,
    BusinessProductiveSectionSchema,
    BusinessGallerySectionSchema,
    BusinessCTASectionSchema,
    BusinessContactFormSectionSchema,
]);

export const BusinessPageContentSchema = z.array(BusinessSectionSchema).max(50);

/* ──────────────────────────────────────
 * NAV
 * ────────────────────────────────────── */

/**
 * Regla nueva:
 * - nav solo admite: home y page
 * - tab se navega siempre por slug
 * - contacto es una page más (slug: "contacto")
 */
export const BusinessNavItemSchema = z.discriminatedUnion("kind", [
    z.object({
        kind: z.literal("home"),
        slug: z.literal("home").optional().default("home"),
        title: z.string().trim().max(40),
        order: z.number().int().nonnegative(),
        visible: z.boolean(),
    }),
    z.object({
        kind: z.literal("page"),
        slug: z
            .string()
            .transform((s) => normalizeSlug(s))
            .refine((s) => !!s && !isReservedBusinessPageSlug(s), "Invalid page slug"),
        title: z.string().trim().max(40),
        order: z.number().int().nonnegative(),
        visible: z.boolean(),
    }),
]);

export const BusinessNavSchema = z.array(BusinessNavItemSchema).max(20);