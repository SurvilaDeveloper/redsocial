// src/components/productListing/editor/ProductListingEditor.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProductListing, updateProductListing } from "@/actions/product-listing-actions";
import { ProductListingMediaGrid } from "../media/ProductListingMediaGrid";

export type ListingMedia = {
    id: number;
    type: "image" | "video";
    url: string | null;
    thumbnailUrl: string | null;
    publicId: string | null;
    thumbnailPublicId: string | null;
    durationSec: number | null;
    format: string | null;
    index: number; // ✅ UI: siempre number (1..MAX)
    active: number | null;
};

type EditorMode = "create" | "edit";

type Initial = {
    title: string;
    description: string;
    price: string;
    currency: string;
    clarifications: string;
    active: number; // 0/1
    visibility: number; // 0..4
};

const DEFAULT_INITIAL: Initial = {
    title: "",
    description: "",
    price: "",
    currency: "ARS",
    clarifications: "",
    active: 1,
    visibility: 1,
};

export function ProductListingEditor({
    mode,
    listingId,
    initial,
    initialMedia,
}: {
    mode: EditorMode;
    listingId?: number;
    initial?: Initial;
    initialMedia?: ListingMedia[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const init = useMemo(() => initial ?? DEFAULT_INITIAL, [initial]);

    const [title, setTitle] = useState(init.title);
    const [description, setDescription] = useState(init.description);
    const [price, setPrice] = useState(init.price);
    const [currency, setCurrency] = useState(init.currency || "ARS");
    const [clarifications, setClarifications] = useState(init.clarifications);
    const [active, setActive] = useState<number>(init.active ?? 1);
    const [visibility, setVisibility] = useState<number>(init.visibility ?? 1);

    const [error, setError] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    const onSave = () => {
        setError(null);
        setOkMsg(null);

        startTransition(async () => {
            const payload = {
                title,
                description,
                price,
                currency,
                clarifications,
                active,
                visibility,
            };

            try {
                if (mode === "create") {
                    const res = await createProductListing(payload);
                    if (!res.ok) {
                        setError(res.error ?? "No se pudo crear.");
                        return;
                    }
                    setOkMsg("Creado ✅");
                    router.replace(`/studio/product-listing/${res.id}`);
                    return;
                }

                if (!listingId) {
                    setError("Falta listingId.");
                    return;
                }

                const res = await updateProductListing(listingId, payload);
                if (!res.ok) {
                    setError(res.error ?? "No se pudo guardar.");
                    return;
                }

                setOkMsg("Guardado ✅");
                router.refresh();
            } catch (e: any) {
                setError(e?.message ?? "Error inesperado.");
            }
        });
    };

    return (
        <section className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold">
                        {mode === "create" ? "Crear producto" : `Editar producto #${listingId}`}
                    </h1>
                    <p className="text-sm text-slate-400">Campos MVP. Después sumamos media, stock, categorías, etc.</p>
                </div>

                <button
                    type="button"
                    onClick={onSave}
                    disabled={pending}
                    className={[
                        "px-4 py-2 text-sm rounded-xl border",
                        pending
                            ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-emerald-600/20 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30",
                    ].join(" ")}
                    title="Guardar"
                >
                    {pending ? "Guardando..." : "Guardar"}
                </button>
            </div>

            {(error || okMsg) && (
                <div className="mt-4">
                    {error && (
                        <div className="text-sm text-red-300 border border-red-500/40 bg-red-500/10 rounded-xl p-3">
                            {error}
                        </div>
                    )}
                    {okMsg && (
                        <div className="text-sm text-emerald-200 border border-emerald-500/40 bg-emerald-500/10 rounded-xl p-3">
                            {okMsg}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-5 grid gap-4">
                <div className="grid gap-2">
                    <label className="text-xs text-slate-400">Título</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                        placeholder="Ej: Campera de cuero"
                        maxLength={100}
                    />
                </div>

                <div className="grid gap-2">
                    <label className="text-xs text-slate-400">Descripción</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full min-h-[100px] rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                        placeholder="Contá lo importante del producto"
                        maxLength={2000}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="grid gap-2">
                        <label className="text-xs text-slate-400">Precio</label>
                        <input
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                            placeholder="Ej: 19999.99"
                        />
                        <div className="text-[11px] text-slate-500">Formato: 123 o 123.45</div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-xs text-slate-400">Moneda</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                        >
                            <option value="ARS">ARS</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-xs text-slate-400">Visibilidad</label>
                        <select
                            value={String(visibility)}
                            onChange={(e) => setVisibility(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                        >
                            <option value="0">Solo yo</option>
                            <option value="1">Público</option>
                            <option value="2">Logueados</option>
                            <option value="3">Seguidores/Amigos</option>
                            <option value="4">Solo amigos</option>
                        </select>
                    </div>
                </div>

                <div className="grid gap-2">
                    <label className="text-xs text-slate-400">Aclaraciones</label>
                    <textarea
                        value={clarifications}
                        onChange={(e) => setClarifications(e.target.value)}
                        className="w-full min-h-[80px] rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                        placeholder="Ej: Envíos a todo el país. Se retira por..."
                        maxLength={500}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <input
                        id="active"
                        type="checkbox"
                        checked={active === 1}
                        onChange={(e) => setActive(e.target.checked ? 1 : 0)}
                        className="h-4 w-4"
                    />
                    <label htmlFor="active" className="text-sm text-slate-200">
                        Activo
                    </label>
                </div>

                <div className="flex justify-between gap-3 pt-2">
                    <a
                        href="/studio/product-listing"
                        className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200"
                    >
                        Volver
                    </a>

                    {mode === "edit" && listingId != null && (
                        <>
                            <ProductListingMediaGrid listingId={listingId} initialMedia={initialMedia ?? []} />
                            <a
                                href={`/studio/product-listing/${listingId}`}
                                className="px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200"
                                title="Recargar"
                            >
                                Refrescar
                            </a>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}