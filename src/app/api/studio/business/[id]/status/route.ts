//src/app/api/studio/business/[id]/status/route.ts
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
        select: { id: true, ownerId: true, deletedAt: true, active: true, status: true },
    });

    if (!business || business.deletedAt != null) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (business.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const nextStatus = (business.status === 'active' ? 'draft' : 'active');

    await prisma.business.update({
        where: { id: businessId },
        data: {
            status: nextStatus,
        },
    });

    return NextResponse.json({ ok: true, status: nextStatus });
}