// src/app/(pages)/cv/page.tsx
import { redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { CVPageClient } from "./[id]/page.client";
import { initialUserCVSelect, serializeInitialUserCV, type InitialUserCV } from "@/types/initialUserCV";

// ✅ (el tipo vive en /types/initialUserCV.ts)

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
    } else {
        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id), },
            select: initialUserCVSelect,
        });

        if (!user) {
            return (
                <div className="min-h-screen w-full bg-slate-950 pt-16 px-3 flex items-center justify-center">
                    <div className="max-w-md w-full rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-6 text-center text-slate-100 text-sm">
                        Usuario no encontrado.
                    </div>
                </div>
            );
        }

        // ✅ Serializar birthday (Date -> ISO string)
        const initialUser: InitialUserCV = serializeInitialUserCV(user);
        return <CVPageClient cvId={null} initialUser={initialUser} />
    }

    // 🆕 Si no tiene → editor vacío
    //return <CVPageClient cvId={null} />;
}

