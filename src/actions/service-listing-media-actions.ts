// src/actions/service-listing-media-actions.ts
"use server";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const MAX_MEDIA = 6;

async function requireOwnerServiceListing(
    listingId: number,
    userId: number
) {
    const row = await prisma.serviceListing.findFirst({
        where: {
            id: listingId,
            user_id: userId,
            deletedAt: null,
        },
        select: { id: true },
    });

    return row?.id != null;
}

type CreateMediaInput = {
    type?: "image" | "video";
    url: string;
    publicId: string;
    thumbnailUrl?: string;
    thumbnailPublicId?: string;
    durationSec?: number;
    format?: string;
};

/**
 * @deprecated Stage 5
 *
 * La creación desde url/publicId enviados por el cliente queda cerrada.
 * POST /api/upload-service-listing-media debe validar el archivo, comprobar
 * ownership del listing, subir a Cloudinary y crear la fila de media.
 */
export async function addServiceListingMedia(
    listingId: number,
    input: CreateMediaInput
) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    void listingId;
    void input;

    return {
        ok: false as const,
        error:
            "Carga directa deshabilitada por seguridad. Subí el archivo nuevamente desde el editor del servicio.",
    };
}

export async function removeServiceListingMedia(
    listingId: number,
    mediaId: number
) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = Number(session.user.id);

    if (
        !Number.isFinite(listingId) ||
        !Number.isFinite(mediaId)
    ) {
        return {
            ok: false as const,
            error: "IDs inválidos.",
        };
    }

    const isOwner =
        await requireOwnerServiceListing(
            listingId,
            userId
        );

    if (!isOwner) {
        return {
            ok: false as const,
            error: "No encontrado o sin permisos.",
        };
    }

    const media =
        await prisma.serviceListingMedia.findFirst({
            where: {
                id: mediaId,
                service_listing_id: listingId,
            },
            select: { id: true },
        });

    if (!media) {
        return {
            ok: false as const,
            error: "Media no encontrada.",
        };
    }

    await prisma.serviceListingMedia.update({
        where: { id: mediaId },
        data: {
            active: 0,
            index: null,
        },
    });

    return { ok: true as const };
}

export async function reorderServiceListingMedia(
    listingId: number,
    orderedIds: number[]
) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = Number(session.user.id);

    if (!Number.isFinite(listingId)) {
        return {
            ok: false as const,
            error: "listingId inválido.",
        };
    }

    const isOwner =
        await requireOwnerServiceListing(
            listingId,
            userId
        );

    if (!isOwner) {
        return {
            ok: false as const,
            error: "No encontrado o sin permisos.",
        };
    }

    const ids = Array.from(
        new Set(
            (orderedIds ?? [])
                .map((value) => Number(value))
                .filter(
                    (value) =>
                        Number.isFinite(value) &&
                        value > 0
                )
        )
    ).slice(0, MAX_MEDIA);

    const rows =
        await prisma.serviceListingMedia.findMany({
            where: {
                service_listing_id: listingId,
                active: 1,
            },
            select: { id: true },
            orderBy: { index: "asc" },
        });

    const activeIds = new Set(
        rows.map((row) => row.id)
    );

    for (const id of ids) {
        if (!activeIds.has(id)) {
            return {
                ok: false as const,
                error:
                    "Lista contiene ids inválidos.",
            };
        }
    }

    const rest = rows
        .map((row) => row.id)
        .filter((id) => !ids.includes(id));

    const final = [...ids, ...rest].slice(
        0,
        MAX_MEDIA
    );

    const TEMP_START = -1;

    await prisma.$transaction(async (tx) => {
        for (let i = 0; i < final.length; i++) {
            await tx.serviceListingMedia.update({
                where: { id: final[i] },
                data: {
                    index: TEMP_START - i,
                },
            });
        }

        for (let i = 0; i < final.length; i++) {
            await tx.serviceListingMedia.update({
                where: { id: final[i] },
                data: { index: i + 1 },
            });
        }
    });

    return { ok: true as const };
}

export async function cleanupInactiveServiceMediaIndexes(
    listingId: number
) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = Number(session.user.id);

    if (!Number.isFinite(listingId)) {
        return {
            ok: false as const,
            error: "listingId inválido.",
        };
    }

    const isOwner =
        await requireOwnerServiceListing(
            listingId,
            userId
        );

    if (!isOwner) {
        return {
            ok: false as const,
            error: "No encontrado o sin permisos.",
        };
    }

    await prisma.serviceListingMedia.updateMany({
        where: {
            service_listing_id: listingId,
            active: 0,
        },
        data: { index: null },
    });

    return { ok: true as const };
}
