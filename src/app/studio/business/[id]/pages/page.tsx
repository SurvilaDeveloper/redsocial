// src/app/studio/business/[id]/pages/page.tsx
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function BusinessPagesIndex({
    params,
}: {
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
        select: { id: true, ownerId: true, slug: true, name: true, deletedAt: true, active: true },
    });

    if (!business || business.deletedAt != null || business.active !== 1) notFound();
    if (business.ownerId !== userId) notFound();

    const pages = await prisma.businessPage.findMany({
        where: { businessId, deletedAt: null, active: 1 },
        orderBy: { createdAt: "asc" },
        select: { id: true, slug: true, title: true, createdAt: true },
    });

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">
                    Studio / Páginas
                </div>
                <div className="mt-1 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold truncate">{business.name}</h2>
                        <div className="text-sm text-slate-400 truncate">
                            Público:{" "}
                            <a
                                className="text-sky-200 hover:text-sky-100 underline underline-offset-4"
                                href={`/b/${business.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Abrir sitio público en otra pestaña"
                            >
                                /b/{business.slug}
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                        <Link
                            href={`/studio/business/${businessId}`}
                            className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                            title="Volver al panel del negocio"
                        >
                            Volver
                        </Link>

                        <Link
                            href={`/studio/business/${businessId}/pages/new`}
                            className="px-3 py-2 text-sm rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30"
                            title="Crear una nueva página"
                        >
                            Nueva página
                        </Link>
                    </div>
                </div>
            </div>

            {pages.length === 0 ? (
                <div className="text-sm text-slate-400">
                    No tenés páginas todavía. Creá una con “Nueva página”.
                </div>
            ) : (
                <div className="grid gap-2">
                    {pages.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-3"
                        >
                            <div className="min-w-0">
                                <div className="font-medium truncate">{p.title}</div>
                                <div className="text-xs text-slate-400 truncate">
                                    slug: {p.slug} · id: {p.id}
                                </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                <Link
                                    href={`/studio/business/${businessId}/pages/${p.id}`}
                                    className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                    title="Editar esta página"
                                >
                                    Editar
                                </Link>

                                <a
                                    href={`/b/${business.slug}/${p.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                    title="Ver público en otra pestaña"
                                >
                                    Ver
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 text-xs text-slate-500">
                El link “Ver” usa la ruta pública <code>/b/{business.slug}/{`{pageSlug}`}</code>.
            </div>
        </div>
    );
}


