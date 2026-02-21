//src/app/studio/business/[id]/templates/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

import { getAllSiteTemplates } from "@/lib/site-templates/siteTemplates";
//import { ApplyTemplateButton } from "@/components/site-templates/studio/ApplyTemplateButton";
//import { ApplyStyleTemplateButton } from "@/components/site-templates/studio/ApplyStyleTemplateButton";
import { ApplyTemplateDialogButton } from "@/components/site-templates/studio/ApplyTemplateDialogButton";

export default async function BusinessStudioTemplatesPage({
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
        select: {
            id: true,
            slug: true,          // ✅
            ownerId: true,
            deletedAt: true,
            active: true,
            name: true,
        },
    });


    if (!business || business.deletedAt != null || business.active !== 1) notFound();
    if (business.ownerId !== userId) notFound();

    const templates = getAllSiteTemplates();

    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="text-xs uppercase tracking-wide text-slate-400">Templates</div>
                <div className="mt-1 text-lg font-semibold text-slate-100">
                    Elegí un template para <span className="text-slate-300">{business.name}</span>
                </div>
                <div className="mt-2 text-sm text-slate-400">
                    Podés ver una demo pública y luego aplicar el template para editarlo con tu contenido.
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                        href={`/studio/business/${business.id}`}
                        className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                    >
                        Volver
                    </Link>
                </div>
            </div>

            {templates.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-300">
                    No hay templates cargados todavía.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((t: any) => {
                        const preview = String(t?.previewImage ?? "").trim();
                        const label = String(t?.label ?? t?.id ?? "Template").trim();
                        const demoHref = `/t/${t.id}/home`;

                        return (
                            <div
                                key={t.id}
                                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
                            >
                                <div className="w-full aspect-[16/9] bg-slate-900 border-b border-slate-800 overflow-hidden">
                                    {preview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={preview}
                                            alt={label}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
                                            Sin previewImage
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <div className="text-sm font-semibold text-slate-100">{label}</div>
                                    {/*<div className="mt-1 text-xs text-slate-400">ID: {t.id}</div>*/}

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <a
                                            href={demoHref}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                            title="Abrir demo en otra pestaña"
                                        >
                                            Ver demo
                                        </a>
                                        <ApplyTemplateDialogButton
                                            businessId={business.id}
                                            businessSlug={business.slug}
                                            templateId={t.id}
                                        />

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}