// src/app/api/upload-product-listing-media/route.ts
import { NextRequest, NextResponse } from "next/server";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import {
    MediaUploadValidationError,
    assertListingMediaRequestSizeIsReasonable,
} from "@/lib/cloudinary-upload-security";
import {
    rollbackUploadedListingMedia,
    uploadValidatedListingMedia,
    type UploadedListingMedia,
} from "@/lib/cloudinary-listing-media";

export const runtime = "nodejs";

const MAX_MEDIA = 6;

function findFreeSlot(
    usedIndexes: Array<number | null | undefined>
) {
    const used = new Set<number>();

    for (const value of usedIndexes) {
        const index = Number(value);
        if (Number.isFinite(index)) used.add(index);
    }

    for (let i = 1; i <= MAX_MEDIA; i++) {
        if (!used.has(i)) return i;
    }

    return null;
}

function parseListingId(value: FormDataEntryValue | null) {
    if (typeof value !== "string") return null;

    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    const userId =
        session?.user?.id != null
            ? Number(session.user.id)
            : null;

    if (!userId || !Number.isFinite(userId)) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    let uploaded: UploadedListingMedia | null = null;

    try {
        assertListingMediaRequestSizeIsReasonable(
            req.headers.get("content-length")
        );

        const formData = await req.formData();
        const listingId = parseListingId(
            formData.get("listingId")
        );

        if (!listingId) {
            return NextResponse.json(
                { error: "listingId inválido." },
                { status: 400 }
            );
        }

        const listing = await prisma.productListing.findFirst({
            where: {
                id: listingId,
                user_id: userId,
                deletedAt: null,
            },
            select: { id: true },
        });

        if (!listing) {
            return NextResponse.json(
                { error: "Producto no encontrado o sin permisos." },
                { status: 404 }
            );
        }

        const activeRows =
            await prisma.productListingMedia.findMany({
                where: {
                    product_listing_id: listingId,
                    active: 1,
                },
                select: { index: true },
                orderBy: { index: "asc" },
            });

        if (activeRows.length >= MAX_MEDIA) {
            return NextResponse.json(
                {
                    error: `Máximo ${MAX_MEDIA} medias por producto.`,
                },
                { status: 409 }
            );
        }

        const slot = findFreeSlot(
            activeRows.map((row) => row.index)
        );

        if (!slot) {
            return NextResponse.json(
                { error: "No hay slot disponible." },
                { status: 409 }
            );
        }

        uploaded = await uploadValidatedListingMedia(
            formData.get("file"),
            {
                main: "product_listings",
                thumbnail: "product_listings/thumbs",
            }
        );

        try {
            const row =
                await prisma.productListingMedia.create({
                    data: {
                        product_listing_id: listingId,
                        type: uploaded.type,
                        url: uploaded.url,
                        publicId: uploaded.publicId,
                        thumbnailUrl:
                            uploaded.thumbnailUrl,
                        thumbnailPublicId:
                            uploaded.thumbnailPublicId,
                        durationSec:
                            uploaded.durationSec,
                        format: uploaded.format,
                        index: slot,
                        active: 1,
                    },
                    select: {
                        id: true,
                        type: true,
                        url: true,
                        publicId: true,
                        thumbnailUrl: true,
                        thumbnailPublicId: true,
                        durationSec: true,
                        format: true,
                        index: true,
                        active: true,
                    },
                });

            return NextResponse.json({
                id: row.id,
                type:
                    row.type === "video"
                        ? "video"
                        : "image",
                url: row.url,
                publicId: row.publicId,
                thumbUrl: row.thumbnailUrl,
                thumbPublicId:
                    row.thumbnailPublicId,
                durationSec: row.durationSec,
                format: row.format,
                index: row.index,
                active: row.active,
            });
        } catch (error) {
            await rollbackUploadedListingMedia(uploaded);
            uploaded = null;
            throw error;
        }
    } catch (error) {
        if (error instanceof MediaUploadValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }

        if ((error as any)?.code === "P2002") {
            return NextResponse.json(
                {
                    error:
                        "Otro cambio ocupó ese slot. Reintentá la carga.",
                },
                { status: 409 }
            );
        }

        console.error(
            "upload-product-listing-media error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Error procesando/subiendo el archivo.",
            },
            { status: 500 }
        );
    }
}
