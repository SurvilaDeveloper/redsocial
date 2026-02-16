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

import { extractCvKeywordItems } from "@/lib/productive/extract-cv-keywords";
import { recomputeProductiveProfileTx } from "@/lib/productive/recompute-productive-profile";

export const runtime = "nodejs";

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

    const sections = Array.isArray(raw?.sections) ? raw.sections : Array.isArray(fb?.sections) ? fb.sections : [];

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

interface ParamsAwaitable {
    params: Promise<{ id: string }>;
}

/* ===========================
   GET → obtener CV por id (owner)
=========================== */

export async function GET(_req: NextRequest, { params }: ParamsAwaitable) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = Number(session.user.id);
        const cvId = Number(id);

        if (Number.isNaN(cvId)) return NextResponse.json({ error: "Invalid CV ID" }, { status: 400 });

        const cv = await prisma.curriculum.findFirst({ where: { id: cvId, userId } });

        if (!cv) return NextResponse.json({ error: "CV not found" }, { status: 404 });

        return NextResponse.json({ cv: serializeCurriculum(cv) });
    } catch (err) {
        console.error("CV GET error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

/* ===========================
   PUT → actualizar CV existente (owner)
   + ✅ recompute Productive Profile 100%
=========================== */

export async function PUT(req: NextRequest, { params }: ParamsAwaitable) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = Number(session.user.id);
        const cvId = Number(id);

        if (Number.isNaN(cvId)) return NextResponse.json({ error: "Invalid CV ID" }, { status: 400 });

        const body = await req.json();

        const updateSchema = upsertCurriculumSchema.partial().extend({
            birthDate: z.union([upsertCurriculumSchema.shape.birthDate, z.null()]).optional(),
            templateId: z.union([upsertCurriculumSchema.shape.templateId, z.null()]).optional(),
            styleConfig: z.union([upsertCurriculumSchema.shape.styleConfig, z.null()]).optional(),
            isPublic: z.boolean().optional(),
        });

        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
        }

        const existingCV = await prisma.curriculum.findFirst({ where: { id: cvId, userId } });
        if (!existingCV) return NextResponse.json({ error: "CV not found" }, { status: 404 });

        const title = parsed.data.title ?? existingCV.title ?? "Mi CV";
        const summary = parsed.data.summary ?? existingCV.summary ?? "";

        // templateId: preferimos styleConfig.template si viene, sino templateId, sino existing
        const incomingTemplateFromStyle =
            parsed.data.styleConfig && typeof parsed.data.styleConfig === "object" ? (parsed.data.styleConfig as any)?.template : undefined;

        const templateId =
            (typeof incomingTemplateFromStyle === "string" && incomingTemplateFromStyle.trim().length ? incomingTemplateFromStyle : undefined) ??
            (parsed.data.templateId ?? existingCV.templateId ?? "classic");

        // merge seguro de headerImage (no pisa url/publicId si mandás solo show)
        const prevHeader = normalizeHeaderImageMeta((existingCV.content as any)?.meta?.headerImage);
        const nextHeaderRaw = (parsed.data.content as any)?.meta?.headerImage;

        const nextHeader =
            nextHeaderRaw && typeof nextHeaderRaw === "object"
                ? {
                    url: (nextHeaderRaw as any).url !== undefined ? ((nextHeaderRaw as any).url ?? null) : prevHeader.url,
                    publicId:
                        (nextHeaderRaw as any).publicId !== undefined ? ((nextHeaderRaw as any).publicId ?? null) : prevHeader.publicId,
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
                        headerImage: nextHeader,
                    },
                } as Prisma.InputJsonValue)
                : (existingCV.content as Prisma.InputJsonValue);

        // DEBUG
        function preview(v: unknown, maxLen = 80) {
            if (v == null) return v;
            if (typeof v === "string") {
                const s = v.replace(/\s+/g, " ").trim();
                return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
            }
            if (typeof v === "number" || typeof v === "boolean") return v;
            if (Array.isArray(v)) return `[Array(${v.length})]`;
            if (typeof v === "object") return "[Object]";
            return String(v);
        }

        function typeOf(v: unknown) {
            if (v === null) return "null";
            if (Array.isArray(v)) return "array";
            return typeof v;
        }

        function objectShape(obj: any, keysLimit = 30) {
            if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
            const keys = Object.keys(obj).slice(0, keysLimit);
            const shape: Record<string, any> = {};
            for (const k of keys) shape[k] = { t: typeOf(obj[k]), p: preview(obj[k]) };
            const more = Object.keys(obj).length - keys.length;
            return { keys, moreKeys: more > 0 ? more : 0, shape };
        }

        function arrayShape(arr: any[], itemsLimit = 5, keysLimit = 20) {
            const sample = arr.slice(0, itemsLimit).map((it) => {
                if (it == null) return { t: "null", p: null };
                if (typeof it === "string") return { t: "string", p: preview(it) };
                if (typeof it === "number" || typeof it === "boolean") return { t: typeof it, p: it };
                if (Array.isArray(it)) return { t: "array", len: it.length, p: `[Array(${it.length})]` };
                if (typeof it === "object") {
                    const keys = Object.keys(it).slice(0, keysLimit);
                    const types: Record<string, string> = {};
                    for (const k of keys) types[k] = typeOf((it as any)[k]);
                    const more = Object.keys(it).length - keys.length;
                    return { t: "object", keys, moreKeys: more > 0 ? more : 0, keyTypes: types };
                }
                return { t: typeof it, p: preview(it) };
            });

            return { len: arr.length, sample };
        }

        function inspectSection(sec: any) {
            const data = sec?.data;

            const base: any = {
                id: sec?.id,
                type: sec?.type,
                dataType: typeOf(data),
            };

            if (Array.isArray(data)) {
                base.data = arrayShape(data, 6, 25);
                return base;
            }

            if (data && typeof data === "object") {
                base.data = objectShape(data, 40);

                // ✅ extra foco para custom
                if (sec?.type === "custom") {
                    const title = (data as any)?.title;
                    const items = (data as any)?.items;

                    base.custom = {
                        title: { t: typeOf(title), p: preview(title, 140) },
                        itemsType: typeOf(items),
                        itemsPreview: Array.isArray(items)
                            ? arrayShape(items, 10, 25)
                            : items && typeof items === "object"
                                ? objectShape(items, 40)
                                : preview(items, 140),
                    };
                }

                return base;
            }

            // primitive
            base.data = preview(data, 140);
            return base;
        }

        // USO:
        /*
        console.dir(
            {
                sectionsCount: Array.isArray((content as any)?.sections) ? (content as any).sections.length : 0,
                metaKeys:
                    (content as any)?.meta && typeof (content as any).meta === "object"
                        ? Object.keys((content as any).meta)
                        : [],
                sections: Array.isArray((content as any)?.sections)
                    ? (content as any).sections.map(inspectSection)
                    : [],
            },
            { depth: null }
        );
            */

        // styleConfig: undefined=no tocar | null=borrar(DbNull) | object=guardar normalizado
        const styleConfig: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined =
            parsed.data.styleConfig === undefined
                ? undefined
                : parsed.data.styleConfig === null
                    ? Prisma.DbNull
                    : (normalizeStyleConfig(parsed.data.styleConfig) as unknown as Prisma.InputJsonValue);

        // birthDate: undefined=no tocar | null=limpiar | "YYYY-MM-DD"=Date
        const birthDate =
            parsed.data.birthDate === undefined ? undefined : parsed.data.birthDate === null ? null : parsed.data.birthDate ? dateFromYYYYMMDD(parsed.data.birthDate) : null;

        const isPublic = parsed.data.isPublic === undefined ? undefined : Boolean(parsed.data.isPublic);

        const updatedCV = await prisma.$transaction(async (tx) => {
            // 1) update CV
            const cv = await tx.curriculum.update({
                where: { id: existingCV.id },
                data: {
                    title,
                    summary,
                    content,
                    styleConfig,
                    templateId,
                    birthDate,
                    ...(isPublic === undefined ? {} : { isPublic }),
                    updatedAt: new Date(),
                },
            });

            // 2) keywords desde el CV actualizado (fuente: cv)
            const normalized = normalizeContent(cv.content);
            const keywords = extractCvKeywordItems(normalized);

            // 3) Persistimos keywords source=cv (blindado: no dependemos del nombre del where compuesto)
            await tx.userProductiveKeywords.deleteMany({ where: { userId, source: "cv" } });

            await tx.userProductiveKeywords.create({
                data: {
                    userId,
                    source: "cv",
                    keywords: keywords as unknown as Prisma.InputJsonValue,
                    version: 1,
                },
            });

            // 4) evento crudo
            await tx.userProductiveEvent.create({
                data: {
                    userId,
                    type: "cv_save",
                    weight: 1,
                    meta: {
                        cvId: cv.id,
                        kwCount: Array.isArray(keywords) ? keywords.length : 0,
                    } as any,
                },
            });

            // 5) ✅ recompute 100% del profile productivo (desde todas las sources)
            await recomputeProductiveProfileTx(tx, userId);

            return cv;
        });

        return NextResponse.json({ cv: serializeCurriculum(updatedCV) });
    } catch (err) {
        console.error("CV PUT error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

/* ===========================
   DELETE → borrar CV por id (owner)
   + ✅ limpia keywords cv + recompute Productive Profile
=========================== */

export async function DELETE(_req: NextRequest, { params }: ParamsAwaitable) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = Number(session.user.id);
        const cvId = Number(id);

        if (Number.isNaN(cvId)) return NextResponse.json({ error: "Invalid CV ID" }, { status: 400 });

        const owned = await prisma.curriculum.findFirst({ where: { id: cvId, userId }, select: { id: true } });
        if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await prisma.$transaction(async (tx) => {
            // queda en biblioteca global (curriculumId = null)
            await tx.curriculumMedia.updateMany({
                where: { curriculumId: cvId, userId },
                data: { curriculumId: null },
            });

            await tx.curriculum.delete({ where: { id: cvId } });

            // si borrás CV, borrá keywords source=cv
            await tx.userProductiveKeywords.deleteMany({ where: { userId, source: "cv" } });

            // recompute 100% después del delete
            await recomputeProductiveProfileTx(tx, userId);
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("CV DELETE error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
