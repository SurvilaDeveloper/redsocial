// src/app/studio/business/[id]/pages/new/page.tsx
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import { BusinessSinglePageEditor } from "@/components/business/editor/BusinessSinglePageEditor";
import type { BusinessPageContent } from "@/types/business-sections";

export default async function BusinessPageCreatePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) redirect("/login");

    const { id } = await params;
    const businessId = Number(id);
    if (Number.isNaN(businessId)) notFound();

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, ownerId: true, slug: true, name: true, deletedAt: true, active: true },
    });

    if (!business || business.deletedAt != null || business.active !== 1) notFound();
    if (business.ownerId !== userId) notFound();

    const initialContent: BusinessPageContent = [];

    return (
        <BusinessSinglePageEditor
            mode="create"
            businessId={business.id}
            businessSlug={business.slug}
            businessName={business.name}
            initialTitle="Nueva página"
            initialSlug="nueva-pagina"
            initialContent={initialContent}
        />
    );
}

