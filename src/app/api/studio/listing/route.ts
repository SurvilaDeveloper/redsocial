//src/app/api/studio/listings/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

function cleanType(v: string | null): "product" | "service" | null {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "product") return "product";
    if (s === "service") return "service";
    return null;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const { searchParams } = new URL(req.url);
    const type = cleanType(searchParams.get("type"));

    if (!type) {
        return NextResponse.json({ error: "Invalid type. Use ?type=product|service" }, { status: 400 });
    }

    if (type === "product") {
        const rows = await prisma.productListing.findMany({
            where: {
                user_id: userId,
                deletedAt: null,
                // NO filtramos active acá (active es moderación) -> el dueño los ve igual
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                description: true,
                visibility: true,
                active: true,
                media: {
                    where: { active: 1 },
                    orderBy: { index: "asc" },
                    take: 1,
                    select: {
                        type: true,
                        thumbnailUrl: true,
                        url: true,
                    },
                },
            },
            take: 200,
        });

        const items = rows.map((r) => {
            const m = r.media?.[0] ?? null;
            return {
                id: r.id,
                title: r.title?.trim() ? r.title : `Producto #${r.id}`,
                description: r.description ?? "",
                visibility: r.visibility ?? 1,
                active: r.active ?? 1,
                thumbUrl: m?.thumbnailUrl ?? m?.url ?? null,
                mediaType: m?.type ?? null,
            };
        });

        return NextResponse.json({ items });
    }

    // service
    const rows = await prisma.serviceListing.findMany({
        where: {
            user_id: userId,
            deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            description: true,
            visibility: true,
            active: true,
            media: {
                where: { active: 1 },
                orderBy: { index: "asc" },
                take: 1,
                select: {
                    type: true,
                    thumbnailUrl: true,
                    url: true,
                },
            },
        },
        take: 200,
    });

    const items = rows.map((r) => {
        const m = r.media?.[0] ?? null;
        return {
            id: r.id,
            title: r.title?.trim() ? r.title : `Servicio #${r.id}`,
            description: r.description ?? "",
            visibility: r.visibility ?? 1,
            active: r.active ?? 1,
            thumbUrl: m?.thumbnailUrl ?? m?.url ?? null,
            mediaType: m?.type ?? null,
        };
    });

    return NextResponse.json({ items });
}
