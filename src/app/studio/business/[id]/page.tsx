// src/app/studio/business/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/custom/navbar";

export default async function BusinessStudioBusinessIndexPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) redirect("/api/auth/signin");

    const { id } = await params;
    const businessId = Number(id);
    if (Number.isNaN(businessId)) notFound();

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
            id: true,
            ownerId: true,
            slug: true,
            name: true,
            deletedAt: true,
            active: true,
        },
    });

    if (!business || business.deletedAt != null || business.active !== 1) notFound();
    if (business.ownerId !== userId) notFound();

    const pagesCount = await prisma.businessPage.count({
        where: { businessId: business.id, deletedAt: null },
    });

    return (
        <main className="mx-auto max-w-4xl px-4 py-8">
            <Navbar />

            <div className="mb-6">
                <div className="text-xs uppercase tracking-wide text-slate-400">
                    Studio / Negocio
                </div>
                <h1 className="text-xl font-semibold mt-1">{business.name}</h1>

                <div className="text-sm text-slate-400 mt-1">
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

            <section className="grid gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                        Edición del sitio
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">

                        <a
                            href={`/studio/business/${business.id}/header`}
                            className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-3"
                            title="Editar el contenido del encabezado"
                        >
                            <div className="font-medium text-slate-100">Header</div>
                            <div className="text-xs text-slate-400 mt-1">
                                Textos y fondo del encabezado
                            </div>
                        </a>

                        <a
                            href={`/studio/business/${business.id}/home`}
                            className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-3"
                            title="Editar el contenido de la Home"
                        >
                            <div className="font-medium text-slate-100">Home</div>
                            <div className="text-xs text-slate-400 mt-1">
                                Secciones y contenido de inicio
                            </div>
                        </a>

                        <a
                            href={`/studio/business/${business.id}/nav`}
                            className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-3"
                            title="Editar pestañas y navegación"
                        >
                            <div className="font-medium text-slate-100">Navegación</div>
                            <div className="text-xs text-slate-400 mt-1">
                                Tabs (Inicio, Productos, Servicios, etc.)
                            </div>
                        </a>

                        <a
                            href={`/studio/business/${business.id}/pages`}
                            className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-3"
                            title="Administrar páginas del sitio"
                        >
                            <div className="font-medium text-slate-100">Páginas</div>
                            <div className="text-xs text-slate-400 mt-1">
                                {pagesCount} página{pagesCount === 1 ? "" : "s"} (crear / editar)
                            </div>
                        </a>

                        <a
                            href={`/studio/business/${business.id}/theme`}
                            className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-3"
                            title="Elegir preset y ajustar estilos del sitio"
                        >
                            <div className="font-medium text-slate-100">Tema</div>
                            <div className="text-xs text-slate-400 mt-1">
                                Presets, colores, tipografía y componentes
                            </div>
                        </a>

                        <a
                            href="/studio/product-listing"
                            className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-3"
                            title="Ir al editor de productos"
                        >
                            <div className="font-medium text-slate-100">Productos</div>
                            <div className="text-xs text-slate-400 mt-1">
                                Crear/editar ProductListings (por ahora global)
                            </div>
                        </a>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                        Acciones
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <a
                            href={`/b/${business.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200"
                            title="Abrir el sitio público"
                        >
                            Ver público
                        </a>

                        <a
                            href="/studio/business"
                            className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200"
                            title="Volver a la lista de negocios"
                        >
                            Volver a mis negocios
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}

