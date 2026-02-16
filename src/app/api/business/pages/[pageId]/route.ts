//src/app/api/business/pages/[pageId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import type { BusinessPageContent } from "@/types/business-sections";
import { BusinessPageContentSchema } from "@/lib/validators/business";
import { normalizeSlug, isReservedBusinessPageSlug } from "@/lib/slug";


function isReservedSlug(slug: string) {
    return isReservedBusinessPageSlug(slug);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ pageId: string }> }
) {
    try {
        const session = await auth();
        const userId = session?.user?.id != null ? Number(session.user.id) : null;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { pageId } = await params;
        const id = Number(pageId);
        if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid page id" }, { status: 400 });

        const page = await prisma.businessPage.findUnique({
            where: { id },
            include: { business: { select: { ownerId: true, deletedAt: true, active: true } } },
        });

        if (!page || page.deletedAt != null) return NextResponse.json({ error: "Page not found" }, { status: 404 });
        if (!page.business || page.business.deletedAt != null || page.business.active !== 1) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }
        if (page.business.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const patch: any = {};

        if ("title" in body) {
            const title = String((body as any).title ?? "").trim().slice(0, 100);
            if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
            patch.title = title;
        }

        if ("slug" in body) {
            const slug = normalizeSlug(String((body as any).slug ?? ""));
            if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });
            if (isReservedSlug(slug)) return NextResponse.json({ error: "Slug reserved" }, { status: 400 });
            patch.slug = slug;
        }

        // dentro de PATCH, en el bloque: if ("content" in body) { ... }

        if ("content" in body) {
            const parsed = BusinessPageContentSchema.safeParse((body as any).content);

            if (!parsed.success) {
                console.error("BusinessPageContentSchema error:", parsed.error.format());
                // 🔎 debug útil: devolvés issues con path exacto
                return NextResponse.json(
                    {
                        error: "Invalid content",
                        issues: parsed.error.issues.map((i) => ({
                            path: i.path.join("."), // ej: "3.data.images.0.mediaId"
                            message: i.message,
                            code: i.code,
                        })),
                    },
                    { status: 400 }
                );
            }

            patch.content = parsed.data as any;
        }


        try {
            const updated = await prisma.businessPage.update({
                where: { id },
                data: patch,
                select: { id: true, slug: true, title: true, updatedAt: true, content: true },
            });

            return NextResponse.json({ ok: true, page: updated });
        } catch (e: any) {
            if (String(e?.code) === "P2002") {
                return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
            }
            throw e;
        }
    } catch (err) {
        console.error("PATCH /api/business/pages/[pageId] error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ pageId: string }> }
) {
    try {
        const session = await auth();
        const userId = session?.user?.id != null ? Number(session.user.id) : null;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { pageId } = await params;
        const id = Number(pageId);
        if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid page id" }, { status: 400 });

        const page = await prisma.businessPage.findUnique({
            where: { id },
            include: { business: { select: { ownerId: true } } },
        });

        if (!page || page.deletedAt != null) return NextResponse.json({ error: "Page not found" }, { status: 404 });
        if (!page.business || page.business.ownerId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.businessPage.update({
            where: { id },
            data: { deletedAt: new Date(), active: 0 },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("DELETE /api/business/pages/[pageId] error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
