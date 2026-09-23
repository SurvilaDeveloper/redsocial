// src/actions/service-listing-media-actions.ts
"use server";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const MAX_MEDIA = 6;

function clampInt(v: any, def: number, min: number, max: number) {
    const n = Number(v);
    if (Number.isNaN(n)) return def;
    return Math.max(min, Math.min(max, Math.trunc(n)));
}

function cleanStr(v: any, maxLen: number) {
    const s = String(v ?? "").trim();
    if (!s) return "";
    return s.length > maxLen ? s.slice(0, maxLen).trim() : s;
}

async function requireOwnerServiceListing(listingId: number, userId: number) {
    const row = await prisma.serviceListing.findFirst({
        where: { id: listingId, user_id: userId, deletedAt: null },
        select: { id: true },
    });

    return row?.id != null;
}

function findFreeSlot(usedIndexes: Array<number | null | undefined>) {
    const used = new Set<number>();

    for (const value of usedIndexes) {
        const index = Number(value);

        if (Number.isFinite(index)) {
            used.add(index);
        }
    }

    for (let i = 1; i <= MAX_MEDIA; i++) {
        if (!used.has(i)) return i;
    }

    return null;
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

export async function addServiceListingMedia(
    listingId: number,
    input: CreateMediaInput
) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = Number(session.user.id);

    if (!Number.isFinite(listingId)) {
        return { ok: false as const, error: "listingId inválido." };
    }

    const isOwner = await requireOwnerServiceListing(listingId, userId);

    if (!isOwner) {
        return { ok: false as const, error: "No encontrado o sin permisos." };
    }

    const url = cleanStr(input.url, 255);
    const publicId = cleanStr(input.publicId, 255);

    if (!url || !publicId) {
        return { ok: false as const, error: "Falta url/publicId." };
    }

    const activeCount = await prisma.serviceListingMedia.count({
        where: {
            service_listing_id: listingId,
            active: 1,
        },
    });

    if (activeCount >= MAX_MEDIA) {
        return {
            ok: false as const,
            error: `Máximo ${MAX_MEDIA} medias por servicio.`,
        };
    }

    const used = await prisma.serviceListingMedia.findMany({
        where: {
            service_listing_id: listingId,
            active: 1,
        },
        select: {
            index: true,
        },
        orderBy: {
            index: "asc",
        },
    });

    const slot = findFreeSlot(used.map((row) => row.index));

    if (!slot) {
        return { ok: false as const, error: "No hay slot disponible." };
    }

    const type = input.type === "video" ? "video" : "image";

    const row = await prisma.serviceListingMedia.create({
        data: {
            service_listing_id: listingId,
            type,
            url,
            publicId,
            thumbnailUrl: cleanStr(input.thumbnailUrl, 255) || null,
            thumbnailPublicId:
                cleanStr(input.thumbnailPublicId, 255) || null,
            durationSec:
                input.durationSec != null
                    ? clampInt(input.durationSec, 0, 0, 60 * 60 * 10)
                    : null,
            format: cleanStr(input.format, 20) || null,
            index: slot,
            active: 1,
        },
        select: {
            id: true,
            index: true,
        },
    });

    return {
        ok: true as const,
        id: row.id,
        index: row.index,
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

    if (!Number.isFinite(listingId) || !Number.isFinite(mediaId)) {
        return { ok: false as const, error: "IDs inválidos." };
    }

    const isOwner = await requireOwnerServiceListing(listingId, userId);

    if (!isOwner) {
        return { ok: false as const, error: "No encontrado o sin permisos." };
    }

    const media = await prisma.serviceListingMedia.findFirst({
        where: {
            id: mediaId,
            service_listing_id: listingId,
        },
        select: {
            id: true,
        },
    });

    if (!media) {
        return { ok: false as const, error: "Media no encontrada." };
    }

    // Liberamos el slot para que pueda reutilizarse.
    await prisma.serviceListingMedia.update({
        where: {
            id: mediaId,
        },
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
        return { ok: false as const, error: "listingId inválido." };
    }

    const isOwner = await requireOwnerServiceListing(listingId, userId);

    if (!isOwner) {
        return { ok: false as const, error: "No encontrado o sin permisos." };
    }

    const ids = Array.from(
        new Set(
            (orderedIds ?? [])
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value) && value > 0)
        )
    ).slice(0, MAX_MEDIA);

    const rows = await prisma.serviceListingMedia.findMany({
        where: {
            service_listing_id: listingId,
            active: 1,
        },
        select: {
            id: true,
        },
        orderBy: {
            index: "asc",
        },
    });

    const activeIds = new Set(rows.map((row) => row.id));

    for (const id of ids) {
        if (!activeIds.has(id)) {
            return {
                ok: false as const,
                error: "Lista contiene ids inválidos.",
            };
        }
    }

    const rest = rows
        .map((row) => row.id)
        .filter((id) => !ids.includes(id));

    const final = [...ids, ...rest].slice(0, MAX_MEDIA);

    // Dos fases para evitar colisiones con
    // @@unique([service_listing_id, index]) durante swaps.
    const TEMP_START = -1;

    await prisma.$transaction(async (tx) => {
        for (let i = 0; i < final.length; i++) {
            await tx.serviceListingMedia.update({
                where: {
                    id: final[i],
                },
                data: {
                    index: TEMP_START - i,
                },
            });
        }

        for (let i = 0; i < final.length; i++) {
            await tx.serviceListingMedia.update({
                where: {
                    id: final[i],
                },
                data: {
                    index: i + 1,
                },
            });
        }
    });

    return { ok: true as const };
}

export async function cleanupInactiveServiceMediaIndexes(listingId: number) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = Number(session.user.id);

    if (!Number.isFinite(listingId)) {
        return { ok: false as const, error: "listingId inválido." };
    }

    const isOwner = await requireOwnerServiceListing(listingId, userId);

    if (!isOwner) {
        return { ok: false as const, error: "No encontrado o sin permisos." };
    }

    await prisma.serviceListingMedia.updateMany({
        where: {
            service_listing_id: listingId,
            active: 0,
        },
        data: {
            index: null,
        },
    });

    return { ok: true as const };
}
