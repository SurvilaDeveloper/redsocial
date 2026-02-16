//src/app/api/business/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { normalizeSlug, isReservedBusinessSlug } from "@/lib/slug";

const DEFAULT_NAV = [
    { kind: "home", title: "Inicio", order: 0, visible: true },
    { kind: "products", title: "Productos", order: 1, visible: true },
    { kind: "services", title: "Servicios", order: 2, visible: true },
    { kind: "wall", title: "Novedades", order: 3, visible: true },
    { kind: "contact", title: "Contacto", order: 4, visible: true },
] as const;

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id != null ? Number(session.user.id) : null;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const name = String((body as any).name ?? "").trim().slice(0, 80);
        const rawSlug = String((body as any).slug ?? "").trim();
        const slug = normalizeSlug(rawSlug);
        const category = String((body as any).category ?? "").trim().slice(0, 60);
        const headline = String((body as any).headline ?? "").trim().slice(0, 120);

        if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
        if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });
        if (isReservedBusinessSlug(slug)) return NextResponse.json({ error: "Slug reserved" }, { status: 400 });

        // si querés limitar a 1 negocio por usuario, acá lo checkeás.
        // const count = await prisma.business.count({ where: { ownerId: userId, deletedAt: null, active: 1 } });

        try {
            const created = await prisma.business.create({
                data: {
                    ownerId: userId,
                    name,
                    slug,
                    category: category || null,
                    headline: headline || null,
                    active: 1,
                },
                select: { id: true, slug: true, name: true },
            });

            await prisma.businessSite.create({
                data: {
                    businessId: created.id,
                    nav: DEFAULT_NAV as any,
                    homeContent: [
                        {
                            id: crypto.randomUUID(),
                            kind: "hero",
                            data: { title: name, subtitle: headline || "Tu mensaje principal", align: "left" },
                        },
                        {
                            id: crypto.randomUUID(),
                            kind: "text",
                            data: { title: "Sobre nosotros", body: "Contá de qué se trata tu negocio..." },
                        },
                        {
                            id: crypto.randomUUID(),
                            kind: "cta",
                            data: { title: "Contactanos", text: "Escribinos y te respondemos.", buttonText: "Contacto", href: "" },
                        },
                    ] as any,
                    themeConfig: Prisma.JsonNull,
                    showContactForm: true,
                },
            });

            return NextResponse.json({ ok: true, business: created });
        } catch (e: any) {
            if (String(e?.code) === "P2002") {
                return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
            }
            throw e;
        }
    } catch (err) {
        console.error("POST /api/business error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
