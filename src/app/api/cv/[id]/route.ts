// src/app/api/cv/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

interface ParamsAwaitable {
    params: Promise<{ id: string }>;
}

// GET → obtener CV por id
export async function GET(_req: NextRequest, { params }: ParamsAwaitable) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cvId = Number(id);
    if (Number.isNaN(cvId)) return NextResponse.json({ error: "Invalid CV ID" }, { status: 400 });

    const cv = await prisma.curriculum.findFirst({
        where: { id: cvId, userId: Number(session.user.id) },
    });

    if (!cv) return NextResponse.json({ error: "CV not found" }, { status: 404 });

    return NextResponse.json({ cv });
}

// PUT → actualizar CV existente
export async function PUT(req: NextRequest, { params }: ParamsAwaitable) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cvId = Number(id);
    if (Number.isNaN(cvId)) return NextResponse.json({ error: "Invalid CV ID" }, { status: 400 });

    const body = await req.json();
    const { title, summary, content } = body;

    const existingCV = await prisma.curriculum.findFirst({
        where: { id: cvId, userId: Number(session.user.id) },
    });

    if (!existingCV) return NextResponse.json({ error: "CV not found" }, { status: 404 });

    const updatedCV = await prisma.curriculum.update({
        where: { id: existingCV.id },
        data: { title, summary, content, updatedAt: new Date() },
    });

    return NextResponse.json({ cv: updatedCV });
}

// POST → crear nuevo CV
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, summary, content } = body;

    const newCV = await prisma.curriculum.create({
        data: {
            userId: Number(session.user.id),
            title: title || "Mi CV",
            summary: summary || "",
            content: content || { sections: [] },
        },
    });

    return NextResponse.json({ cv: newCV });
}


