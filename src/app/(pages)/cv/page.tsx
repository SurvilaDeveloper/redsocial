// src/app/(pages)/cv/page.tsx
import { redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { CVPageClient } from "./[id]/page.client";

export default async function CVPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const cv = await prisma.curriculum.findUnique({
        where: {
            userId: Number(session.user.id),
        },
        select: { id: true },
    });

    // 🧭 Si ya tiene CV → redirigir
    if (cv) {
        redirect(`/cv/${cv.id}`);
    }

    // 🆕 Si no tiene → editor vacío
    return <CVPageClient cvId={null} />;
}

