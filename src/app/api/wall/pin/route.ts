// src/app/api/wall/pin/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

type Body = {
    postId?: number | string;
    // opcional: si querés setear visibilidad al pin al crearlo/actualizarlo
    visibility?: 1 | 2 | 3 | 4;
};

function toPostId(v: unknown): number | null {
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.floor(n);
}

export const runtime = "nodejs";

export async function POST(req: Request) {
    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;

    if (viewerId == null) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: Body | null = null;
    try {
        body = (await req.json()) as Body;
    } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const postId = toPostId(body?.postId);
    if (postId == null) {
        return NextResponse.json({ success: false, error: "Invalid postId" }, { status: 400 });
    }

    // Opcional: si mandás visibility, la normalizamos a 1..4
    const nextVisibility =
        body?.visibility === 1 || body?.visibility === 2 || body?.visibility === 3 || body?.visibility === 4
            ? body.visibility
            : undefined;

    // Validar que el post exista y no esté borrado/inactivo
    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, active: true, deletedAt: true },
    });

    if (!post || post.deletedAt || (post.active ?? 1) !== 1) {
        return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const now = new Date();

    // Un solo PINNED por (wallUserId, actorUserId, postId, type).
    // Como el pin es "en mi muro" y lo hago yo, wallUserId=viewerId y actorUserId=viewerId.
    try {
        const wallEntry = await prisma.wallEntry.upsert({
            where: {
                wallUserId_actorUserId_postId_type: {
                    wallUserId: viewerId,
                    actorUserId: viewerId,
                    postId,
                    type: "PINNED",
                },
            },
            update: {
                // ✅ el comportamiento pedido:
                // si existe, actualizar eventAt sin tocar createdAt
                eventAt: now,
                active: 1,
                ...(nextVisibility != null ? { visibility: nextVisibility } : {}),
            },
            create: {
                wallUserId: viewerId,
                actorUserId: viewerId,
                postId,
                type: "PINNED",
                active: 1,
                visibility: nextVisibility ?? 1,
                showInFeed: false, // lo dejé conservador (después lo podés toggle en otro endpoint/UI)
                eventAt: now,
                // createdAt lo pone Prisma con default(now())
            },
            select: {
                id: true,
                type: true,
                createdAt: true,
                eventAt: true,
                wallUserId: true,
                actorUserId: true,
                postId: true,
                active: true,
                visibility: true,
                showInFeed: true,
            },
        });

        return NextResponse.json({ success: true, wallEntry });
    } catch (e: any) {
        // Si el nombre del unique compuesto no coincide (depende de tu schema/prisma client),
        // acá te va a tirar error. En ese caso te lo ajusto con el nombre exacto que te genere Prisma.
        return NextResponse.json(
            { success: false, error: "Failed to pin", detail: String(e?.message ?? e) },
            { status: 500 }
        );
    }
}



