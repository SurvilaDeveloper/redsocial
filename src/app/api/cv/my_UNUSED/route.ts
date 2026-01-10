// src/app/api/cv/my_UNUSED/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cvs = await prisma.curriculum.findMany({
        where: { userId: Number(session.user.id) },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            title: true,
            summary: true,
            isPublic: true,
            updatedAt: true,
            styleConfig: true, // traemos para calcular hasStyleConfig
        },
    });

    const shaped = cvs.map((cv) => ({
        id: cv.id,
        title: cv.title,
        summary: cv.summary,
        isPublic: cv.isPublic,
        updatedAt: cv.updatedAt,
        hasStyleConfig: cv.styleConfig != null, // Prisma devuelve null cuando no hay
    }));

    return NextResponse.json({ cvs: shaped });
}

/*
// src/app/api/cv/my_UNUSED/route.ts

// Opción B (completa): incluye styleConfig en la respuesta
// Útil si querés renderizar mini-previews o un editor rápido desde el listado.


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cvs = await prisma.curriculum.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      isPublic: true,
      updatedAt: true,
      styleConfig: true, // ✅ incluido
    },
  });

  return NextResponse.json({ cvs });
}

*/

