// src/app/api/cv/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";
import { Prisma } from "@prisma/client";
import { createCVSchema } from "@/lib/zod/cv"; // ✅ usar create schema
import { dateFromYYYYMMDD } from "@/lib/zod/dates";

import type { Curriculum, CVContent, CVStyleConfig, HeaderImageMeta } from "@/types/cv";
import { coerceThemeColor } from "@/types/cv";

/* ===========================
   Helpers (normalize/serialize)
=========================== */

function normalizeHeaderImageMeta(input: unknown): HeaderImageMeta {
    const obj = input && typeof input === "object" ? (input as any) : {};
    const url = typeof obj.url === "string" && obj.url.trim().length ? obj.url.trim() : null;
    const publicId = typeof obj.publicId === "string" && obj.publicId.trim().length ? obj.publicId.trim() : null;
    const show = Boolean(obj.show ?? false);
    return { url, publicId, show };
}

function normalizeContent(input: unknown, fallback?: unknown): CVContent {
    const raw = input && typeof input === "object" ? (input as any) : null;
    const fb = fallback && typeof fallback === "object" ? (fallback as any) : null;

    const sections = Array.isArray(raw?.sections)
        ? raw.sections
        : Array.isArray(fb?.sections)
            ? fb.sections
            : [];

    const metaRaw = raw?.meta && typeof raw.meta === "object" ? raw.meta : null;
    const metaFb = fb?.meta && typeof fb.meta === "object" ? fb.meta : null;

    const headerImage = normalizeHeaderImageMeta(metaRaw?.headerImage ?? metaFb?.headerImage);

    return {
        sections,
        meta: {
            ...(metaFb ?? {}),
            ...(metaRaw ?? {}),
            headerImage,
        },
    };
}

function normalizeStyleConfig(input: unknown): CVStyleConfig | null {
    if (!input || typeof input !== "object") return null;

    const obj = input as any;
    const theme = obj.theme ?? {};

    return {
        ...obj,
        theme: {
            ...theme,
            color: coerceThemeColor(theme?.color),
        },
    } as CVStyleConfig;
}

function toYYYYMMDD(d: Date) {
    return d.toISOString().slice(0, 10);
}

function serializeCurriculum(db: any): Curriculum {
    return {
        id: db.id,
        userId: db.userId,
        title: db.title ?? "",
        summary: db.summary ?? "",
        birthDate: db.birthDate ? toYYYYMMDD(db.birthDate) : null,

        content: normalizeContent(db.content),
        styleConfig: normalizeStyleConfig(db.styleConfig),

        isPublic: Boolean(db.isPublic),

        createdAt: db.createdAt instanceof Date ? db.createdAt.toISOString() : String(db.createdAt),
        updatedAt: db.updatedAt instanceof Date ? db.updatedAt.toISOString() : String(db.updatedAt),
    };
}

/* ===========================
   POST → crear CV (owner)
=========================== */

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ findFirst (a menos que userId sea @unique)
    const existing = await prisma.curriculum.findFirst({
        where: { userId: Number(session.user.id) },
        select: { id: true },
    });

    if (existing) {
        return NextResponse.json({ error: "CV already exists" }, { status: 409 });
    }

    const body = await req.json();

    // ✅ CREATE: exigir sections (evita undefined.map)
    const parsed = createCVSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
    }

    /**
     * ✅ content:
     * - normalizamos sections
     * - preservamos meta
     * - normalizamos meta.headerImage (consistencia)
     */
    const incomingContent = parsed.data.content as any;

    const content: Prisma.InputJsonValue = {
        sections: parsed.data.content.sections.map((section: any) => ({
            id: section.id,
            type: section.type,
            data: section.data ?? null,
        })),
        meta: {
            ...(incomingContent?.meta ?? {}),
            headerImage: normalizeHeaderImageMeta(incomingContent?.meta?.headerImage),
        },
    };

    /**
     * styleConfig:
     * - undefined => DbNull (create)
     * - object    => normalizamos theme.color y guardamos
     */
    const styleConfig: Prisma.InputJsonValue | Prisma.NullTypes.DbNull =
        parsed.data.styleConfig == null
            ? Prisma.DbNull
            : (normalizeStyleConfig(parsed.data.styleConfig) as unknown as Prisma.InputJsonValue);

    /**
     * ✅ templateId:
     * prioriza styleConfig.template si viene (si existiera),
     * pero en createCVSchema no lo mandamos; dejamos "classic" de fallback.
     */
    const incomingTemplateFromStyle =
        parsed.data.styleConfig && typeof parsed.data.styleConfig === "object"
            ? (parsed.data.styleConfig as any)?.template
            : undefined;

    const templateId =
        (typeof incomingTemplateFromStyle === "string" && incomingTemplateFromStyle.trim().length
            ? incomingTemplateFromStyle
            : undefined) ?? "classic";

    /**
     * ✅ birthDate:
     * createCVSchema no lo incluye (lo maneja el editor vía PUT después),
     * pero si querés soportarlo acá, lo podés agregar a createCVSchema.
     */
    const birthDate = (body?.birthDate ? dateFromYYYYMMDD(body.birthDate) : null) as Date | null;

    // ✅ isPublic: por defecto false (si lo mandás, lo respetamos)
    const isPublic = Boolean(body?.isPublic ?? false);

    const cv = await prisma.curriculum.create({
        data: {
            userId: Number(session.user.id),
            title: parsed.data.title,
            summary: parsed.data.summary ?? "",
            content,
            styleConfig,
            templateId,
            birthDate,
            isPublic,
        },
    });

    return NextResponse.json({ cv: serializeCurriculum(cv) }, { status: 201 });
}




