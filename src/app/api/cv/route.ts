// src/app/api/cv/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";
import { Prisma } from "@prisma/client";
import { upsertCurriculumSchema } from "@/lib/zod/cv";
import { dateFromYYYYMMDD } from "@/lib/zod/dates";

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.curriculum.findUnique({
        where: { userId: Number(session.user.id) },
    });

    if (existing) {
        return NextResponse.json({ error: "CV already exists" }, { status: 409 });
    }

    const body = await req.json();
    const parsed = upsertCurriculumSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid data", issues: parsed.error.issues },
            { status: 400 }
        );
    }

    /**
     * ✅ content:
     * Preservamos TODO lo que venga (meta/headerImage/etc)
     * y normalizamos sections para Prisma/consistencia.
     */
    const content: Prisma.InputJsonValue = {
        sections: parsed.data.content.sections.map((section) => ({
            id: section.id,
            type: section.type,
            data: section.data ?? null,
        })),

        // ✅ NUEVO: guardar meta si viene
        meta: (parsed.data.content as any)?.meta ?? {},
    };


    /**
     * styleConfig:
     * - undefined => DbNull (create)
     * - null      => DbNull
     * - object    => guardar objeto
     */
    const styleConfig: Prisma.InputJsonValue | Prisma.NullTypes.DbNull =
        parsed.data.styleConfig == null
            ? Prisma.DbNull
            : (parsed.data.styleConfig as Prisma.InputJsonValue);

    /**
     * ✅ templateId:
     * En Zod ya viene como "classic" por default o catch, pero por las dudas:
     */
    const templateId = parsed.data.templateId ?? "classic";

    /**
     * ✅ birthDate (root) -> columna Date/DateTime
     */
    const birthDate = parsed.data.birthDate
        ? dateFromYYYYMMDD(parsed.data.birthDate)
        : null;

    const cv = await prisma.curriculum.create({
        data: {
            userId: Number(session.user.id),
            title: parsed.data.title,
            summary: parsed.data.summary ?? "",
            content,
            styleConfig,
            templateId,
            birthDate,
            isPublic: false,
        },
    });

    return NextResponse.json({ cv }, { status: 201 });
}


