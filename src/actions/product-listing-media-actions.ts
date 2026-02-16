// src/actions/product-listing-media-actions.ts
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

function cleanIdList(raw: any, maxLen: number) {
    const arr = Array.isArray(raw) ? raw : [];
    const ids = arr
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0);
    return Array.from(new Set(ids)).slice(0, maxLen);
}

async function requireOwnerProductListing(listingId: number, userId: number) {
    const row = await prisma.productListing.findFirst({
        where: { id: listingId, user_id: userId, deletedAt: null },
        select: { id: true },
    });
    return row?.id != null;
}

function findFreeSlot(usedIndexes: Array<number | null | undefined>) {
    const used = new Set<number>();
    for (const v of usedIndexes) {
        const n = Number(v);
        if (Number.isFinite(n)) used.add(n);
    }
    for (let i = 1; i <= MAX_MEDIA; i++) {
        if (!used.has(i)) return i;
    }
    return null;
}

type CreateMediaInput = {
    type?: "image" | "video"; // opcional (default image)
    url: string;
    publicId: string;
    thumbnailUrl?: string;
    thumbnailPublicId?: string;
    durationSec?: number;
    format?: string;
};

export async function addProductListingMedia(listingId: number, input: CreateMediaInput) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const userId = Number(session.user.id);

    if (!Number.isFinite(listingId)) {
        return { ok: false as const, error: "listingId inválido." };
    }

    const isOwner = await requireOwnerProductListing(listingId, userId);
    if (!isOwner) return { ok: false as const, error: "No encontrado o sin permisos." };

    const url = cleanStr(input.url, 255);
    const publicId = cleanStr(input.publicId, 255);

    if (!url || !publicId) {
        return { ok: false as const, error: "Falta url/publicId." };
    }

    const activeCount = await prisma.productListingMedia.count({
        where: { product_listing_id: listingId, active: 1 },
    });

    if (activeCount >= MAX_MEDIA) {
        return { ok: false as const, error: `Máximo ${MAX_MEDIA} medias por producto.` };
    }

    const used = await prisma.productListingMedia.findMany({
        where: { product_listing_id: listingId, active: 1 },
        select: { index: true },
        orderBy: { index: "asc" },
    });

    const slot = findFreeSlot(used.map((r) => r.index));
    if (!slot) return { ok: false as const, error: "No hay slot disponible." };

    const type = input.type === "video" ? "video" : "image";

    const row = await prisma.productListingMedia.create({
        data: {
            product_listing_id: listingId,
            type,
            url,
            publicId,
            thumbnailUrl: cleanStr(input.thumbnailUrl, 255) || null,
            thumbnailPublicId: cleanStr(input.thumbnailPublicId, 255) || null,
            durationSec: input.durationSec != null ? clampInt(input.durationSec, 0, 0, 60 * 60 * 10) : null,
            format: cleanStr(input.format, 20) || null,
            index: slot, // asume schema: index Int? o Int (si es Int, igual va ok)
            active: 1,
        },
        select: { id: true, index: true },
    });

    return { ok: true as const, id: row.id, index: row.index };
}

export async function removeProductListingMedia(listingId: number, mediaId: number) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const userId = Number(session.user.id);

    if (!Number.isFinite(listingId) || !Number.isFinite(mediaId)) {
        return { ok: false as const, error: "IDs inválidos." };
    }

    const isOwner = await requireOwnerProductListing(listingId, userId);
    if (!isOwner) return { ok: false as const, error: "No encontrado o sin permisos." };

    const media = await prisma.productListingMedia.findFirst({
        where: { id: mediaId, product_listing_id: listingId },
        select: { id: true },
    });
    if (!media) return { ok: false as const, error: "Media no encontrada." };

    // Libera el slot (index NULL) para evitar conflictos con @@unique(product_listing_id, index)
    await prisma.productListingMedia.update({
        where: { id: mediaId },
        data: { active: 0, index: null },
    });

    return { ok: true as const };
}

/**
 * Reordena las medias activas según array de ids.
 * - Solo acepta ids pertenecientes al listing.
 * - Mantiene máximo 6.
 * - Reasigna index 1..N (sin huecos).
 *
 * Nota: MySQL no soporta unique parcial (por active), así que:
 * - Las inactivas deben tener index = NULL (libera el slot)
 * - El reorder se hace en 2 fases con índices temporales para evitar colisiones durante swaps
 */
export async function reorderProductListingMedia(listingId: number, orderedIds: number[]) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const userId = Number(session.user.id);

    if (!Number.isFinite(listingId)) return { ok: false as const, error: "listingId inválido." };

    const isOwner = await requireOwnerProductListing(listingId, userId);
    if (!isOwner) return { ok: false as const, error: "No encontrado o sin permisos." };

    const ids = Array.from(
        new Set((orderedIds ?? []).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0))
    ).slice(0, MAX_MEDIA);

    const rows = await prisma.productListingMedia.findMany({
        where: { product_listing_id: listingId, active: 1 },
        select: { id: true },
        orderBy: { index: "asc" },
    });

    const activeIds = new Set(rows.map((r) => r.id));
    for (const id of ids) {
        if (!activeIds.has(id)) return { ok: false as const, error: "Lista contiene ids inválidos." };
    }

    const rest = rows.map((r) => r.id).filter((id) => !ids.includes(id));
    const final = [...ids, ...rest].slice(0, MAX_MEDIA);

    // ✅ TinyInt safe: temporales negativos (no chocan con 1..6)
    // Rango: -128..127, con MAX_MEDIA=6 estamos sobradísimos
    const TEMP_START = -1;

    await prisma.$transaction(async (tx) => {
        // Fase 1: setear a índices temporales únicos (-1, -2, -3...)
        for (let i = 0; i < final.length; i++) {
            await tx.productListingMedia.update({
                where: { id: final[i] },
                data: { index: TEMP_START - i }, // -1, -2, -3...
            });
        }

        // Fase 2: setear a índices definitivos 1..N
        for (let i = 0; i < final.length; i++) {
            await tx.productListingMedia.update({
                where: { id: final[i] },
                data: { index: i + 1 },
            });
        }
    });

    return { ok: true as const };
}


/**
 * (Opcional) Utilidad para limpiar slots de medias inactivas de un listing.
 * Útil si tu DB tenía index no-null en inactivas antes de aplicar el fix.
 */
export async function cleanupInactiveMediaIndexes(listingId: number) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const userId = Number(session.user.id);

    if (!Number.isFinite(listingId)) return { ok: false as const, error: "listingId inválido." };

    const isOwner = await requireOwnerProductListing(listingId, userId);
    if (!isOwner) return { ok: false as const, error: "No encontrado o sin permisos." };

    await prisma.productListingMedia.updateMany({
        where: { product_listing_id: listingId, active: 0 },
        data: { index: null },
    });

    return { ok: true as const };
}


