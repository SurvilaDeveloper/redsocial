// src/app/studio/business/[id]/pages/[pageId]/page.tsx
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import { BusinessSinglePageEditor } from "@/components/business/editor/BusinessSinglePageEditor";
import type { BusinessPageContent } from "@/types/business-sections";

function safeParseJson<T>(v: any, fallback: T): T {
    try {
        if (v == null) return fallback;
        if (typeof v === "string") return JSON.parse(v) as T;
        return v as T;
    } catch {
        return fallback;
    }
}

export default async function BusinessPageEditPage({
    params,
}: {
    params: Promise<{ id: string; pageId: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) redirect("/api/auth/signin");

    const { id, pageId } = await params;
    const businessId = Number(id);
    const bpId = Number(pageId);

    if (Number.isNaN(businessId) || Number.isNaN(bpId)) notFound();

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, ownerId: true, slug: true, name: true, deletedAt: true, active: true },
    });
    if (!business || business.deletedAt != null || business.active !== 1) notFound();
    if (business.ownerId !== userId) notFound();

    const page = await prisma.businessPage.findFirst({
        where: { id: bpId, businessId, deletedAt: null },
    });

    if (!page) notFound();

    const content = safeParseJson<BusinessPageContent>(page.content, []);

    return (
        <BusinessSinglePageEditor
            mode="edit"
            businessId={business.id}
            businessSlug={business.slug}
            businessName={business.name}
            pageId={page.id}
            initialTitle={page.title}
            initialSlug={page.slug}
            initialContent={content}
        />
    );
}

