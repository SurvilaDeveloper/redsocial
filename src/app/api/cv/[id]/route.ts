// src/app/api/cv/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";
import { Prisma } from "@prisma/client";
import { upsertCurriculumSchema } from "@/lib/zod/cv";
import { dateFromYYYYMMDD } from "@/lib/zod/dates";
import { z } from "zod";

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

        // ✅ importante para tu feature
        isPublic: Boolean(db.isPublic),

        createdAt: db.createdAt instanceof Date ? db.createdAt.toISOString() : String(db.createdAt),
        updatedAt: db.updatedAt instanceof Date ? db.updatedAt.toISOString() : String(db.updatedAt),
    };
}

interface ParamsAwaitable {
    params: Promise<{ id: string }>;
}

/* ===========================
   GET → obtener CV por id (owner)
=========================== */

export async function GET(_req: NextRequest, { params }: ParamsAwaitable) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cvId = Number(id);
    if (Number.isNaN(cvId)) {
        return NextResponse.json({ error: "Invalid CV ID" }, { status: 400 });
    }

    const cv = await prisma.curriculum.findFirst({
        where: { id: cvId, userId: Number(session.user.id) },
    });

    if (!cv) {
        return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    return NextResponse.json({ cv: serializeCurriculum(cv) });
}

/* ===========================
   PUT → actualizar CV existente (owner)
=========================== */

export async function PUT(req: NextRequest, { params }: ParamsAwaitable) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cvId = Number(id);
    if (Number.isNaN(cvId)) {
        return NextResponse.json({ error: "Invalid CV ID" }, { status: 400 });
    }

    const body = await req.json();

    /**
     * ✅ Update parcial:
     * - permitimos birthDate null (borrar)
     * - styleConfig null (DbNull)
     * - templateId null (borrar / fallback)
     * - isPublic boolean (tu nuevo botón)
     *
     * Nota: content lo dejamos como viene del schema, pero el armado final abajo
     * tolera meta/sections ausentes (para no explotar si mandás solo meta).
     */
    const updateSchema = upsertCurriculumSchema.partial().extend({
        birthDate: z.union([upsertCurriculumSchema.shape.birthDate, z.null()]).optional(),
        templateId: z.union([upsertCurriculumSchema.shape.templateId, z.null()]).optional(),
        styleConfig: z.union([upsertCurriculumSchema.shape.styleConfig, z.null()]).optional(),

        // ✅ NUEVO
        isPublic: z.boolean().optional(),
    });

    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
    }

    const existingCV = await prisma.curriculum.findFirst({
        where: { id: cvId, userId: Number(session.user.id) },
    });

    if (!existingCV) {
        return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const title = parsed.data.title ?? existingCV.title ?? "Mi CV";
    const summary = parsed.data.summary ?? existingCV.summary ?? "";

    // ✅ templateId: preferimos styleConfig.template si viene, sino templateId, sino existing
    const incomingTemplateFromStyle =
        parsed.data.styleConfig && typeof parsed.data.styleConfig === "object"
            ? (parsed.data.styleConfig as any)?.template
            : undefined;

    const templateId =
        (typeof incomingTemplateFromStyle === "string" && incomingTemplateFromStyle.trim().length
            ? incomingTemplateFromStyle
            : undefined) ??
        (parsed.data.templateId ?? existingCV.templateId ?? "classic");

    const prevHeader = normalizeHeaderImageMeta((existingCV.content as any)?.meta?.headerImage);
    const nextHeaderRaw = (parsed.data.content as any)?.meta?.headerImage;

    const nextHeader =
        nextHeaderRaw && typeof nextHeaderRaw === "object"
            ? {
                url: (nextHeaderRaw as any).url !== undefined ? ((nextHeaderRaw as any).url ?? null) : prevHeader.url,
                publicId:
                    (nextHeaderRaw as any).publicId !== undefined
                        ? ((nextHeaderRaw as any).publicId ?? null)
                        : prevHeader.publicId,
                show: (nextHeaderRaw as any).show !== undefined ? Boolean((nextHeaderRaw as any).show) : prevHeader.show,
            }
            : prevHeader;

    const content: Prisma.InputJsonValue =
        parsed.data.content != null
            ? ({
                sections: Array.isArray((parsed.data.content as any)?.sections)
                    ? (parsed.data.content as any).sections.map((section: any) => ({
                        id: section.id,
                        type: section.type,
                        data: section.data ?? null,
                    }))
                    : Array.isArray((existingCV.content as any)?.sections)
                        ? (existingCV.content as any).sections
                        : [],
                meta: {
                    ...(((existingCV.content as any)?.meta ?? {}) as any),
                    ...(((parsed.data.content as any)?.meta ?? {}) as any),
                    headerImage: nextHeader, // ✅ merge seguro sin perder url/publicId
                },
            } as Prisma.InputJsonValue)
            : (existingCV.content as Prisma.InputJsonValue);


    /**
     * styleConfig:
     * - undefined => no tocar
     * - null      => borrar (DbNull)
     * - object    => guardar objeto (normalizando theme.color)
     */
    const styleConfig: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined =
        parsed.data.styleConfig === undefined
            ? undefined
            : parsed.data.styleConfig === null
                ? Prisma.DbNull
                : (normalizeStyleConfig(parsed.data.styleConfig) as unknown as Prisma.InputJsonValue);

    /**
     * ✅ birthDate:
     * - undefined => no tocar
     * - null      => limpiar
     * - "YYYY-MM-DD" => Date (UTC-safe)
     */
    const birthDate =
        parsed.data.birthDate === undefined
            ? undefined
            : parsed.data.birthDate === null
                ? null
                : parsed.data.birthDate
                    ? dateFromYYYYMMDD(parsed.data.birthDate)
                    : null;

    // ✅ NUEVO: isPublic
    const isPublic = parsed.data.isPublic === undefined ? undefined : Boolean(parsed.data.isPublic);

    const updatedCV = await prisma.curriculum.update({
        where: { id: existingCV.id },
        data: {
            title,
            summary,
            content,
            styleConfig,
            templateId,
            birthDate,
            // ✅ persiste tu toggle
            ...(isPublic === undefined ? {} : { isPublic }),

            updatedAt: new Date(),
        },
    });

    return NextResponse.json({ cv: serializeCurriculum(updatedCV) });
}

/* ===========================
   DELETE → borrar CV por id (owner)
=========================== */

export async function DELETE(_req: NextRequest, { params }: ParamsAwaitable) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cvId = Number(id);
    if (Number.isNaN(cvId)) {
        return NextResponse.json({ error: "Invalid CV ID" }, { status: 400 });
    }

    const owned = await prisma.curriculum.findFirst({
        where: { id: cvId, userId: Number(session.user.id) },
        select: { id: true },
    });

    if (!owned) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
        // ✅ queda en biblioteca global (curriculumId = null)
        await tx.curriculumMedia.updateMany({
            where: { curriculumId: cvId, userId: Number(session.user.id) },
            data: { curriculumId: null },
        });

        await tx.curriculum.delete({ where: { id: cvId } });
    });

    return NextResponse.json({ ok: true });
}


