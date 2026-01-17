// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const CHECK_COOKIE = "__sv_check";
const TTL_MS = 10_000; // 👈 recomendado en hardening (10s). Si querés, 30s.

const SIGNED_PATH = "/api/auth/session-version";
const SIGNED_METHOD = "POST";

function isDocumentRequest(req: NextRequest) {
    const accept = req.headers.get("accept") ?? "";
    const dest = req.headers.get("sec-fetch-dest") ?? "";
    return dest === "document" || accept.includes("text/html");
}

function base64UrlEncode(bytes: ArrayBuffer) {
    const b = Buffer.from(bytes);
    return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBuffer(s: string) {
    const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
    const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(b64, "base64");
}

async function hmacSign(secret: string, message: string) {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
    return base64UrlEncode(sig);
}

async function hmacVerify(secret: string, message: string, signature: string) {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );
    return crypto.subtle.verify(
        "HMAC",
        key,
        base64UrlToBuffer(signature),
        new TextEncoder().encode(message)
    );
}

type CheckPayload = { ts: number; sv: number };

async function readValidCheckCookie(req: NextRequest, secret: string): Promise<CheckPayload | null> {
    const raw = req.cookies.get(CHECK_COOKIE)?.value;
    if (!raw) return null;

    const [p, sig] = raw.split(".");
    if (!p || !sig) return null;

    const json = base64UrlToBuffer(p).toString("utf8");
    let payload: CheckPayload | null = null;

    try {
        payload = JSON.parse(json) as CheckPayload;
    } catch {
        return null;
    }

    if (!payload || typeof payload.ts !== "number" || typeof payload.sv !== "number") return null;

    const msg = `${payload.ts}.${payload.sv}`;
    const ok = await hmacVerify(secret, msg, sig);
    if (!ok) return null;

    if (Date.now() - payload.ts > TTL_MS) return null;

    return payload;
}

async function writeCheckCookie(res: NextResponse, secret: string, sv: number) {
    const payload: CheckPayload = { ts: Date.now(), sv };
    const msg = `${payload.ts}.${payload.sv}`;
    const sig = await hmacSign(secret, msg);

    const p = Buffer.from(JSON.stringify(payload), "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

    res.cookies.set(CHECK_COOKIE, `${p}.${sig}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: Math.ceil(TTL_MS / 1000),
    });
}

function safeJsonParse(text: string) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

async function makeSignedHeaders(secret: string, userId: string) {
    const ts = Date.now();
    const msg = `${userId}.${ts}.${SIGNED_METHOD}.${SIGNED_PATH}`;
    const sig = await hmacSign(secret, msg);

    return {
        "Content-Type": "application/json",
        "x-user-id": userId,
        "x-ts": String(ts),
        "x-sig": sig,
    };
}

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET,
    });

    const protectedRoutes =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/newpost") ||
        pathname.startsWith("/editpost") ||
        pathname.startsWith("/editprofile") ||
        pathname.startsWith("/mywall") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/trash") ||
        pathname.startsWith("/cv") ||
        pathname.startsWith("/editaccount") ||
        pathname.startsWith("/account") ||
        pathname.startsWith("/security") ||
        pathname.startsWith("/u") ||
        pathname.startsWith("/search");

    if (protectedRoutes && !token) {
        return NextResponse.redirect(new URL("/login?message=hastologin", req.url));
    }

    // Solo navegación real (si querés más estricto, sacá isDocumentRequest)
    if (protectedRoutes && token && isDocumentRequest(req)) {
        const secret = process.env.AUTH_SECRET;
        if (!secret) {
            return NextResponse.redirect(new URL("/login?message=sessionerror", req.url));
        }

        const cached = await readValidCheckCookie(req, secret);
        if (cached) {
            if (cached.sv !== token.sessionVersion) {
                return NextResponse.redirect(new URL("/login?message=sessionexpired", req.url));
            }
            return NextResponse.next();
        }

        try {
            const userId = String(token.id);

            const res = await fetch(`${req.nextUrl.origin}${SIGNED_PATH}`, {
                method: SIGNED_METHOD,
                headers: await makeSignedHeaders(secret, userId),
                cache: "no-store",
            });

            // 401 = invalid (incluye inactivo/borrado/no existe/firma inválida)
            if (!res.ok) {
                return NextResponse.redirect(new URL("/login?message=sessioninvalid", req.url));
            }

            const text = await res.text();
            const data = text ? safeJsonParse(text) : null;

            if (!data || typeof data.sessionVersion !== "number") {
                return NextResponse.redirect(new URL("/login?message=sessioninvalid", req.url));
            }

            if (data.sessionVersion !== token.sessionVersion) {
                return NextResponse.redirect(new URL("/login?message=sessionexpired", req.url));
            }

            const next = NextResponse.next();
            await writeCheckCookie(next, secret, data.sessionVersion);
            return next;
        } catch {
            return NextResponse.redirect(new URL("/login?message=sessionerror", req.url));
        }
    }

    if (pathname.startsWith("/admin") && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/login?message=hastobeadmin", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        "/newpost/:path*",
        "/mywall/:path*",
        "/editpost/:path*",
        "/editprofile/:path*",
        "/trash/:path*",
        "/cv/:path*",
        "/editaccount/:path*",
        "/account/:path*",
        "/security/:path*",
        "/u/:path*",
        "/search/:path*",
    ],
};


/*Si no me gusta el de arriba, reemplazar por el de abajo*/
/*
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // (opcional pero recomendado) ignorar assets/api por si el matcher cambia en el futuro
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname === "/favicon.ico" ||
        pathname.startsWith("/.well-known")
    ) {
        return NextResponse.next();
    }

    const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET,
    });

    // 🔒 Rutas que requieren login
    const protectedRoutes =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/newpost") ||
        pathname.startsWith("/editpost") ||
        pathname.startsWith("/editprofile") ||
        pathname.startsWith("/mywall") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/trash") ||
        pathname.startsWith("/cv") ||
        pathname.startsWith("/editaccount") ||
        pathname.startsWith("/account") ||
        pathname.startsWith("/security") ||
        pathname.startsWith("/u") ||
        pathname.startsWith("/search");

    if (protectedRoutes && !token) {
        return NextResponse.redirect(new URL("/login?message=hastologin", req.url));
    }

    // 🔑 Si hay token → validar sessionVersion (sin body)
    if (protectedRoutes && token) {
        try {
            const res = await fetch(`${req.nextUrl.origin}/api/auth/session-version`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
            });

            // si no autorizó o falló el endpoint, tratamos como sesión inválida
            if (!res.ok) {
                return NextResponse.redirect(
                    new URL("/login?message=sessioninvalid", req.url)
                );
            }

            // robusto: parseo seguro (evita Unexpected end of JSON)
            const text = await res.text();
            const data = text ? JSON.parse(text) : null;

            if (!data || typeof data.sessionVersion !== "number") {
                return NextResponse.redirect(
                    new URL("/login?message=sessioninvalid", req.url)
                );
            }

            // 🚨 INVALIDAR SESIÓN
            if (data.sessionVersion !== token.sessionVersion) {
                return NextResponse.redirect(
                    new URL("/login?message=sessionexpired", req.url)
                );
            }
        } catch {
            return NextResponse.redirect(
                new URL("/login?message=sessionerror", req.url)
            );
        }
    }

    // 👮‍♂️ Control de rol
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
        return NextResponse.redirect(
            new URL("/login?message=hastobeadmin", req.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        "/newpost/:path*",
        "/mywall/:path*",
        "/editpost/:path*",
        "/editprofile/:path*",
        "/trash/:path*",
        "/cv/:path*",
        "/editaccount/:path*",
        "/account/:path*",
        "/security/:path*",
        "/u/:path*",
        "/search/:path*",
    ],
};
*/