// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET,
    });

    const pathname = req.nextUrl.pathname;

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
        pathname.startsWith("/wall");

    if (protectedRoutes && !token) {
        return NextResponse.redirect(
            new URL("/login?message=hastologin", req.url)
        );
    }

    // 🔑 Si hay token → validar sessionVersion
    if (token) {
        try {
            const res = await fetch(
                `${req.nextUrl.origin}/api/auth/session-version`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: token.id }),
                }
            );

            if (!res.ok) {
                return NextResponse.redirect(
                    new URL("/login?message=sessioninvalid", req.url)
                );
            }

            const data = await res.json();

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
    matcher: ["/dashboard/:path*", "/admin/:path*", "/newpost/:path*", "/wall/:path*", "/mywall/:path*"],
};



