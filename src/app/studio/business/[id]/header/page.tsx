//src/app/studio/business/[id]/header/page.tsx
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/custom/navbar";
import { BusinessHeaderEditor } from "@/components/business/editor/BusinessHeaderEditor";

export default async function BusinessHeaderStudioPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) redirect("/login");

    const { id } = await params;
    const businessId = Number(id);
    if (!Number.isFinite(businessId) || businessId <= 0) notFound();

    const business = await prisma.business.findFirst({
        where: { id: businessId, ownerId: userId, deletedAt: null, active: 1 },
        select: {
            id: true,
            name: true,
            headline: true,
            category: true,
            slug: true,

            surfaceBgColor: true,

            bgColor: true,
            width: true,
            headerHeight: true,
            headerBgColor: true,

            titleColor: true,
            titleTypography: true,
            titleTextSize: true,
            titleAlignText: true,

            headlineColor: true,
            headlineTypography: true,
            headlineTextSize: true,
            headlineAlignText: true,

            categoryColor: true,
            categoryTypography: true,
            categoryTextSize: true,
            categoryAlignText: true,

            headerBgImageId: true,
            headerBgImage: { select: { id: true, url: true, publicId: true } },
            headerBgPosition: true,
            headerBgSize: true,
        },
    });

    if (!business) notFound();

    return (
        <main className="mx-auto max-w-4xl px-4 py-8">
            <Navbar />
            <BusinessHeaderEditor
                businessId={business.id}
                businessName={business.name}
                initialHeadline={business.headline || ""}
                initialCategory={business.category || ""}
                businessSlug={business.slug}

                initialSurfaceBgColor={business.surfaceBgColor}

                initialBgColor={business.bgColor}
                initialWidth={business.width}
                initialHeaderHeight={business.headerHeight}
                initialHeaderBgColor={business.headerBgColor}

                initialTitleColor={business.titleColor}
                initialTitleTypography={business.titleTypography}
                initialTitleTextSize={business.titleTextSize}
                initialTitleAlignText={business.titleAlignText}

                initialHeadlineColor={business.headlineColor}
                initialHeadlineTypography={business.headlineTypography}
                initialHeadlineTextSize={business.headlineTextSize}
                initialHeadlineAlignText={business.headlineAlignText}

                initialCategoryColor={business.categoryColor}
                initialCategoryTypography={business.categoryTypography}
                initialCategoryTextSize={business.categoryTextSize}
                initialCategoryAlignText={business.categoryAlignText}

                initialImage={
                    business.headerBgImage
                        ? {
                            id: business.headerBgImage.id,
                            url: business.headerBgImage.url,
                            publicId: business.headerBgImage.publicId,
                        }
                        : null
                }
                initialBgPosition={business.headerBgPosition || "left"}
                initialBgSize={business.headerBgSize || "cover"}
            />
        </main>
    );
}
