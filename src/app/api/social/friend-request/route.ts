// src/app/api/social/friend-request/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

const FRIEND_REQ_SENT = 1;
const FRIEND_RES_ACCEPTED = 1;

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const viewerId = Number(session.user.id);

    const body = await req.json().catch(() => null);
    const targetUserId = Number(body?.targetUserId);
    const action = body?.action as "send" | "cancel" | "accept" | "reject" | "unfriend";

    if (!targetUserId || Number.isNaN(targetUserId)) {
        return NextResponse.json({ error: "Invalid targetUserId" }, { status: 400 });
    }
    if (targetUserId === viewerId) {
        return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });
    }

    // helper: buscar fila existente en cualquier dirección
    const existing = await prisma.friendship.findFirst({
        where: {
            OR: [
                { friend_one: viewerId, friend_two: targetUserId },
                { friend_one: targetUserId, friend_two: viewerId },
            ],
        },
    });

    if (action === "send") {
        if (existing) return NextResponse.json({ ok: true }); // idempotente

        // viewer inicia -> viewer como friend_one
        await prisma.friendship.create({
            data: {
                friend_one: viewerId,
                friend_two: targetUserId,
                friend_request: FRIEND_REQ_SENT,
                friend_response: 0,
            },
        });
        return NextResponse.json({ ok: true });
    }

    if (action === "cancel") {
        // solo cancela si viewer es quien inició y no está aceptado
        await prisma.friendship.deleteMany({
            where: {
                friend_one: viewerId,
                friend_two: targetUserId,
                friend_response: { not: FRIEND_RES_ACCEPTED },
            },
        });
        return NextResponse.json({ ok: true });
    }

    if (action === "accept") {
        // solo acepta si el target inició (target friend_one) y viewer es friend_two
        await prisma.friendship.updateMany({
            where: {
                friend_one: targetUserId,
                friend_two: viewerId,
                friend_request: FRIEND_REQ_SENT,
                friend_response: { not: FRIEND_RES_ACCEPTED },
            },
            data: { friend_response: FRIEND_RES_ACCEPTED },
        });
        return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
        // elimina la solicitud entrante
        await prisma.friendship.deleteMany({
            where: {
                friend_one: targetUserId,
                friend_two: viewerId,
                friend_response: { not: FRIEND_RES_ACCEPTED },
            },
        });
        return NextResponse.json({ ok: true });
    }

    if (action === "unfriend") {
        await prisma.friendship.deleteMany({
            where: {
                OR: [
                    { friend_one: viewerId, friend_two: targetUserId },
                    { friend_one: targetUserId, friend_two: viewerId },
                ],
            },
        });
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
