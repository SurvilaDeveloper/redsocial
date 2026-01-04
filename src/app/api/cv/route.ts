// src/app/api/cv/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";
import { createCVSchema } from "@/lib/zod/cv";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const existing = await prisma.curriculum.findUnique({
        where: { userId: Number(session.user.id) },
    });

    if (existing) {
        return NextResponse.json(
            { error: "CV already exists" },
            { status: 409 }
        );
    }


    const body = await req.json();

    const parsed = createCVSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {
                error: "Invalid data",
                issues: parsed.error.issues,
            },
            { status: 400 }
        );
    }

    /**
     * Prisma necesita JSON puro
     */
    const content: Prisma.InputJsonValue = {
        sections: parsed.data.content.sections.map((section) => ({
            id: section.id,
            type: section.type,
            data: section.data ?? null,
        })),
    };

    const cv = await prisma.curriculum.create({
        data: {
            userId: Number(session.user.id),
            title: parsed.data.title,
            summary: parsed.data.summary ?? "",
            content,
            isPublic: false,
        },
    });

    return NextResponse.json({ cv }, { status: 201 });
}


