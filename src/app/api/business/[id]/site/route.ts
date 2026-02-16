// src/app/api/business/[id]/site/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import type { BusinessPageContent } from "@/types/business-sections";
import { BusinessPageContentSchema } from "@/lib/validators/business";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const userId = session?.user?.id != null ? Number(session.user.id) : null;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const businessId = Number(id);
        if (Number.isNaN(businessId)) {
            return NextResponse.json({ error: "Invalid business id" }, { status: 400 });
        }

        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const business = await prisma.business.findUnique({
            where: { id: businessId },
            include: { owner: { select: { id: true } }, site: true },
        });

        if (!business || business.deletedAt != null || business.active !== 1) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        if (business.ownerId !== userId && business.owner?.id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const parsed = BusinessPageContentSchema.safeParse((body as any).homeContent);
        if (!parsed.success) {
            // ✅ devolvemos issues (igual que pages/[pageId])
            console.error("BusinessPageContentSchema error:", parsed.error.format());
            return NextResponse.json(
                {
                    error: "Invalid homeContent",
                    issues: parsed.error.issues.map((i) => ({
                        path: i.path.join("."),
                        message: i.message,
                        code: i.code,
                    })),
                },
                { status: 400 }
            );
        }

        const homeContent: BusinessPageContent = parsed.data as any;

        const updated = await prisma.businessSite.upsert({
            where: { businessId },
            create: { businessId, homeContent },
            update: { homeContent },
            select: { id: true, businessId: true, updatedAt: true, homeContent: true },
        });

        return NextResponse.json({ ok: true, site: updated });
    } catch (err) {
        console.error("PATCH /api/business/[id]/site error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

