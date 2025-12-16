import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Asegúrate de importar correctamente tu instancia de Prisma

export async function GET() {
    try {
        const users = await prisma.user.findMany(); // Obtiene todos los registros de la tabla 'user'
        return NextResponse.json(users);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
