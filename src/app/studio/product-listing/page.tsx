// src/app/studio/product-listing/page.tsx
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import auth from "@/auth";
import Navbar from "@/components/custom/navbar";
import BackToStudioBusiness from "@/components/custom/BackToStudioBusiness";
import Image from "next/image";

function safeStr(v: unknown, fallback: string) {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s : fallback;
}

export default async function ProductListingStudioIndex() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = Number(session.user.id);

    const listings = await prisma.productListing.findMany({
        where: {
            user_id: userId,
            deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            visibility: true,
            media: {
                where: { active: 1 },
                orderBy: { index: "asc" },
                take: 1, // ✅ solo la primera
                select: {
                    id: true,
                    thumbnailUrl: true,
                    url: true, // ✅ fallback si no hay thumb
                    index: true,
                    active: true,
                },
            },
        },
    });

    return (
        <main className="mx-auto max-w-4xl lg:w-[1024px] w-dvw px-4 py-8">
            <Navbar />

            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex flex-col gap-2">
                    <BackToStudioBusiness label="Volver" />

                    <div>
                        <h1 className="text-xl font-semibold">Mis productos</h1>
                        <p className="text-sm text-slate-400">Creá y editá tus product listings.</p>
                    </div>
                </div>

                <a
                    href="/studio/product-listing/new"
                    className="inline-flex items-center px-4 py-2 rounded-xl border text-sm
                               bg-emerald-600/20 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30"
                    title="Crear nuevo producto"
                >
                    Crear producto
                </a>
            </div>

            {listings.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <p className="text-sm text-slate-400 mb-4">Todavía no creaste ningún producto.</p>
                    <a
                        href="/studio/product-listing/new"
                        className="inline-flex items-center px-4 py-2 rounded-xl
                                   bg-emerald-600/20 border border-emerald-500/40
                                   text-emerald-200 hover:bg-emerald-600/30"
                    >
                        Crear producto
                    </a>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {listings.map((p) => {
                        const media0 = p.media?.[0];
                        const thumbUrl = media0?.thumbnailUrl?.trim() || media0?.url?.trim() || "";

                        return (
                            <div
                                key={p.id}
                                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4 gap-4"
                            >
                                {/* ✅ Thumb */}
                                <div className="shrink-0">
                                    {thumbUrl ? (
                                        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                                            <Image
                                                src={thumbUrl}
                                                alt={safeStr(p.title, "Producto")}
                                                fill
                                                sizes="64px"
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-16 w-16 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-[10px] text-slate-500">
                                            Sin img
                                        </div>
                                    )}
                                </div>

                                {/* ✅ Texto */}
                                <div className="min-w-0 w-full">
                                    <div className="font-medium truncate">
                                        {p.title?.trim() ? p.title : "Sin título"}
                                    </div>
                                    <div className="text-xs text-slate-400 truncate max-w-lg">
                                        {p.description?.trim() ? p.description : "Sin descripción"}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1">
                                        #{p.id} · vis:{p.visibility ?? 1}
                                    </div>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <a
                                        href={`/studio/product-listing/${p.id}`}
                                        className="px-3 py-2 text-sm rounded-xl
                                                   border border-slate-800 bg-slate-900 hover:bg-slate-800"
                                        title="Editar"
                                    >
                                        Editar
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}


