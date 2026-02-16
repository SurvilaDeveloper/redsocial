// src/actions/product-listing-actions.ts
"use server";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type SaveInput = {
    title: string;
    description: string;
    price: string; // decimal string
    currency: string;
    clarifications: string;
    active: number; // 0/1
    visibility: number; // 1..4 (tu sistema)
};

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

function cleanPrice(v: any) {
    const s = String(v ?? "").trim();
    if (!s) return ""; // allow empty
    // permitimos "123", "123.45"
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return "__INVALID__";
    return s;
}

export async function createProductListing(input: SaveInput) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = Number(session.user.id);

    const title = cleanStr(input.title, 100);
    const description = cleanStr(input.description, 2000);
    const clarifications = cleanStr(input.clarifications, 500);

    const currency = cleanStr(input.currency, 3) || "ARS";
    const active = clampInt(input.active, 1, 0, 1);
    const visibility = clampInt(input.visibility, 1, 1, 4);

    const price = cleanPrice(input.price);
    if (price === "__INVALID__") {
        return { ok: false as const, error: "Precio inválido. Usá formato 123 o 123.45" };
    }

    const row = await prisma.productListing.create({
        data: {
            user_id: userId,
            title: title || null,
            description: description || null,
            clarifications: clarifications || null,
            currency: currency || null,
            price: price ? price : null,
            active,
            visibility,
        },
        select: { id: true },
    });

    return { ok: true as const, id: row.id };
}

export async function updateProductListing(listingId: number, input: SaveInput) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = Number(session.user.id);

    const existing = await prisma.productListing.findFirst({
        where: { id: listingId, user_id: userId, deletedAt: null },
        select: { id: true },
    });
    if (!existing) return { ok: false as const, error: "No encontrado o sin permisos." };

    const title = cleanStr(input.title, 100);
    const description = cleanStr(input.description, 2000);
    const clarifications = cleanStr(input.clarifications, 500);

    const currency = cleanStr(input.currency, 3) || "ARS";
    const active = clampInt(input.active, 1, 0, 1);
    const visibility = clampInt(input.visibility, 0, 0, 4);

    const price = cleanPrice(input.price);
    if (price === "__INVALID__") {
        return { ok: false as const, error: "Precio inválido. Usá formato 123 o 123.45" };
    }

    await prisma.productListing.update({
        where: { id: listingId },
        data: {
            title: title || null,
            description: description || null,
            clarifications: clarifications || null,
            currency: currency || null,
            price: price ? price : null,
            active,
            visibility,
        },
    });

    return { ok: true as const };
}
