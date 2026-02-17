// src/app/api/business/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { normalizeSlug, isReservedBusinessSlug } from "@/lib/slug";

type NavKind = "home" | "page" | "contact";

type NavItem = {
    kind: NavKind;
    slug: string;
    title: string;
    order: number;
    visible: boolean;
};

function sectionId() {
    return crypto.randomUUID();
}

function defaultPageContent(title: string) {
    return [
        {
            id: sectionId(),
            kind: "text",
            data: { title, body: "Editá este contenido desde el editor del sitio." },
        },
    ];
}

function defaultContactContent() {
    return [
        {
            id: sectionId(),
            kind: "text",
            data: {
                title: "Contacto",
                body: "Agregá tus datos de contacto (WhatsApp, email, dirección, horarios, etc.).",
            },
        },
        {
            id: sectionId(),
            kind: "cta",
            data: {
                title: "¿Querés consultarnos?",
                text: "Escribinos y te respondemos.",
                buttonText: "Enviar mensaje",
                href: "",
            },
        },
    ];
}

const DEFAULT_PAGES: Array<{ kind: NavKind; slug: string; title: string }> = [
    { kind: "home", slug: "home", title: "Inicio" },
    { kind: "page", slug: "novedades", title: "Novedades" },
    { kind: "page", slug: "productos", title: "Productos" },
    { kind: "page", slug: "sobre-nosotros", title: "Sobre nosotros" },
    { kind: "contact", slug: "contacto", title: "Contacto" },
];

const DEFAULT_NAV: NavItem[] = DEFAULT_PAGES.map((p, i) => ({
    kind: p.kind,
    slug: p.slug,
    title: p.title,
    order: i,
    visible: true,
}));

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

        try {
            const created = await prisma.$transaction(async (tx) => {
                const business = await tx.business.create({
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

                await tx.businessSite.create({
                    data: {
                        businessId: business.id,

                        // ✅ nuevo: preset activo desde el inicio
                        themePreset: "classic",

                        nav: DEFAULT_NAV as any,
                        homeContent: [
                            {
                                id: sectionId(),
                                kind: "hero",
                                data: { title: name, subtitle: headline || "Tu mensaje principal", align: "left" },
                            },
                            {
                                id: sectionId(),
                                kind: "text",
                                data: { title: "Sobre nosotros", body: "Contá de qué se trata tu negocio..." },
                            },
                            {
                                id: sectionId(),
                                kind: "cta",
                                data: {
                                    title: "Contactanos",
                                    text: "Escribinos y te respondemos.",
                                    buttonText: "Contacto",
                                    href: "/contacto",
                                },
                            },
                        ] as any,

                        // ✅ NULL real en DB
                        themeConfig: Prisma.DbNull,

                        showContactForm: true,
                    },
                });

                await tx.businessPage.createMany({
                    data: DEFAULT_PAGES.map((p) => ({
                        businessId: business.id,
                        slug: p.slug,
                        title: p.title,
                        content:
                            p.kind === "home"
                                ? defaultPageContent("Inicio")
                                : p.kind === "contact"
                                    ? defaultContactContent()
                                    : defaultPageContent(p.title),
                        active: 1,
                        deletedAt: null,
                    })),
                });

                return business;
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