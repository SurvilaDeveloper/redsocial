// src/app/studio/business/page.tsx
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import auth from "@/auth";
import Navbar from "@/components/custom/navbar";
import { BusinessActiveToggle } from "@/components/business/BusinessActiveToggle";

const MAX_BUSINESSES_PER_USER = 3;

export default async function BusinessStudioIndex() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = Number(session.user.id);

    const businesses = await prisma.business.findMany({
        where: {
            ownerId: userId,
            deletedAt: null,
            active: 1,
        },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            slug: true,
            name: true,
            createdAt: true,
            status: true,
        },
    });

    const canCreate = businesses.length < MAX_BUSINESSES_PER_USER;

    return (
        <main className="mx-auto max-w-4xl px-4 py-8">
            <Navbar />

            <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-xl font-semibold">Mis negocios</h1>
                    <p className="text-sm text-slate-400">
                        Podés crear hasta {MAX_BUSINESSES_PER_USER} negocios.
                        <span className="ml-2 text-slate-500">
                            ({businesses.length}/{MAX_BUSINESSES_PER_USER})
                        </span>
                    </p>
                </div>

                <a
                    href={canCreate ? "/studio/business/new" : undefined}
                    aria-disabled={!canCreate}
                    className={[
                        "inline-flex items-center px-4 py-2 rounded-xl border text-sm",
                        canCreate
                            ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30"
                            : "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed pointer-events-none",
                    ].join(" ")}
                    title={
                        canCreate
                            ? "Crear nuevo negocio"
                            : `Alcanzaste el máximo de ${MAX_BUSINESSES_PER_USER} negocios`
                    }
                >
                    Crear nuevo negocio
                </a>
            </div>

            {businesses.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <p className="text-sm text-slate-400 mb-4">
                        Todavía no creaste ningún negocio.
                    </p>

                    {canCreate ? (
                        <a
                            href="/studio/business/new"
                            className="inline-flex items-center px-4 py-2 rounded-xl
                                   bg-emerald-600/20 border border-emerald-500/40
                                   text-emerald-200 hover:bg-emerald-600/30"
                        >
                            Crear nuevo negocio
                        </a>
                    ) : (
                        <div className="text-sm text-slate-500">
                            Alcanzaste el máximo de {MAX_BUSINESSES_PER_USER} negocios.
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid gap-3">
                    {businesses.map((b) => (
                        <div
                            key={b.id}
                            className="flex items-center justify-between
                                   rounded-xl border border-slate-800 bg-slate-950 p-4"
                        >
                            <div className="flex flex-col items-center justify-center gap-2">
                                <div className="min-w-0">
                                    <div className="font-medium truncate">{b.name}</div>
                                    <div className="text-xs text-slate-400 truncate">
                                        /b/{b.slug}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex gap-2 shrink-0">
                                        <a
                                            href={`/studio/business/${b.id}`}
                                            className="flex px-3 py-2 text-sm rounded-xl items-center justify-center
                                           border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                            title="Elegir negocio para editar"
                                        >
                                            Elegir
                                        </a>

                                        <a
                                            href={`/b/${b.slug}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex px-3 py-2 text-sm rounded-xl items-center justify-center
                                           border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                            title="Abrir público en otra pestaña"
                                        >
                                            Ver público
                                        </a>
                                        <BusinessActiveToggle businessId={b.id} status={b.status ?? 'draft'} />
                                    </div>

                                </div>

                            </div>

                        </div>
                    ))}

                    {!canCreate && (
                        <div className="mt-2 text-sm text-slate-500">
                            Alcanzaste el máximo de {MAX_BUSINESSES_PER_USER} negocios.
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}




