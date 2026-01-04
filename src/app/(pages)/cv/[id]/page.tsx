// src/app/(pages)/cv/[id]/page.tsx

import { redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { CVPageClient } from "./page.client";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function CVPage({ params }: Props) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const cv = await prisma.curriculum.findFirst({
        where: {
            id: Number(id),
            userId: Number(session.user.id),
        },
        select: { id: true },
    });

    if (!cv) {
        redirect("/cv"); // 🔁 volver al flujo único
    }

    return <CVPageClient cvId={cv.id} />;
}


