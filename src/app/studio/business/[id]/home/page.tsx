//src/app/studio/business/[id]/home/page.tsx
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import { BusinessHomeEditor } from "@/components/business/editor/BusinessHomeEditor";
import type { BusinessPageContent } from "@/types/business-sections";
import Navbar from "@/components/custom/navbar";

function safeParseJson<T>(v: any, fallback: T): T {
    try {
        if (v == null) return fallback;
        if (typeof v === "string") return JSON.parse(v) as T;
        return v as T;
    } catch {
        return fallback;
    }
}

export default async function BusinessHomeStudioPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) redirect("/api/auth/signin"); // o tu login

    const { id } = await params;
    const businessId = Number(id);
    if (Number.isNaN(businessId)) notFound();

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { site: true },
    });

    if (!business || business.deletedAt != null || business.active !== 1) notFound();
    if (business.ownerId !== userId) notFound(); // o 403 page

    const homeContent = safeParseJson<BusinessPageContent>(business.site?.homeContent, []);

    return (
        <>
            <Navbar />
            <BusinessHomeEditor
                businessId={business.id}
                businessSlug={business.slug}
                businessName={business.name}
                initialHomeContent={homeContent}
            />
        </>

    );
}
