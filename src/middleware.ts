import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {

    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    // Verifica si la ruta es /newpost o una subruta de /newpost
    if (req.nextUrl.pathname.startsWith("/newpost")) {
        if (!token) {
            return NextResponse.redirect(new URL("/login?message=hastologtopost", req.url));
        } else {
            return NextResponse.next();
        }
    }

    // Verifica si el usuario está autenticado
    if (!token) {
        return NextResponse.redirect(new URL("/login?message=hastobeadmin", req.url));
    }

    // Verifica el rol del usuario
    if (token.role !== "admin") {
        return NextResponse.redirect(new URL("/login?message=hastobeadmin", req.url)); // Cambia esta ruta según tu lógica
    }

    // Permite el acceso si pasa ambas verificaciones
    return NextResponse.next();
}

// Configuración de las rutas protegidas
export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/newpost/:path*"], // Aplica el middleware a /dashboard y sus subrutas
};

/*
export const config = {
    matcher: [
        
        //  Aplicar el middleware a todas las rutas excepto las internas de Next.js y archivos estáticos
        
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};

*/

