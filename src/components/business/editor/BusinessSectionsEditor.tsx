//src/components/business/editor/BusinessSectionsEditor.tsx
"use client";

import React, { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { BusinessPageContent, BusinessSection } from "@/types/business-sections";
import { BusinessSectionRenderer } from "@/components/business/sections/BusinessSectionRenderer";

import { MediaPicker } from "@/components/media/MediaPicker";
import { uploadSiteImage } from "@/lib/cloudinary-functions";

import { useMediaByIds } from "@/hooks/useMediaByIds";

type Kind = BusinessSection["kind"];

function uuid() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function createSection(kind: Kind, businessName?: string): BusinessSection {
    const id = uuid();

    if (kind === "hero") {
        return {
            id,
            kind,
            data: { title: businessName || "Título", subtitle: "Subtítulo", align: "left" },
        };
    }
    if (kind === "text") {
        return { id, kind, data: { title: "Sección", body: "Escribí acá..." } };
    }
    if (kind === "features") {
        return {
            id,
            kind,
            data: { title: "Características", items: [{ title: "Item 1", text: "Descripción" }], columns: 2 },
        };
    }
    if (kind === "gallery") {
        return { id, kind, data: { title: "Galería", images: [], columns: 3, width: "100%", minWidth: "512px" } };
    }
    if (kind === "productive") {
        return {
            id,
            kind,
            data: {
                title: "Destacados",
                type: "product", // "product" | "service"
                items: [
                    { title: "Item 1", listingId: 0, text: "" }, // listingId num
                ],
            },
        };
    }

    return {
        id,
        kind: "cta",
        data: { title: "Llamado a la acción", text: "Mensaje", buttonText: "Contactar", href: "" },
    };
}

export function BusinessSectionsEditor({
    value,
    onChange,
    businessName,
    showPreview = true,
}: {
    value: BusinessPageContent;
    onChange: (next: BusinessPageContent) => void;
    businessName?: string;
    showPreview?: boolean;
}) {
    const sections = Array.isArray(value) ? value : [];
    const [localError, setLocalError] = useState<string | null>(null);

    function set(next: BusinessPageContent) {
        setLocalError(null);
        onChange(next);
    }

    function move(index: number, dir: -1 | 1) {
        const next = sections.slice();
        const j = index + dir;
        if (index < 0 || index >= next.length) return;
        if (j < 0 || j >= next.length) return;
        const tmp = next[index];
        next[index] = next[j];
        next[j] = tmp;
        set(next);
    }

    function remove(id: string) {
        set(sections.filter((s) => s.id !== id));
    }

    function add(kind: Kind) {
        set([...sections, createSection(kind, businessName)]);
    }

    function updateSection(id: string, patch: any) {
        set(
            sections.map((s) => {
                if (s.id !== id) return s;
                return { ...s, data: { ...(s as any).data, ...patch } } as any;
            })
        );
    }

    function replaceSection(id: string, next: BusinessSection) {
        set(sections.map((s) => (s.id === id ? next : s)));
    }

    /* const allMediaIds = React.useMemo(() => {
         const out: number[] = [];
 
         for (const s of sections) {
             if (s.kind === "gallery") {
                 const imgs = (s.data as any)?.images ?? [];
                 for (const row of imgs) {
                     const id = Number(row?.mediaId);
                     if (Number.isFinite(id) && id > 0) out.push(id);
                 }
             }
         }
 
         return out;
     }, [sections]);
 
     console.log("allMediaIds BusinessSectionsEditor():", allMediaIds);
     const { mediaMap } = useMediaByIds(allMediaIds);
     console.log("mediaMap BusinessSectionsEditor():", mediaMap);*/
    return (
        <div className={cn("grid gap-4", showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
            {/* Panel editor */}
            <div className="flex flex-col gap-4">
                <Card className="bg-slate-950 border-slate-800 p-4 rounded-2xl">
                    <div className="text-sm font-semibold">Agregar sección</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <AddBtn label="Hero" onClick={() => add("hero")} />
                        <AddBtn label="Texto" onClick={() => add("text")} />
                        <AddBtn label="Features" onClick={() => add("features")} />
                        <AddBtn label="Galería" onClick={() => add("gallery")} />
                        <AddBtn label="Productivo" onClick={() => add("productive")} />
                        <AddBtn label="CTA" onClick={() => add("cta")} />
                    </div>

                    {localError && <div className="mt-3 text-sm text-red-300">{localError}</div>}
                </Card>

                {sections.length === 0 && (
                    <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
                        <div className="text-sm text-slate-400">No hay secciones todavía.</div>
                    </Card>
                )}

                {sections.map((s, idx) => (
                    <Card key={s.id} className="bg-slate-950 border-slate-800 p-4 rounded-2xl">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                                {idx + 1}. {labelForKind(s.kind)}
                            </div>

                            <div className="flex items-center gap-1">
                                <IconBtn title="Subir" onClick={() => move(idx, -1)} disabled={idx === 0}>
                                    <ArrowUp size={16} />
                                </IconBtn>
                                <IconBtn
                                    title="Bajar"
                                    onClick={() => move(idx, +1)}
                                    disabled={idx === sections.length - 1}
                                >
                                    <ArrowDown size={16} />
                                </IconBtn>
                                <IconBtn title="Eliminar" onClick={() => remove(s.id)}>
                                    <Trash2 size={16} />
                                </IconBtn>
                            </div>
                        </div>

                        <div className="mt-3">
                            <SectionEditor
                                section={s}
                                onUpdate={(patch) => updateSection(s.id, patch)}
                                onReplace={(next) => replaceSection(s.id, next)}
                            />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Preview */}
            {showPreview && (
                <div className="flex flex-col gap-4">
                    <Card className="bg-slate-950 border-slate-800 p-4 rounded-2xl">
                        <div className="text-sm font-semibold">Preview</div>
                        <div className="mt-3">
                            <BusinessSectionRenderer sections={sections} /> {/*mediaMap={mediaMap} */}

                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
        >
            <Plus size={16} className="mr-2 opacity-80" />
            {label}
        </button>
    );
}

function IconBtn({
    title,
    onClick,
    disabled,
    children,
}: {
    title: string;
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900"
            )}
        >
            {children}
        </button>
    );
}

function labelForKind(kind: Kind) {
    if (kind === "hero") return "Hero";
    if (kind === "text") return "Texto";
    if (kind === "features") return "Features";
    if (kind === "gallery") return "Galería";
    if (kind === "productive") return "Productivo";
    return "CTA";
}

/* ──────────────────────────────────────
 * Section editors (inline)
 * ────────────────────────────────────── */

type ListingPickItem = {
    id: number;
    title: string;
    description?: string;
    thumbUrl: string | null;
    visibility: number;
    active: number;
};

async function fetchStudioListings(type: "product" | "service") {
    const res = await fetch(`/api/studio/listing?type=${type}`, { method: "GET" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "No se pudieron cargar los listings.");
    return (data.items ?? []) as ListingPickItem[];
}


function SectionEditor({
    section,
    onUpdate,
    onReplace,
}: {
    section: BusinessSection;
    onUpdate: (patch: any) => void;
    onReplace: (next: BusinessSection) => void;
}) {
    if (section.kind === "hero") {
        const d = section.data;
        return (
            <div className="flex flex-col gap-2">
                <Field label="Título">
                    <Input value={d.title} onChange={(v) => onUpdate({ title: v })} />
                </Field>
                <Field label="Subtítulo">
                    <Input value={d.subtitle ?? ""} onChange={(v) => onUpdate({ subtitle: v })} />
                </Field>
                <Field label="Alineación">
                    <Select
                        value={d.align ?? "left"}
                        onChange={(v) => onUpdate({ align: v as "left" | "center" })}
                        options={[
                            { value: "left", label: "Izquierda" },
                            { value: "center", label: "Centrada" },
                        ]}
                    />
                </Field>
            </div>
        );
    }

    if (section.kind === "text") {
        const d = section.data;
        return (
            <div className="flex flex-col gap-2">
                <Field label="Título (opcional)">
                    <Input value={d.title ?? ""} onChange={(v) => onUpdate({ title: v })} />
                </Field>
                <Field label="Texto">
                    <Textarea value={d.body} onChange={(v) => onUpdate({ body: v })} />
                </Field>
            </div>
        );
    }

    if (section.kind === "features") {
        const d = section.data;
        const items = d.items ?? [];

        function updateItem(i: number, patch: any) {
            const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
            onUpdate({ items: next });
        }

        function addItem() {
            onUpdate({ items: [...items, { title: "Nuevo item", text: "" }] });
        }

        function removeItem(i: number) {
            onUpdate({ items: items.filter((_, idx) => idx !== i) });
        }

        return (
            <div className="flex flex-col gap-3">
                <Field label="Título (opcional)">
                    <Input value={d.title ?? ""} onChange={(v) => onUpdate({ title: v })} />
                </Field>
                <Field label="Columnas">
                    <Select
                        value={String(d.columns ?? 2)}
                        onChange={(v) => onUpdate({ columns: Number(v) as 1 | 2 | 3 })}
                        options={[
                            { value: "1", label: "1" },
                            { value: "2", label: "2" },
                            { value: "3", label: "3" },
                        ]}
                    />
                </Field>

                <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">Items</div>
                    <button
                        type="button"
                        onClick={addItem}
                        className="text-xs px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800"
                    >
                        + Agregar
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    {items.map((it, i) => (
                        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                            <div className="flex justify-between gap-2">
                                <div className="text-xs text-slate-400">Item {i + 1}</div>
                                <button
                                    type="button"
                                    onClick={() => removeItem(i)}
                                    className="text-xs text-red-300 hover:text-red-200"
                                >
                                    Eliminar
                                </button>
                            </div>

                            <div className="mt-2 flex flex-col gap-2">
                                <Field label="Título">
                                    <Input value={it.title} onChange={(v) => updateItem(i, { title: v })} />
                                </Field>
                                <Field label="Texto (opcional)">
                                    <Input value={it.text ?? ""} onChange={(v) => updateItem(i, { text: v })} />
                                </Field>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (section.kind === "gallery") {
        const d = section.data;
        const images = d.images ?? [];

        const [pickerOpen, setPickerOpen] = React.useState(false);
        const [uploading, setUploading] = React.useState(false);
        const [uploadError, setUploadError] = React.useState<string | null>(null);

        const fileRef = React.useRef<HTMLInputElement | null>(null);

        // ✅ resolver mediaId -> url para preview
        const [mediaMap, setMediaMap] = React.useState<Record<number, { url: string }>>({});

        React.useEffect(() => {
            const ids = Array.from(
                new Set(
                    (images as any[])
                        .map((x) => Number(x?.mediaId))
                        .filter((n) => Number.isFinite(n))
                )
            );

            if (ids.length === 0) {
                setMediaMap({});
                return;
            }

            let cancelled = false;

            (async () => {
                try {
                    const res = await fetch("/api/media/by-ids", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) return;

                    if (cancelled) return;

                    // data.items: [{id,url}]
                    const next: Record<number, { url: string }> = {};
                    for (const it of (data.items ?? []) as Array<{ id: number; url: string }>) {
                        next[it.id] = { url: it.url };
                    }
                    setMediaMap(next);
                } catch {
                    // silencio: preview no es crítico
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [images]);

        function addPicked(img: { id: number; url: string }) {
            onUpdate({ images: [...images, { mediaId: img.id, url: img.url, alt: "" }] });
            setPickerOpen(false);
        }


        function removeImage(i: number) {
            onUpdate({ images: images.filter((_, idx) => idx !== i) });
        }

        function updateImage(i: number, patch: any) {
            const next = images.map((row, idx) => (idx === i ? { ...row, ...patch } : row));
            onUpdate({ images: next });
        }

        async function registerMedia(payload: { url: string; publicId: string }) {
            const res = await fetch("/api/media/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "No se pudo registrar media.");
            return data.item as { id: number; url: string; publicId: string };
        }

        async function onUpload(file: File) {
            setUploadError(null);
            setUploading(true);

            try {
                const up = await uploadSiteImage(file); // url + publicId
                const saved = await registerMedia({ url: up.url, publicId: up.publicId });

                onUpdate({
                    images: [...images, { mediaId: saved.id, url: saved.url, alt: "" }],
                });
            } catch (e: any) {
                setUploadError(e?.message || "Error subiendo imagen.");
            } finally {
                setUploading(false);
            }
        }

        return (
            <div className="flex flex-col gap-3">
                <Field label="Título (opcional)">
                    <Input value={d.title ?? ""} onChange={(v) => onUpdate({ title: v })} />
                </Field>

                <Field label="Columnas">
                    <Select
                        value={String(d.columns ?? 3)}
                        onChange={(v) => onUpdate({ columns: Number(v) as 1 | 2 | 3 | 4 })}
                        options={[
                            { value: "1", label: "1" },
                            { value: "2", label: "2" },
                            { value: "3", label: "3" },
                            { value: "4", label: "4" },
                        ]}
                    />
                </Field>

                <Field label="Swiper">
                    <Select
                        value={String(d.swiper ?? false)}
                        onChange={(v) => onUpdate({ swiper: String(v) })}
                        options={[
                            { value: "false", label: "false" },
                            { value: "true", label: "true" }
                        ]}
                    />
                </Field>

                <Field label="Ancho">
                    <Select
                        value={String(d.width ?? "100%")}
                        onChange={(v) => onUpdate({ width: String(v) })}
                        options={[
                            { value: "25%", label: "1/4" },
                            { value: "33%", label: "1/3" },
                            { value: "50%", label: "1/2" },
                            { value: "66%", label: "2/3" },
                            { value: "75%", label: "3/4" },
                            { value: "83%", label: "5/6" },
                            { value: "100%", label: "1" },
                        ]}
                    />
                </Field>
                <Field label="Ancho mínimo">
                    <Select
                        value={String(d.minWidth ?? "512px")}
                        onChange={(v) => onUpdate({ minWidth: String(v) })}
                        options={[
                            { value: "320px", label: "320px" },
                            { value: "384px", label: "384px" },
                            { value: "512px", label: "512px" },
                            { value: "640px", label: "640px" },
                            { value: "768px", label: "768px" },
                            { value: "1024px", label: "1024px" },
                        ]}
                    />
                </Field>

                {/* ✅ input hidden (acá va) */}
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUpload(f);
                        // permitir volver a elegir el mismo archivo
                        if (fileRef.current) fileRef.current.value = "";
                    }}
                />

                <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">Imágenes</div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="text-xs px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                            title="Subir imagen a Cloudinary"
                        >
                            {uploading ? "Subiendo..." : "+ Subir"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setPickerOpen(true)}
                            disabled={uploading}
                            className="text-xs px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                        >
                            + Elegir imagen
                        </button>
                    </div>
                </div>

                {uploadError ? <div className="text-xs text-red-300">{uploadError}</div> : null}

                {/* lista */}
                <div className="flex flex-col gap-2">
                    {images.map((row: any, i: number) => {
                        const url = mediaMap?.[Number(row.mediaId)]?.url ?? "";

                        return (
                            <div key={`${row.mediaId}-${i}`} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                                <div className="flex justify-between gap-2">
                                    <div className="text-xs text-slate-400">
                                        Imagen {i + 1}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="text-xs text-red-300 hover:text-red-200"
                                    >
                                        Quitar
                                    </button>
                                </div>

                                {/* ✅ preview */}
                                {url ? (
                                    <div className="mt-2">
                                        <img
                                            src={url}
                                            alt={row.alt ?? ""}
                                            className="w-full max-h-24 object-contain rounded-lg border border-slate-800"
                                            loading="lazy"
                                        />
                                    </div>
                                ) : (
                                    <div className="mt-2 text-xs text-slate-500">
                                        (sin preview todavía)
                                    </div>
                                )}

                                {/* alt override opcional */}
                                <div className="mt-2">
                                    <Field label="Alt (opcional)">
                                        <Input value={row.alt ?? ""} onChange={(v) => updateImage(i, { alt: v })} />
                                    </Field>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <MediaPicker
                    open={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    onPick={(img) => addPicked(img)}
                />
            </div>
        );
    }

    if (section.kind === "productive") {
        const d = section.data;
        const items = d.items ?? [];

        const [loading, setLoading] = React.useState(false);
        const [loadError, setLoadError] = React.useState<string | null>(null);
        const [listings, setListings] = React.useState<ListingPickItem[]>([]);

        // cargar listings cuando cambia type
        React.useEffect(() => {
            let cancelled = false;
            setLoadError(null);
            setLoading(true);

            fetchStudioListings(d.type)
                .then((it) => {
                    if (cancelled) return;
                    setListings(it);
                })
                .catch((e: any) => {
                    if (cancelled) return;
                    setListings([]);
                    setLoadError(e?.message || "Error cargando listings.");
                })
                .finally(() => {
                    if (cancelled) return;
                    setLoading(false);
                });

            return () => {
                cancelled = true;
            };
        }, [d.type]);

        function updateItem(i: number, patch: any) {
            const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
            onUpdate({ items: next });
        }

        function addItem() {
            onUpdate({ items: [...items, { title: "Nuevo item", listingId: 0, text: "" }] });
        }

        function removeItem(i: number) {
            onUpdate({ items: items.filter((_, idx) => idx !== i) });
        }

        function pickTitleFallback(listingId: number) {
            const it = listings.find((x) => x.id === listingId);
            return it?.title ?? "";
        }

        return (
            <div className="flex flex-col gap-3">
                <Field label="Título (opcional)">
                    <Input value={d.title ?? ""} onChange={(v) => onUpdate({ title: v })} />
                </Field>

                <Field label="Tipo">
                    <Select
                        value={d.type}
                        onChange={(v) => onUpdate({ type: v as "product" | "service" })}
                        options={[
                            { value: "product", label: "Producto" },
                            { value: "service", label: "Servicio" },
                        ]}
                    />
                </Field>

                <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                        Items {loading ? "(cargando...)" : ""}
                    </div>
                    <button
                        type="button"
                        onClick={addItem}
                        className="text-xs px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800"
                    >
                        + Agregar
                    </button>
                </div>

                {loadError ? <div className="text-xs text-red-300">{loadError}</div> : null}

                <div className="flex flex-col gap-2">
                    {items.map((it, i) => {
                        const selected = listings.find((x) => x.id === Number(it.listingId)) ?? null;

                        return (
                            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                                <div className="flex justify-between gap-2">
                                    <div className="text-xs text-slate-400">Item {i + 1}</div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(i)}
                                        className="text-xs text-red-300 hover:text-red-200"
                                    >
                                        Eliminar
                                    </button>
                                </div>

                                {/* selector + preview */}
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3">
                                    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center min-h-[92px]">
                                        {selected?.thumbUrl ? (
                                            <img
                                                src={selected.thumbUrl}
                                                alt=""
                                                className="w-full h-[92px] object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="text-[11px] text-slate-500 px-2 text-center">
                                                {selected ? "Sin imagen" : "Sin selección"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Field label="Listing">
                                            <select
                                                value={String(it.listingId ?? 0)}
                                                onChange={(e) => {
                                                    const id = Number(e.target.value) || 0;
                                                    // si no tiene title, autocompleta con el título del listing (opcional)
                                                    const nextTitle = (it.title?.trim() ? it.title : pickTitleFallback(id));
                                                    updateItem(i, { listingId: id, title: nextTitle });
                                                }}
                                                className="h-10 rounded-xl bg-slate-900 border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
                                                disabled={loading}
                                            >
                                                <option value="0">— Elegí un listing —</option>
                                                {listings.map((x) => (
                                                    <option key={x.id} value={String(x.id)}>
                                                        #{x.id} · {x.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>

                                        <Field label="Título (override opcional)">
                                            <Input value={it.title ?? ""} onChange={(v) => updateItem(i, { title: v })} />
                                        </Field>

                                        <Field label="Texto (opcional)">
                                            <Input value={it.text ?? ""} onChange={(v) => updateItem(i, { text: v })} />
                                        </Field>

                                        {selected ? (
                                            <div className="text-[11px] text-slate-500 truncate">
                                                vis:{selected.visibility} · active:{selected.active}
                                                {selected.description?.trim() ? ` · ${selected.description}` : ""}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }


    if (section.kind === "cta") {
        const d = section.data;
        return (
            <div className="flex flex-col gap-2">
                <Field label="Título">
                    <Input value={d.title} onChange={(v) => onUpdate({ title: v })} />
                </Field>
                <Field label="Texto (opcional)">
                    <Input value={d.text ?? ""} onChange={(v) => onUpdate({ text: v })} />
                </Field>
                <Field label="Texto del botón (opcional)">
                    <Input value={d.buttonText ?? ""} onChange={(v) => onUpdate({ buttonText: v })} />
                </Field>
                <Field label="Link (opcional)">
                    <Input value={d.href ?? ""} onChange={(v) => onUpdate({ href: v })} />
                </Field>
            </div>
        );
    }

    return null;

}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="text-xs text-slate-400">{label}</div>
            {children}
        </div>
    );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 rounded-xl bg-slate-900 border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
        />
    );
}

function Textarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-600 resize-none"
        />
    );
}

function Select({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 rounded-xl bg-slate-900 border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}
