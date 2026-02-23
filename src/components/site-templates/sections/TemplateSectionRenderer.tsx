// src/components/site-templates/sections/TemplateSectionRenderer.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { BusinessPageContent, BusinessSection } from "@/types/business-sections";

import { Mail } from "lucide-react";

// ✅ Ajustá este import si tu componente está en otra ruta
import { TemplateContactSection } from "@/components/site-templates/TemplateContactSection";

function safeInt(v: any) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.trunc(n);
}

export function TemplateSectionRenderer({
    sections,
    templateId,
}: {
    sections: BusinessPageContent;
    templateId: string;
}) {
    const list = Array.isArray(sections) ? sections : [];

    return (
        <div className="flex flex-col gap-4">
            {list.map((s) => (
                <SectionView key={(s as any)?.id} section={s as any} templateId={templateId} />
            ))}
        </div>
    );
}

function SectionView({
    section,
    templateId,
}: {
    section: BusinessSection;
    templateId: string;
}) {
    // ✅ CONTACT FORM (Template: preview/fake) — imita BusinessSectionRenderer
    if (section.kind === "contactForm") {
        const title = (section as any)?.data?.title?.trim() || "Contacto";
        const desc =
            (section as any)?.data?.description?.trim() ||
            "Completá el formulario y el dueño del negocio recibirá un email para responderte.";

        // Caso "equivalente" al businessSlug faltante: en templates siempre es demo,
        // pero dejamos un fallback si no hay templateId por cualquier razón.
        if (!templateId) {
            return (
                <Card className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Mail size={16} className="opacity-80" />
                        <span className="font-medium">{title}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{desc}</p>
                    <p className="mt-3 text-xs text-slate-500">(Demo: falta templateId para renderizar la vista previa.)</p>
                </Card>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                {/* Header (imitando el BusinessSectionRenderer: look negro y copy similar) */}
                <Card className="p-5 rounded-2xl"
                    style={{
                        background: "var(--t-co-bgcr)",
                        borderWidth: "var(--t-co-br)" as any,
                        borderStyle: "solid",
                        borderColor: "var(--t-co-bcr)",
                        borderRadius: "var(--t-co-rs)",
                        color: "var(--t-co-lcr)",
                        fontFamily: "var(--t-co-lty)",
                    }}>
                    <div className="flex items-center gap-2">
                        <Mail size={16} className="opacity-80" />
                        <span className="font-medium">{title}</span>
                    </div>
                    <p className="mt-2 text-sm">{desc}</p>
                </Card>

                {/* Form fake/interactivo (no envía nada) */}
                <TemplateContactSection showHint={false} />
            </div>
        );
    }

    if (section.kind === "hero") {
        const { title, subtitle } = (section as any).data;

        return (
            <Card
                className="bg-[var(--t-ho-bgcr)] p-6"
                style={{
                    border: "var(--t-ho-br) solid var(--t-ho-bcr)",
                    borderRadius: "var(--t-ho-rs)",
                }}
            >
                <div
                    className="flex flex-row items-center font-semibold w-full"
                    style={{
                        color: "var(--t-ho-tcr)",
                        fontSize: "var(--t-ho-ttse)",
                        fontFamily: "var(--t-ho-tty)",
                        justifyContent: "var(--t-ho-tatt)",
                    }}
                >
                    {title}
                </div>

                {!!subtitle && (
                    <div
                        className="flex flex-row items-center font-semibold w-full"
                        style={{
                            color: "var(--t-ho-scr)",
                            fontSize: "var(--t-ho-stse)",
                            fontFamily: "var(--t-ho-sty)",
                            justifyContent: "var(--t-ho-satt)",
                        }}
                    >
                        {subtitle}
                    </div>
                )}
            </Card>
        );
    }

    if (section.kind === "text") {
        const { title, body } = (section as any).data;

        return (
            <Card
                className="bg-[var(--t-tx-bgcr)] p-6"
                style={{
                    border: "var(--t-tx-br) solid var(--t-tx-bcr)",
                    borderRadius: "var(--t-tx-rs)",
                }}
            >
                {!!title && (
                    <div
                        className="flex flex-row items-center font-semibold w-full"
                        style={{
                            color: "var(--t-tx-tcr)",
                            fontSize: "var(--t-tx-ttse)",
                            fontFamily: "var(--t-tx-tty)",
                            justifyContent: "var(--t-tx-tatt)",
                        }}
                    >
                        {title}
                    </div>
                )}

                <div
                    className="flex flex-row items-center w-full mt-2 whitespace-pre-wrap"
                    style={{
                        color: "var(--t-tx-bycr)",
                        fontSize: "var(--t-tx-bytse)",
                        fontFamily: "var(--t-tx-byty)",
                        justifyContent: "var(--t-tx-byatt)",
                    }}
                >
                    {body}
                </div>
            </Card>
        );
    }

    if (section.kind === "features") {
        const { title, items, columns } = (section as any).data;
        const cols = columns === 2 ? "lg:grid-cols-2" : columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-1";

        return (
            <Card
                className="bg-[var(--t-fs-bgcr)] p-5"
                style={{
                    border: "var(--t-fs-br) solid var(--t-fs-bcr)",
                    borderRadius: "var(--t-fs-rs)",
                }}
            >
                {!!title && (
                    <div
                        className="flex flex-row items-center font-semibold w-full"
                        style={{
                            color: "var(--t-fs-tcr)",
                            fontSize: "var(--t-fs-ttse)",
                            fontFamily: "var(--t-fs-tty)",
                            justifyContent: "var(--t-fs-tatt)",
                        }}
                    >
                        {title}
                    </div>
                )}

                <div className={cn("mt-3 grid grid-cols-1 gap-2", cols)}>
                    {(items ?? []).map((it: any, idx: number) => (
                        <div
                            key={idx}
                            className="bg-[var(--t-fs-ibgcr)] p-3"
                            style={{
                                border: "var(--t-fs-ibr) solid var(--t-fs-ibcr)",
                                borderRadius: "var(--t-fs-irs)",
                            }}
                        >
                            <div
                                className="flex flex-row items-center font-medium w-full"
                                style={{
                                    color: "var(--t-fs-itcr)",
                                    fontSize: "var(--t-fs-ittse)",
                                    fontFamily: "var(--t-fs-itty)",
                                    justifyContent: "var(--t-fs-itatt)",
                                }}
                            >
                                {it.title}
                            </div>

                            {!!it.text && (
                                <div
                                    className="flex flex-row items-center w-full"
                                    style={{
                                        color: "var(--t-fs-itxcr)",
                                        fontSize: "var(--t-fs-itxtse)",
                                        fontFamily: "var(--t-fs-itxty)",
                                        justifyContent: "var(--t-fs-itxatt)",
                                    }}
                                >
                                    {it.text}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    if (section.kind === "gallery") {
        const { title, images = [], columns = 3, width, minWidth, swiper } = (section as any).data;

        const cols =
            columns === 2
                ? "lg:grid-cols-2"
                : columns === 4
                    ? "lg:grid-cols-4"
                    : columns === 3
                        ? "lg:grid-cols-3"
                        : "lg:grid-cols-1";

        const wid =
            width === "25%"
                ? "lg:w-[25%]"
                : width === "33%"
                    ? "lg:w-[33%]"
                    : width === "50%"
                        ? "lg:w-[50%]"
                        : width === "66%"
                            ? "lg:w-[66%]"
                            : width === "75%"
                                ? "lg:w-[75%]"
                                : width === "83%"
                                    ? "lg:w-[83%]"
                                    : "lg:w-[100%]";

        const mWd =
            minWidth === "1024px"
                ? "lg:min-w-[1024px]"
                : minWidth === "384px"
                    ? "lg:min-w-[384px]"
                    : minWidth === "512px"
                        ? "lg:min-w-[512px]"
                        : minWidth === "640px"
                            ? "lg:min-w-[640px]"
                            : minWidth === "768px"
                                ? "lg:min-w-[768px]"
                                : "lg:min-w-[320px]";

        const useSimpleSwiper = String(swiper) === "true";

        return (
            <Card
                className="bg-[var(--t-gy-bgcr)] p-5 flex flex-col items-center justify-center overflow-hidden"
                style={{
                    border: "var(--t-gy-br) solid var(--t-gy-bcr)",
                    borderRadius: "var(--t-gy-rs)",
                }}
            >
                {!!title && (
                    <div
                        className="flex flex-row items-center font-semibold w-full"
                        style={{
                            color: "var(--t-gy-tcr)",
                            fontSize: "var(--t-gy-ttse)",
                            fontFamily: "var(--t-gy-tty)",
                            justifyContent: "var(--t-gy-tatt)",
                        }}
                    >
                        {title}
                    </div>
                )}

                {useSimpleSwiper ? (
                    <div className="mt-3 w-full overflow-x-auto">
                        <div className="flex flex-row gap-2 min-w-max">
                            {(images ?? []).map((img: any, idx: number) => {
                                const resolvedUrl = (typeof img?.url === "string" && img.url.trim()) || "";
                                if (!resolvedUrl) {
                                    return (
                                        <div
                                            key={idx}
                                            className="h-[150px] w-[150px] rounded-xl border border-slate-800 bg-slate-900"
                                            title="Sin imagen"
                                        />
                                    );
                                }

                                return (
                                    <div
                                        key={idx}
                                        className="overflow-hidden border border-slate-500 bg-[var(--t-gy-cbcr)]"
                                        style={{ borderRadius: "var(--t-gy-crs)" }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={resolvedUrl}
                                            alt={img?.alt ?? ""}
                                            className="h-[150px] w-[150px] object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className={cn("mt-3 grid grid-cols-1 gap-2 justify-center items-center", cols, wid, mWd)}>
                        {(images ?? []).map((img: any, idx: number) => {
                            const resolvedUrl = (typeof img?.url === "string" && img.url.trim()) || "";

                            if (!resolvedUrl) {
                                return (
                                    <div
                                        key={idx}
                                        className="h-32 w-full rounded-xl border border-slate-800 bg-slate-900"
                                        title="Sin imagen"
                                    />
                                );
                            }

                            return (
                                <div
                                    key={idx}
                                    className="overflow-hidden border border-slate-500 bg-[var(--t-gy-cbcr)]"
                                    style={{
                                        border: "var(--t-gy-cbr) solid var(--t-gy-cbrcr)",
                                        borderRadius: "var(--t-gy-crs)",
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={resolvedUrl}
                                        alt={img?.alt ?? ""}
                                        className="w-full aspect-square object-contain"
                                        loading="lazy"
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        );
    }

    if (section.kind === "productive") {
        const { title, type, items } = (section as any).data;

        return (
            <Card
                className="bg-[var(--t-pe-bgcr)] p-5 rounded-2xl"
                style={{
                    border: "var(--t-pe-br) solid var(--t-pe-bcr)",
                    borderRadius: "var(--t-pe-rs)",
                }}
            >
                {!!title && (
                    <div
                        className="font-semibold"
                        style={{
                            color: "var(--t-pe-tcr)",
                            fontFamily: "var(--t-pe-tty)",
                            fontSize: "var(--t-pe-yyse)",
                        }}
                    >
                        {title}
                    </div>
                )}

                <div className="mt-2 text-[11px] text-slate-400">
                    {type === "product" ? "Productos" : "Servicios"} · {(items ?? []).length}
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(items ?? []).map((it: any, idx: number) => {
                        const thumb = (typeof it?.thumbUrl === "string" && it.thumbUrl.trim()) || null;

                        return (
                            <div
                                key={`${it.listingId}-${idx}`}
                                className={cn("block overflow-hidden", "opacity-80 pointer-events-none")}
                                style={{
                                    backgroundColor: "var(--t-pe-cbgcr)",
                                    border: "var(--t-pe-cbr) solid var(--t-pe-cbrcr)",
                                    borderRadius: "var(--t-pe-crs)",
                                }}
                                title="Demo (sin detalle)"
                            >
                                <div className="w-full h-[150px] bg-slate-950 border-b border-slate-800 flex items-center justify-center overflow-hidden">
                                    {thumb ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                        <div className="text-xs text-slate-600">Sin imagen</div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <div
                                        className="text-sm font-semibold truncate"
                                        style={{
                                            color: "var(--t-pe-itcr)",
                                            fontFamily: "var(--t-pe-itty)",
                                            fontSize: "var(--t-pe-itse)",
                                            justifyContent: "var(--t-pe-itatt)",
                                        }}
                                    >
                                        {it.title?.trim() ? it.title : "Sin título"}
                                    </div>

                                    {!!it.text?.trim() && (
                                        <div
                                            className="mt-1 text-xs"
                                            style={{
                                                color: "var(--t-pe-itxcr)",
                                                fontFamily: "var(--t-pe-itxty)",
                                                fontSize: "var(--t-pe-itxtse)",
                                                justifyContent: "var(--t-pe-itxatt)",
                                            }}
                                        >
                                            {it.text}
                                        </div>
                                    )}

                                    <div className="mt-3 text-[11px] text-slate-500">#{safeInt(it.listingId) ?? "—"} · demo</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-3 text-[11px] text-slate-500">
                    Tip: cuando apliques el template a un business real, esta sección puede usar listings reales.
                </div>
            </Card>
        );
    }

    if (section.kind === "cta") {
        const { title, text, buttonText = "Ver más", href } = (section as any).data;

        return (
            <Card
                className="bg-[var(--t-ca-bgcr)] p-5 flex flex-col items-center justify-center"
                style={{
                    border: "var(--t-ca-br) solid var(--t-ca-bcr)",
                    borderRadius: "var(--t-ca-rs)",
                }}
            >
                <div
                    className="flex flex-row items-center font-semibold w-full"
                    style={{
                        color: "var(--t-ca-ticr)",
                        fontSize: "var(--t-ca-titse)",
                        fontFamily: "var(--t-ca-tity)",
                        justifyContent: "var(--t-ca-tiatt)",
                    }}
                >
                    {title}
                </div>

                {!!text && (
                    <div
                        className="flex flex-row items-center font-semibold w-full"
                        style={{
                            color: "var(--t-ca-tcr)",
                            fontSize: "var(--t-ca-ttse)",
                            fontFamily: "var(--t-ca-tty)",
                            justifyContent: "var(--t-ca-tatt)",
                        }}
                    >
                        {text}
                    </div>
                )}

                {!!href && (
                    <div className="flex flex-row w-full" style={{ justifyContent: "var(--t-ca-btan)" }}>
                        <a
                            href={href}
                            className="mt-4 inline-flex px-3 py-2 bg-[var(--t-ca-btbdcr)] hover:bg-[var(--t-ca-btbdcrhv)] text-[var(--t-ca-btcr)]"
                            style={{
                                border: "var(--t-ca-btbr) solid var(--t-ca-btbrcr)",
                                borderRadius: "var(--t-ca-btrs)",
                                fontSize: "var(--t-ca-bttse)",
                                fontFamily: "var(--t-ca-btty)",
                            }}
                        >
                            {buttonText}
                        </a>
                    </div>
                )}
            </Card>
        );
    }

    return null;
}