// src/app/b/[slug]/layout.tsx
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import { BusinessPortal } from "@/components/business/BusinessPortal";

import { parseThemeConfig } from "@/lib/business/parseThemeConfig";
import { themeToCssVars } from "@/lib/business/theme";

export default async function PublicBusinessLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;

    const business = await prisma.business.findUnique({
        where: { slug },
        include: { site: true },
    });

    if (!business || business.deletedAt != null) notFound();

    const isOwner = viewerId != null && business.ownerId === viewerId;
    const isActive = (business.active ?? 0) === 1;

    // 👇 por defecto conservador si viniera null/undefined
    const status = business.status ?? "suspended";

    // Si el negocio está inactivo y no sos dueño => 404
    if (!isActive && !isOwner) notFound();

    // Draft / Suspended: si no sos dueño => mensaje consistente en TODO /b/[slug]/*
    if ((status === "draft" || status === "suspended") && !isOwner) {
        const msg =
            status === "draft"
                ? "Disculpá las molestias. El sitio se encuentra en remodelación. Probá visitar más tarde."
                : "Disculpá las molestias. El sitio está temporalmente suspendido. Probá visitar más tarde.";

        return (
            <BusinessPortal>
                <div className="min-h-dvh w-full bg-slate-950 text-slate-100">
                    <div className="mx-auto max-w-3xl px-4 py-10">
                        <div className="text-[20px] font-semibold">{business.name}</div>

                        <div className="mt-6 rounded-2xl border border-amber-600/30 bg-amber-500/10 p-5 text-amber-200">
                            <div className="text-sm leading-relaxed">{msg}</div>
                        </div>
                    </div>
                </div>
            </BusinessPortal>
        );
    }

    // Theme vars disponibles para TODO el árbol /b/[slug]/*
    const themeConfig = parseThemeConfig(business.site?.themeConfig);
    const cssVars = themeToCssVars(themeConfig);

    return (
        <BusinessPortal>
            <div
                id="BUSINESS"
                style={cssVars as React.CSSProperties}
                className="
                absolute
                top-0
                    min-h-dvh
                    w-screen

                "
            >
                {/* Contenido */}
                <main className="flex flex-row items-center justify-center">{children}</main>
            </div>
        </BusinessPortal>
    );
}
