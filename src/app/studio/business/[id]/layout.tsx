// src/app/studio/business/[id]/layout.tsx
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/custom/navbar";

export default async function BusinessStudioLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) redirect("/login");

    const { id } = await params;
    const businessId = Number(id);
    if (Number.isNaN(businessId)) notFound();

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
            id: true,
            ownerId: true,
            name: true,
            slug: true,
            deletedAt: true,
            active: true,
        },
    });

    if (!business || business.deletedAt != null || business.active !== 1) notFound();
    if (business.ownerId !== userId) notFound();

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <Navbar />
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-xs text-slate-500">Studio / Negocio</div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold truncate">{business.name}</h1>
                        <span className="text-xs text-slate-400 truncate">/b/{business.slug}</span>
                    </div>
                </div>

                <div className="flex gap-2 shrink-0">
                    <Link
                        href="/studio/business"
                        className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        title="Volver a Mis negocios"
                    >
                        Volver a Mis negocios
                    </Link>

                    <a
                        href={`/b/${business.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        title="Ver público"
                    >
                        Ver público
                    </a>
                </div>
            </div>

            {/* Nav + Content */}
            <div className="gap-4">


                <section className="min-w-0">{children}</section>
            </div>
        </div>
    );
}
