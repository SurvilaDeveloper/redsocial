// src/app/api/users/[userId]/cv/view/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

import type { Curriculum, CVStyleConfig, HeaderImageMeta, CVContent } from "@/types/cv";
import { coerceThemeColor } from "@/types/cv";

interface ParamsAwaitable {
    params: Promise<{ userId: string }>;
}

/* =========================
   Helpers
========================= */

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeHeaderImageMeta(input: unknown): HeaderImageMeta {
    const obj = isPlainObject(input) ? (input as any) : {};
    const url = typeof obj.url === "string" && obj.url.trim().length ? obj.url.trim() : null;
    const publicId =
        typeof obj.publicId === "string" && obj.publicId.trim().length ? obj.publicId.trim() : null;
    const show = Boolean(obj.show ?? false);
    return { url, publicId, show };
}

function normalizeContent(input: unknown): CVContent {
    const obj = isPlainObject(input) ? (input as any) : {};
    const sections = Array.isArray(obj.sections) ? obj.sections : [];

    // preservamos meta completo y solo normalizamos headerImage
    const metaObj = isPlainObject(obj.meta) ? (obj.meta as any) : {};
    const headerImage = normalizeHeaderImageMeta(metaObj.headerImage);

    return {
        ...obj,
        sections,
        meta: {
            ...metaObj,
            headerImage,
        },
    } as CVContent;
}

// Normalización mínima para mantener compatibilidad (especialmente theme.color)
function normalizeStyleConfig(input: unknown): CVStyleConfig | null {
    if (!isPlainObject(input)) return null;

    const obj = input as any;
    const theme = isPlainObject(obj.theme) ? obj.theme : {};

    return {
        ...obj,
        theme: {
            ...theme,
            color: coerceThemeColor(theme?.color),
        },
    } as CVStyleConfig;
}

/* =========================
   GET
========================= */

export async function GET(_req: Request, { params }: ParamsAwaitable) {
    const { userId } = await params;
    const uid = Number(userId);

    if (Number.isNaN(uid)) {
        return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const cv = await prisma.curriculum.findUnique({
        where: { userId: uid },
        select: {
            id: true,
            userId: true,
            title: true,
            summary: true,
            content: true,
            styleConfig: true,
            isPublic: true,
            birthDate: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!cv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const session = await auth();
    const viewerId = session?.user?.id ? Number(session.user.id) : null;

    const canView = cv.isPublic || (viewerId !== null && viewerId === cv.userId);
    if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const normalized: Curriculum = {
        id: cv.id,
        userId: cv.userId,
        title: cv.title ?? "",
        summary: cv.summary ?? "",
        isPublic: Boolean(cv.isPublic),

        // DateTime -> string
        createdAt: cv.createdAt.toISOString(),
        updatedAt: cv.updatedAt.toISOString(),

        // Date -> "YYYY-MM-DD" o null
        birthDate: cv.birthDate ? cv.birthDate.toISOString().slice(0, 10) : null,

        // Json -> CVContent (normalizado)
        content: normalizeContent(cv.content),

        // Json -> CVStyleConfig | null (normalización mínima)
        styleConfig: normalizeStyleConfig(cv.styleConfig),
    };

    return NextResponse.json({ cv: normalized });
}



