// src/components/business/editor/BusinessHeaderEditor.tsx
"use client";

import React, {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
} from "react";
import Link from "next/link";
import {
    ExternalLink,
    Image as ImageIcon,
    Trash2,
    Loader2,
    Save,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MediaPicker } from "@/components/media/MediaPicker";
import { uploadSiteImage } from "@/lib/cloudinary-functions";

import { resolveFontFamily, TYPO_OPTIONS } from "@/lib/fonts/families";

import BackToStudioBusiness from "@/components/custom/BackToStudioBusiness";

const FONT_SIZE_OPTIONS = [
    12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 50, 56, 62, 72,
];

const sizeNumberToTextPx = (size: number): string => `${size}px`;

type CloudinaryImageItem = {
    id: number;
    url: string;
    publicId: string;
};

function isTypographyKey(v: unknown): v is (typeof TYPO_OPTIONS)[number] {
    return typeof v === "string" && (TYPO_OPTIONS as readonly string[]).includes(v);
}

function clampTypographyKey(v: unknown, fallback: (typeof TYPO_OPTIONS)[number] = "system") {
    return isTypographyKey(v) ? v : fallback;
}

type Align = "start" | "center" | "end";
function toAlign(v: string): Align {
    return v === "start" || v === "center" || v === "end" ? v : "center";
}

type HeaderOverlayPosition = "left" | "center" | "right" | "none";
function toOverlayPosition(v: unknown): HeaderOverlayPosition {
    return v === "left" || v === "center" || v === "right" || v === "none" ? v : "none";
}

function toOverlayPct(v: unknown): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return 0;
    // pasos de 10: 0,10,...,100
    const stepped = Math.round(n / 10) * 10;
    return Math.max(0, Math.min(100, stepped));
}

function clampText(v: unknown, max: number) {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) return "";
    return s.slice(0, max);
}

function clampHex(v: unknown, fallback = "#ffffff") {
    const s = typeof v === "string" ? v.trim() : "";
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
    return fallback;
}

export function BusinessHeaderEditor({
    businessId,
    businessName,
    businessSlug,
    initialImage,

    // meta
    initialHeadline = "",
    initialCategory = "",

    // theme-ish
    initialSurfaceBgColor,

    initialBgColor,
    initialWidth,
    initialHeaderHeight,
    initialHeaderBgColor,

    // ✅ overlay
    initialHeaderOpacityOverlay,
    initialHeaderOverlayPosition,

    // title
    initialTitleColor,
    initialTitleTypography = "system",
    initialTitleTextSize = 24,
    initialTitleAlignText = "center",

    // headline
    initialHeadlineColor,
    initialHeadlineTypography = "system",
    initialHeadlineTextSize = 16,
    initialHeadlineAlignText = "center",

    // category
    initialCategoryColor,
    initialCategoryTypography = "system",
    initialCategoryTextSize = 12,
    initialCategoryAlignText = "center",

    // bg image
    initialBgPosition,
    initialBgSize,
}: {
    businessId: number;
    businessName: string;
    businessSlug: string;
    initialImage: CloudinaryImageItem | null;

    initialHeadline?: string;
    initialCategory?: string;

    initialSurfaceBgColor?: string;

    initialBgColor?: string;
    initialWidth?: string;

    initialHeaderHeight?: string;
    initialHeaderBgColor?: string;

    // ✅ overlay
    initialHeaderOpacityOverlay?: number; // 0..100
    initialHeaderOverlayPosition?: HeaderOverlayPosition;

    initialTitleColor?: string;
    initialTitleTypography: string;
    initialTitleTextSize: number;
    initialTitleAlignText: string;

    initialHeadlineColor?: string;
    initialHeadlineTypography?: string;
    initialHeadlineTextSize?: number;
    initialHeadlineAlignText?: string;

    initialCategoryColor?: string;
    initialCategoryTypography?: string;
    initialCategoryTextSize?: number;
    initialCategoryAlignText?: string;

    initialBgPosition?: string;
    initialBgSize?: string;
}) {
    const [openPicker, setOpenPicker] = useState(false);

    // header bg image
    const [img, setImg] = useState<CloudinaryImageItem | null>(initialImage);

    // meta fields
    const [name, setName] = useState(businessName);
    const [headline, setHeadline] = useState(initialHeadline);
    const [category, setCategory] = useState(initialCategory);

    // page bg + layout
    const [surfaceBgColor, setSurfaceBgColor] = useState(initialSurfaceBgColor ?? "#000000");

    const [bgColor, setBgColor] = useState(initialBgColor ?? "#000000");
    const [width, setWidth] = useState(initialWidth ?? "xl");
    const [widthState, setWidthState] = useState("83%");

    // header box
    const [headerHeight, setHeaderHeight] = useState(initialHeaderHeight ?? "md");
    const [headerHeightState, setHeaderHeightState] = useState("170px");
    const [headerBgColor, setHeaderBgColor] = useState(initialHeaderBgColor ?? "#000000");

    // bg img options
    const [bgPosition, setBgPosition] = useState(initialBgPosition ?? "center");
    const [bgSize, setBgSize] = useState(initialBgSize ?? "cover");

    // ✅ overlay
    const [headerOpacityOverlay, setHeaderOpacityOverlay] = useState<number>(
        toOverlayPct(initialHeaderOpacityOverlay ?? 0)
    );
    const [headerOverlayPosition, setHeaderOverlayPosition] = useState<HeaderOverlayPosition>(
        toOverlayPosition(initialHeaderOverlayPosition ?? "none")
    );

    const [titleTypography, setTitleTypography] = useState(clampTypographyKey(initialTitleTypography, "system"));
    const [headlineTypography, setHeadlineTypography] = useState(clampTypographyKey(initialHeadlineTypography, "system"));
    const [categoryTypography, setCategoryTypography] = useState(clampTypographyKey(initialCategoryTypography, "system"));


    // title style
    const [titleColor, setTitleColor] = useState(clampHex(initialTitleColor ?? "#ffffff", "#ffffff"));
    //const [titleTypography, setTitleTypography] = useState(initialTitleTypography ?? "system");
    const [titleTypoFamily, setTitleTypoFamily] = useState("system");
    const [titleTextSize, setTitleTextSize] = useState<number>(initialTitleTextSize ?? 24);
    const [titleTextSizeState, setTitleTextSizeState] = useState(sizeNumberToTextPx(initialTitleTextSize ?? 24));
    const [titleAlignText, setTitleAlignText] = useState<Align>(toAlign(initialTitleAlignText ?? "center"));

    // headline style
    const [headlineColor, setHeadlineColor] = useState(clampHex(initialHeadlineColor ?? "#d1d5db", "#d1d5db"));
    //const [headlineTypography, setHeadlineTypography] = useState(initialHeadlineTypography ?? "system");
    const [headlineTypoFamily, setHeadlineTypoFamily] = useState("system");
    const [headlineTextSize, setHeadlineTextSize] = useState<number>(initialHeadlineTextSize ?? 16);
    const [headlineTextSizeState, setHeadlineTextSizeState] = useState(sizeNumberToTextPx(initialHeadlineTextSize ?? 16));
    const [headlineAlignText, setHeadlineAlignText] = useState<Align>(toAlign(initialHeadlineAlignText ?? "center"));

    // category style
    const [categoryColor, setCategoryColor] = useState(clampHex(initialCategoryColor ?? "#9ca3af", "#9ca3af"));
    //const [categoryTypography, setCategoryTypography] = useState(initialCategoryTypography ?? "system");
    const [categoryTypoFamily, setCategoryTypoFamily] = useState("system");
    const [categoryTextSize, setCategoryTextSize] = useState<number>(initialCategoryTextSize ?? 12);
    const [categoryTextSizeState, setCategoryTextSizeState] = useState(sizeNumberToTextPx(initialCategoryTextSize ?? 12));
    const [categoryAlignText, setCategoryAlignText] = useState<Align>(toAlign(initialCategoryAlignText ?? "center"));

    const [pendingImg, startImg] = useTransition();
    const [pendingMeta, startMeta] = useTransition();

    const [statusImg, setStatusImg] = useState<null | { ok: boolean; msg: string }>(null);
    const [statusMeta, setStatusMeta] = useState<null | { ok: boolean; msg: string }>(null);

    const [openPreview, setOpenPreview] = useState(false);

    const fileRef = useRef<HTMLInputElement | null>(null);

    const publicHref = useMemo(() => `/b/${businessSlug}`, [businessSlug]);

    const anyPending = pendingImg || pendingMeta;

    // ✅ Preview height -> empujar editor hacia abajo cuando el preview está abierto
    const previewWrapRef = useRef<HTMLDivElement | null>(null);
    const [previewH, setPreviewH] = useState(0);

    useLayoutEffect(() => {
        if (!openPreview) {
            setPreviewH(0);
            return;
        }

        const el = previewWrapRef.current;
        if (!el) return;

        const measure = () => setPreviewH(el.offsetHeight || 0);
        measure();

        const ro = new ResizeObserver(() => measure());
        ro.observe(el);

        window.addEventListener("resize", measure);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, [openPreview]);

    // width mapping
    useEffect(() => {
        switch (width) {
            case "full":
                setWidthState("100%");
                break;
            case "xl":
                setWidthState("83%");
                break;
            case "lg":
                setWidthState("75%");
                break;
            case "md":
                setWidthState("66%");
                break;
            case "sm":
                setWidthState("50%");
                break;
            default:
                setWidthState("83%");
        }
    }, [width]);

    // header height mapping
    useEffect(() => {
        switch (headerHeight) {
            case "full":
                setHeaderHeightState("320px");
                break;
            case "xl":
                setHeaderHeightState("270px");
                break;
            case "lg":
                setHeaderHeightState("220px");
                break;
            case "md":
                setHeaderHeightState("170px");
                break;
            case "sm":
                setHeaderHeightState("120px");
                break;
            default:
                setHeaderHeightState("170px");
        }
    }, [headerHeight]);

    // font families
    useEffect(() => setTitleTypoFamily(resolveFontFamily(titleTypography)), [titleTypography]);
    useEffect(() => setHeadlineTypoFamily(resolveFontFamily(headlineTypography)), [headlineTypography]);
    useEffect(() => setCategoryTypoFamily(resolveFontFamily(categoryTypography)), [categoryTypography]);


    async function patchHeaderBgImageId(nextId: number | null) {
        setStatusImg(null);

        startImg(async () => {
            try {
                const res = await fetch(`/api/studio/business/${businessId}/header-bg`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ headerBgImageId: nextId }),
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setStatusImg({ ok: false, msg: data?.error || "No se pudo guardar." });
                    return;
                }

                const serverImg = data?.business?.headerBgImage ?? null;
                setImg(serverImg ? { id: serverImg.id, url: serverImg.url, publicId: serverImg.publicId } : null);

                setStatusImg({ ok: true, msg: "Guardado ✅" });
            } catch {
                setStatusImg({ ok: false, msg: "Error de red." });
            }
        });
    }

    async function uploadNewHeaderImage(file: File) {
        setStatusImg(null);

        startImg(async () => {
            try {
                const up = await uploadSiteImage(file);

                const res = await fetch(`/api/studio/business/${businessId}/header-bg`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uploaded: { url: up.url, publicId: up.publicId } }),
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setStatusImg({ ok: false, msg: data?.error || "No se pudo guardar." });
                    return;
                }

                const serverImg = data?.business?.headerBgImage ?? null;
                setImg(serverImg ? { id: serverImg.id, url: serverImg.url, publicId: serverImg.publicId } : null);

                setStatusImg({ ok: true, msg: "Imagen subida ✅" });
            } catch (e: any) {
                setStatusImg({ ok: false, msg: e?.message || "Error subiendo imagen." });
            } finally {
                if (fileRef.current) fileRef.current.value = "";
            }
        });
    }

    async function saveBusinessMeta() {
        setStatusMeta(null);

        const payload = {
            // meta
            name: clampText(name, 100),
            headline: clampText(headline, 140),
            category: clampText(category, 80),

            // layout
            surfaceBgColor,
            bgColor,
            width,
            headerHeight,
            headerBgColor,
            headerBgSize: bgSize,
            headerBgPosition: bgPosition,

            // ✅ overlay
            headerOpacityOverlay,
            headerOverlayPosition,

            // title
            titleColor,
            titleTypography,
            titleTextSize,
            titleAlignText,

            // headline style
            headlineColor,
            headlineTypography,
            headlineTextSize,
            headlineAlignText,

            // category style
            categoryColor,
            categoryTypography,
            categoryTextSize,
            categoryAlignText,
        };

        if (!payload.name) {
            setStatusMeta({ ok: false, msg: "El nombre es requerido." });
            return;
        }

        startMeta(async () => {
            try {
                const res = await fetch(`/api/studio/business/${businessId}/meta`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setStatusMeta({ ok: false, msg: data?.error || "No se pudo guardar." });
                    return;
                }

                setStatusMeta({ ok: true, msg: "Datos guardados ✅" });
            } catch {
                setStatusMeta({ ok: false, msg: "Error de red." });
            }
        });
    }

    return (
        <div className="relative min-h-dvh bg-slate-950 text-slate-100 rounded-2xl">
            {/* ✅ PREVIEW OVERLAY ARRIBA (no tapa el editor porque empujamos con paddingTop) */}
            <div
                className={cn(
                    "fixed left-0 right-0 z-50 w-[calc(100vw-14px)]",
                    "top-12",
                    !openPreview && "pointer-events-none"
                )}
            >
                <div
                    ref={previewWrapRef}
                    className={cn("w-screen", openPreview ? "flex flex-row items-center justify-center w-full" : "hidden")}
                    style={{ backgroundColor: surfaceBgColor }}
                >
                    <div className="flex flex-row items-center justify-center w-full">
                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                className="absolute top-4 right-4 rounded-lg bg-slate-900/70 px-3 py-1 text-xs hover:bg-slate-800"
                                onClick={() => setOpenPreview(false)}
                            >
                                Cerrar preview
                            </button>
                        </div>

                        <div className="flex flex-row items-center justify-center w-full">
                            <div
                                style={{
                                    backgroundColor: bgColor,
                                    width: widthState,
                                }}
                            >
                                <Card className="p-4 w-full border border-slate-700">
                                    <div
                                        className="overflow-hidden"
                                        style={{
                                            height: headerHeightState,
                                            backgroundColor: headerBgColor,
                                            backgroundImage: img?.url ? `url(${img.url})` : undefined,
                                            backgroundSize: bgSize,
                                            backgroundPosition: bgPosition,
                                            backgroundRepeat: "no-repeat",
                                        }}
                                    >
                                        <div className="relative p-6 flex flex-col gap-2 h-full">
                                            {/* ✅ Overlay (según criterio final) */}
                                            {img?.url && headerOpacityOverlay > 0 && (
                                                <div
                                                    className="absolute inset-0 pointer-events-none"
                                                    style={{
                                                        opacity: headerOpacityOverlay / 100,
                                                        backgroundColor:
                                                            headerOverlayPosition === "none" ? "#000" : undefined,
                                                        backgroundImage:
                                                            headerOverlayPosition === "left"
                                                                ? "linear-gradient(to right, #000 0%, #000 55%, transparent 100%)"
                                                                : headerOverlayPosition === "center"
                                                                    ? "linear-gradient(to right, transparent 0%, #000 50%, transparent 100%)"
                                                                    : headerOverlayPosition === "right"
                                                                        ? "linear-gradient(to right, transparent 0%, #000 45%, #000 100%)"
                                                                        : undefined,
                                                    }}
                                                />
                                            )}

                                            <div className="relative z-10 flex flex-col gap-2 h-full">
                                                {/* Title */}
                                                <div
                                                    className="flex w-full font-semibold"
                                                    style={{
                                                        color: titleColor,
                                                        fontFamily: titleTypoFamily,
                                                        fontSize: titleTextSizeState,
                                                        justifyContent: titleAlignText,
                                                    }}
                                                >
                                                    {name}
                                                </div>

                                                {/* Headline */}
                                                {headline ? (
                                                    <div
                                                        className="flex w-full"
                                                        style={{
                                                            color: headlineColor,
                                                            fontFamily: headlineTypoFamily,
                                                            fontSize: headlineTextSizeState,
                                                            justifyContent: headlineAlignText,
                                                        }}
                                                    >
                                                        {headline}
                                                    </div>
                                                ) : null}

                                                {/* Category */}
                                                {category ? (
                                                    <div
                                                        className="flex w-full"
                                                        style={{
                                                            color: categoryColor,
                                                            fontFamily: categoryTypoFamily,
                                                            fontSize: categoryTextSizeState,
                                                            justifyContent: categoryAlignText,
                                                        }}
                                                    >
                                                        {category}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ HEADER BAR */}
            <div className="border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl">
                <div className="mx-auto w-full max-w-4xl px-3 py-6">
                    <div className="text-xl font-semibold">Header</div>
                    <div className="text-sm text-slate-400 mt-1">
                        Negocio: <span className="text-slate-200">{businessName}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <BackToStudioBusiness label="Volver" />

                        <button
                            type="button"
                            disabled={anyPending}
                            onClick={() => setOpenPicker(true)}
                            className={cn(
                                "inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800",
                                anyPending && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            {pendingImg ? (
                                <Loader2 size={16} className="mr-2 animate-spin" />
                            ) : (
                                <ImageIcon size={16} className="mr-2 opacity-80" />
                            )}
                            Elegir imagen
                        </button>

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.currentTarget.value = "";
                                if (f) uploadNewHeaderImage(f);
                            }}
                        />

                        <button
                            type="button"
                            disabled={anyPending}
                            onClick={() => fileRef.current?.click()}
                            className={cn(
                                "inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800",
                                anyPending && "opacity-60 cursor-not-allowed"
                            )}
                            title="Subir una imagen nueva (Cloudinary)"
                        >
                            {pendingImg ? (
                                <Loader2 size={16} className="mr-2 animate-spin" />
                            ) : (
                                <ImageIcon size={16} className="mr-2 opacity-80" />
                            )}
                            Subir nueva
                        </button>

                        <button
                            type="button"
                            disabled={anyPending || !img}
                            onClick={() => patchHeaderBgImageId(null)}
                            className={cn(
                                "inline-flex items-center px-3 py-2 text-sm rounded-xl border",
                                img
                                    ? "border-red-900/60 bg-red-950/30 text-red-200 hover:bg-red-950/50"
                                    : "border-slate-800 bg-slate-900 text-slate-500 cursor-not-allowed",
                                anyPending && "opacity-60 cursor-not-allowed"
                            )}
                            title="Quitar imagen (vuelve al color del theme)"
                        >
                            <Trash2 size={16} className="mr-2 opacity-80" />
                            Quitar imagen
                        </button>

                        <Link
                            href={publicHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                        >
                            <ExternalLink size={16} className="mr-2 opacity-80" />
                            Ver público
                        </Link>

                        <button
                            type="button"
                            className="inline-flex items-center px-3 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
                            onClick={() => setOpenPreview((p) => !p)}
                        >
                            {openPreview ? "Cerrar preview" : "Abrir preview"}
                        </button>

                        {statusImg && (
                            <span className={cn("text-sm", statusImg.ok ? "text-emerald-300" : "text-red-300")}>
                                {statusImg.msg}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ✅ EDITOR: empujado según altura real del preview */}
            <div
                className="mx-auto w-full max-w-4xl px-3 py-6 flex flex-col gap-4"
                style={{
                    paddingTop: openPreview ? previewH - 240 : 10,
                }}
            >
                <Card className="bg-slate-950 border-slate-800 p-4 rounded-2xl">
                    <div className="text-sm font-semibold">Datos del negocio</div>
                    <div className="text-xs text-slate-400 mt-1">
                        Edita <code>name</code>, <code>headline</code> y <code>category</code> del modelo{" "}
                        <code>Business</code>.
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <label className="text-xs text-slate-400">
                            Name
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                                maxLength={100}
                            />
                        </label>

                        <label className="text-xs text-slate-400">
                            Category
                            <input
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                                maxLength={80}
                            />
                        </label>

                        <label className="text-xs text-slate-400 lg:col-span-2">
                            Headline
                            <input
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                                maxLength={140}
                            />
                        </label>

                        <hr className="lg:col-span-2 border-slate-800" />

                        {/* ✅ SITE BG */}
                        <label className="flex flex-col text-xs text-slate-400 gap-2">
                            Background del sitio
                            <input
                                type="color"
                                value={surfaceBgColor}
                                onChange={(e) => setSurfaceBgColor(e.target.value)}
                                className="h-7 w-10 bg-transparent border-0 p-0"
                            />
                        </label>

                        {/* ✅ BUSINESS BG */}
                        <label className="flex flex-col text-xs text-slate-400 gap-2">
                            Background de la página
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="h-7 w-10 bg-transparent border-0 p-0"
                            />
                        </label>

                        <label className="text-xs text-slate-400">
                            Width de la página
                            <select
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                            >
                                <option value="full">100%</option>
                                <option value="xl">83%</option>
                                <option value="lg">75%</option>
                                <option value="md">66%</option>
                                <option value="sm">50%</option>
                            </select>
                        </label>

                        {/* ✅ HEADER BG */}
                        <label className="flex flex-col text-xs text-slate-400 gap-2">
                            Background del header
                            <input
                                type="color"
                                value={headerBgColor}
                                onChange={(e) => setHeaderBgColor(e.target.value)}
                                className="h-7 w-10 bg-transparent border-0 p-0"
                            />
                        </label>

                        <label className="text-xs text-slate-400">
                            Height del header
                            <select
                                value={headerHeight}
                                onChange={(e) => setHeaderHeight(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                            >
                                <option value="full">320px</option>
                                <option value="xl">270px</option>
                                <option value="lg">220px</option>
                                <option value="md">170px</option>
                                <option value="sm">120px</option>
                            </select>
                        </label>

                        <hr className="lg:col-span-2 border-slate-800" />

                        {/* ✅ OVERLAY */}
                        <div className="lg:col-span-2 text-xs text-slate-300 font-semibold">
                            Overlay (imagen del header)
                        </div>

                        <label className="text-xs text-slate-400">
                            Overlay position
                            <select
                                value={headerOverlayPosition}
                                onChange={(e) => setHeaderOverlayPosition(toOverlayPosition(e.target.value))}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                            >
                                <option value="none">Parejo (sin gradiente)</option>
                                <option value="left">Izquierda</option>
                                <option value="center">Centro</option>
                                <option value="right">Derecha</option>
                            </select>
                        </label>

                        <label className="text-xs text-slate-400">
                            Overlay intensity
                            <select
                                value={headerOpacityOverlay}
                                onChange={(e) => setHeaderOpacityOverlay(toOverlayPct(e.target.value))}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                            >
                                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
                                    <option key={v} value={v}>
                                        {v}%
                                    </option>
                                ))}
                            </select>
                        </label>

                        <hr className="lg:col-span-2 border-slate-800" />

                        {/* ✅ TITLE STYLE */}
                        <div className="lg:col-span-2 text-xs text-slate-300 font-semibold">Título (name)</div>

                        <label className="flex flex-col text-xs text-slate-400 gap-2">
                            Title color
                            <input
                                type="color"
                                value={titleColor}
                                onChange={(e) => setTitleColor(e.target.value)}
                                className="h-7 w-10 bg-transparent border-0 p-0"
                            />
                        </label>
                        <label className="text-xs text-slate-400">
                            Title font family
                            <select
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                style={{ fontFamily: resolveFontFamily(titleTypography) }}
                                value={titleTypography}
                                onChange={(e) => setTitleTypography(clampTypographyKey(e.target.value, "system"))}
                            >
                                {TYPO_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt} style={{ fontFamily: resolveFontFamily(opt) }}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-xs text-slate-400">
                            Title font size
                            <select
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                value={titleTextSize}
                                onChange={(e) => {
                                    const next = Number(e.target.value);
                                    setTitleTextSize(next);
                                    setTitleTextSizeState(sizeNumberToTextPx(next));
                                }}
                            >
                                {FONT_SIZE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}px
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-xs text-slate-400">
                            Title align
                            <select
                                value={titleAlignText}
                                onChange={(e) => setTitleAlignText(toAlign(e.target.value))}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                            >
                                <option value="start">Izquierda</option>
                                <option value="center">Centro</option>
                                <option value="end">Derecha</option>
                            </select>
                        </label>

                        <hr className="lg:col-span-2 border-slate-800" />

                        {/* ✅ HEADLINE STYLE */}
                        <div className="lg:col-span-2 text-xs text-slate-300 font-semibold">Headline</div>

                        <label className="flex flex-col text-xs text-slate-400 gap-2">
                            Headline color
                            <input
                                type="color"
                                value={headlineColor}
                                onChange={(e) => setHeadlineColor(e.target.value)}
                                className="h-7 w-10 bg-transparent border-0 p-0"
                            />
                        </label>
                        <label className="text-xs text-slate-400">
                            Headline font family
                            <select
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                style={{ fontFamily: resolveFontFamily(headlineTypography) }}
                                value={headlineTypography}
                                onChange={(e) => setHeadlineTypography(clampTypographyKey(e.target.value, "system"))}
                            >
                                {TYPO_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt} style={{ fontFamily: resolveFontFamily(opt) }}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-xs text-slate-400">
                            Headline font size
                            <select
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                value={headlineTextSize}
                                onChange={(e) => {
                                    const next = Number(e.target.value);
                                    setHeadlineTextSize(next);
                                    setHeadlineTextSizeState(sizeNumberToTextPx(next));
                                }}
                            >
                                {FONT_SIZE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}px
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-xs text-slate-400">
                            Headline align
                            <select
                                value={headlineAlignText}
                                onChange={(e) => setHeadlineAlignText(toAlign(e.target.value))}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                            >
                                <option value="start">Izquierda</option>
                                <option value="center">Centro</option>
                                <option value="end">Derecha</option>
                            </select>
                        </label>

                        <hr className="lg:col-span-2 border-slate-800" />

                        {/* ✅ CATEGORY STYLE */}
                        <div className="lg:col-span-2 text-xs text-slate-300 font-semibold">Category</div>

                        <label className="flex flex-col text-xs text-slate-400 gap-2">
                            Category color
                            <input
                                type="color"
                                value={categoryColor}
                                onChange={(e) => setCategoryColor(e.target.value)}
                                className="h-7 w-10 bg-transparent border-0 p-0"
                            />
                        </label>
                        <label className="text-xs text-slate-400">
                            Category font family
                            <select
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                style={{ fontFamily: resolveFontFamily(categoryTypography) }}
                                value={categoryTypography}
                                onChange={(e) => setCategoryTypography(clampTypographyKey(e.target.value, "system"))}
                            >
                                {TYPO_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt} style={{ fontFamily: resolveFontFamily(opt) }}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-xs text-slate-400">
                            Category font size
                            <select
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                value={categoryTextSize}
                                onChange={(e) => {
                                    const next = Number(e.target.value);
                                    setCategoryTextSize(next);
                                    setCategoryTextSizeState(sizeNumberToTextPx(next));
                                }}
                            >
                                {FONT_SIZE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}px
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-xs text-slate-400">
                            Category align
                            <select
                                value={categoryAlignText}
                                onChange={(e) => setCategoryAlignText(toAlign(e.target.value))}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                            >
                                <option value="start">Izquierda</option>
                                <option value="center">Centro</option>
                                <option value="end">Derecha</option>
                            </select>
                        </label>

                        <hr className="lg:col-span-2 border-slate-800" />

                        {/* ✅ BG IMAGE OPTIONS */}
                        <label className="text-xs text-slate-400">
                            Background image position
                            <select
                                value={bgPosition}
                                onChange={(e) => setBgPosition(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                            >
                                <option value="left">Izquierda</option>
                                <option value="center">Centro</option>
                                <option value="right">Derecha</option>
                            </select>
                        </label>

                        <label className="text-xs text-slate-400">
                            Background image size
                            <select
                                value={bgSize}
                                onChange={(e) => setBgSize(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                            >
                                <option value="cover">Cubre todo</option>
                                <option value="contain">Se ajusta al contenedor</option>
                            </select>
                        </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={anyPending}
                            onClick={saveBusinessMeta}
                            className={cn(
                                "inline-flex items-center px-3 py-2 text-sm rounded-xl border border-emerald-500/40 bg-emerald-600/15 text-emerald-200 hover:bg-emerald-600/20",
                                anyPending && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            {pendingMeta ? (
                                <Loader2 size={16} className="mr-2 animate-spin" />
                            ) : (
                                <Save size={16} className="mr-2 opacity-80" />
                            )}
                            Guardar datos
                        </button>

                        {statusMeta && (
                            <span className={cn("text-sm", statusMeta.ok ? "text-emerald-300" : "text-red-300")}>
                                {statusMeta.msg}
                            </span>
                        )}
                    </div>
                </Card>
            </div>

            <MediaPicker
                open={openPicker}
                onClose={() => setOpenPicker(false)}
                onPick={(picked) => {
                    setOpenPicker(false);
                    patchHeaderBgImageId(picked.id);
                }}
            />
        </div>
    );
}