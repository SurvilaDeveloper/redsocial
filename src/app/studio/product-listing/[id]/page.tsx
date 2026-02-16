// src/app/studio/product-listing/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/custom/navbar";
import { ProductListingEditor } from "@/components/productListing/editor/ProductListingEditor";
import type { ListingMedia } from "@/components/productListing/editor/ProductListingEditor";
import BackToStudioBusiness from "@/components/custom/BackToStudioBusiness";

export default async function ProductListingEditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = Number(session.user.id);
    const { id } = await params;
    const listingId = Number(id);
    if (Number.isNaN(listingId)) notFound();

    const listing = await prisma.productListing.findFirst({
        where: { id: listingId, user_id: userId, deletedAt: null },
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            currency: true,
            clarifications: true,
            active: true,
            visibility: true,
            media: {
                where: { active: 1 },
                orderBy: { index: "asc" },
                select: {
                    id: true,
                    type: true,
                    url: true,
                    thumbnailUrl: true,
                    publicId: true,
                    thumbnailPublicId: true,
                    durationSec: true,
                    format: true,
                    index: true,
                    active: true,
                },
            },
        },
    });

    if (!listing) notFound();

    const mediaForEditor: ListingMedia[] = (listing.media ?? []).map((m, i) => ({
        id: m.id,
        type: m.type === "video" ? "video" : "image",
        url: m.url ?? null,
        thumbnailUrl: m.thumbnailUrl ?? null,
        publicId: m.publicId ?? null,
        thumbnailPublicId: m.thumbnailPublicId ?? null,
        durationSec: m.durationSec ?? null,
        format: m.format ?? null,
        index: m.index ?? i + 1,
        active: m.active ?? 1,
    }));

    return (
        <main className="mx-auto max-w-4xl px-4 py-8">
            <Navbar />

            <div className="mb-4">
                <BackToStudioBusiness label="Volver a mis negocios" />
            </div>

            <ProductListingEditor
                mode="edit"
                listingId={listing.id}
                initial={{
                    title: listing.title ?? "",
                    description: listing.description ?? "",
                    price: listing.price != null ? String(listing.price) : "",
                    currency: listing.currency ?? "ARS",
                    clarifications: listing.clarifications ?? "",
                    active: listing.active ?? 1,
                    visibility: listing.visibility ?? 1,
                }}
                initialMedia={mediaForEditor}
            />
        </main>
    );
}
