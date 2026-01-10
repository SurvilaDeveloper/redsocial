// src/app/api/cv/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";
import { Prisma } from "@prisma/client";
import { upsertCurriculumSchema } from "@/lib/zod/cv";
import { dateFromYYYYMMDD } from "@/lib/zod/dates";
import { z } from "zod";

interface ParamsAwaitable {
    params: Promise<{ id: string }>;
}

// GET → obtener CV por id
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

    return NextResponse.json({ cv });
}

// PUT → actualizar CV existente
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

    // ✅ Para update, permitimos parcial PERO incluyendo birthDate (y null para “borrar”)
    const updateSchema = upsertCurriculumSchema.partial().extend({
        birthDate: z.union([upsertCurriculumSchema.shape.birthDate, z.null()]).optional(),
        templateId: z.union([upsertCurriculumSchema.shape.templateId, z.null()]).optional(),
        styleConfig: z.union([upsertCurriculumSchema.shape.styleConfig, z.null()]).optional(),
    });

    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid data", issues: parsed.error.issues },
            { status: 400 }
        );
    }

    const existingCV = await prisma.curriculum.findFirst({
        where: { id: cvId, userId: Number(session.user.id) },
    });

    if (!existingCV) {
        return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    // Defaults: si no vienen, mantenemos lo existente
    const title = parsed.data.title ?? existingCV.title ?? "Mi CV";
    const summary = parsed.data.summary ?? existingCV.summary ?? "";
    const templateId = parsed.data.templateId ?? existingCV.templateId ?? "classic";

    /**
     * ✅ content:
     * Antes estabas reconstruyendo { sections: ... } y eso VOLABA content.meta.
     * Ahora:
     * - preservamos TODO lo que venga en content (incluyendo meta)
     * - y solo normalizamos sections (id/type/data)
     */
    const content: Prisma.InputJsonValue =
        parsed.data.content != null
            ? ({
                sections: parsed.data.content.sections.map((section) => ({
                    id: section.id,
                    type: section.type,
                    data: section.data ?? null,
                })),

                // ✅ NUEVO: guardar meta si viene, si no, preservar la existente
                meta:
                    (parsed.data.content as any)?.meta ??
                    ((existingCV.content as any)?.meta ?? {}),
            } as Prisma.InputJsonValue)
            : (existingCV.content as Prisma.InputJsonValue);


    /**
     * styleConfig:
     * - undefined => no tocar
     * - null      => borrar (DbNull)
     * - object    => guardar objeto
     */
    const styleConfig:
        | Prisma.InputJsonValue
        | Prisma.NullableJsonNullValueInput
        | undefined =
        parsed.data.styleConfig === undefined
            ? undefined
            : parsed.data.styleConfig === null
                ? Prisma.DbNull
                : (parsed.data.styleConfig as Prisma.InputJsonValue);

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

    console.log("BODY.content.meta:", body?.content?.meta);
    console.log("PARSED.content.meta:", (parsed.data.content as any)?.meta);


    const updatedCV = await prisma.curriculum.update({
        where: { id: existingCV.id },
        data: {
            title,
            summary,
            content,
            styleConfig,
            templateId,
            birthDate, // ✅ columna (NO JSON)
            updatedAt: new Date(),
        },
    });

    return NextResponse.json({ cv: updatedCV });
}

