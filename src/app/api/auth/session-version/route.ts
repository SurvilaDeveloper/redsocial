// src/app/api/auth/session-version/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";

// ventana anti-replay (ajustable)
const MAX_SKEW_MS = 60_000;

// Debe matchear exactamente con el middleware
const SIGNED_PATH = "/api/auth/session-version";
const SIGNED_METHOD = "POST";

function base64UrlFromBuffer(buf: Buffer) {
    return buf
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function hmacSHA256Base64Url(secret: string, message: string) {
    const digest = crypto.createHmac("sha256", secret).update(message, "utf8").digest();
    return base64UrlFromBuffer(digest);
}

export async function POST(req: Request) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
    }

    const userIdRaw = req.headers.get("x-user-id") ?? "";
    const tsRaw = req.headers.get("x-ts") ?? "";
    const sig = req.headers.get("x-sig") ?? "";

    const userId = Number(userIdRaw);
    const ts = Number(tsRaw);

    // Fallo genérico (no filtra nada)
    const deny = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

    if (!Number.isFinite(userId) || !Number.isFinite(ts) || !sig) return deny();

    // anti replay
    const now = Date.now();
    if (Math.abs(now - ts) > MAX_SKEW_MS) return deny();

    // Firma: userId.ts.method.path
    const msg = `${userIdRaw}.${tsRaw}.${SIGNED_METHOD}.${SIGNED_PATH}`;
    const expected = hmacSHA256Base64Url(secret, msg);

    // timing-safe compare
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return deny();

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            sessionVersion: true,
            active: true,
            deletedAt: true,
        },
    });

    // No enumerar: si no existe o está inactivo o eliminado => 401 genérico
    if (!user) return deny();
    if ((user.active ?? 1) !== 1) return deny();
    if (user.deletedAt) return deny();

    return NextResponse.json({ sessionVersion: user.sessionVersion });
}

