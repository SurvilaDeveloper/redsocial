//src/app/api/studio/business/[id]/active/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const businessId = Number(id);
    if (Number.isNaN(businessId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, ownerId: true, deletedAt: true, active: true },
    });

    if (!business || business.deletedAt != null) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (business.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const nextActive = (business.active ?? 0) === 1 ? 0 : 1;

    await prisma.business.update({
        where: { id: businessId },
        data: {
            active: nextActive,
            status: nextActive === 1 ? "active" : "draft",
        },
    });

    return NextResponse.json({ ok: true, active: nextActive });
}
