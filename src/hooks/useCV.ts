// src/hooks/useCV.ts
import { useEffect, useState } from "react";
import type { Curriculum, CVSection, CVStyleConfig, HeaderImageMeta, CVThemeColor } from "@/types/cv";
import { coerceThemeColor } from "@/types/cv";
import { yyyyMmDdFromDate } from "@/lib/zod/dates";

import {
    isExperienceSection,
    isEducationSection,
    isSkillsSection,
    isProfileSection,
    isCustomSection,
    isLanguagesSection,
    isProjectsSection,
} from "@/types/cvGuards";

/* =========================================================
   Helpers
========================================================= */

function normalizeOptional(v: any): string | undefined {
    if (v === null || v === undefined) return undefined;
    if (typeof v !== "string") return String(v);
    const t = v.trim();
    return t.length ? t : undefined;
}

function normalizeStyleConfig(raw: any): CVStyleConfig | null {
    if (!raw || typeof raw !== "object") return null;

    const base = raw as any;
    const themeColor = coerceThemeColor(base?.theme?.color);

    return {
        ...base,
        theme: {
            ...(base?.theme ?? {}),
            color: themeColor as CVThemeColor,
        },
    } as CVStyleConfig;
}

function normalizeHeaderImageMeta(input: any): HeaderImageMeta {
    const obj = input && typeof input === "object" ? (input as any) : {};
    const url = typeof obj.url === "string" && obj.url.trim().length ? obj.url.trim() : null;
    const publicId = typeof obj.publicId === "string" && obj.publicId.trim().length ? obj.publicId.trim() : null;
    const show = Boolean(obj.show ?? false);
    return { url, publicId, show };
}

/**
 * Normaliza *cada* sección para asegurarnos que el shape sea consistente.
 */
function normalizeSections(sections: CVSection[] | undefined): CVSection[] {
    if (!Array.isArray(sections)) return [];

    return sections.map((section) => {
        /* ---------------- experience (array) ---------------- */
        if (isExperienceSection(section)) {
            const raw = section.data as any;

            if (Array.isArray(raw)) {
                return {
                    ...section,
                    data: raw.map((it: any) => ({
                        id: it?.id ?? crypto.randomUUID(),
                        company: it?.company ?? "",
                        role: it?.role ?? "",
                        startDate: it?.startDate ?? "",
                        endDate: normalizeOptional(it?.endDate),
                        description: it?.description ?? "",
                        items: Array.isArray(it?.items) ? it.items : [],
                    })),
                };
            }

            return {
                ...section,
                data: [
                    {
                        id: crypto.randomUUID(),
                        company: raw?.company ?? "",
                        role: raw?.role ?? "",
                        startDate: raw?.startDate ?? "",
                        endDate: normalizeOptional(raw?.endDate),
                        description: raw?.description ?? "",
                        items: Array.isArray(raw?.items) ? raw.items : [],
                    },
                ],
            };
        }

        /* ---------------- education ---------------- */
        if (isEducationSection(section)) {
            const raw = section.data as any;

            if (Array.isArray(raw)) {
                return {
                    ...section,
                    data: raw.map((it: any) => ({
                        id: it?.id ?? crypto.randomUUID(),
                        institution: it?.institution ?? "",
                        degree: it?.degree ?? "",
                        startDate: it?.startDate ?? "",
                        endDate: normalizeOptional(it?.endDate),
                        description: it?.description ?? "",
                    })),
                };
            }

            return {
                ...section,
                data: [
                    {
                        id: crypto.randomUUID(),
                        institution: raw?.institution ?? "",
                        degree: raw?.degree ?? "",
                        startDate: raw?.startDate ?? "",
                        endDate: normalizeOptional(raw?.endDate),
                        description: raw?.description ?? "",
                    },
                ],
            };
        }

        /* ---------------- skills ---------------- */
        if (isSkillsSection(section)) {
            return {
                ...section,
                data: Array.isArray(section.data)
                    ? section.data.map((s: any) => ({
                        id: s?.id ?? crypto.randomUUID(),
                        name: s?.name ?? "",
                        level: s?.level ?? "basic",
                    }))
                    : [],
            };
        }

        /* ---------------- profile ---------------- */
        if (isProfileSection(section)) {
            const p: any = section.data ?? {};

            return {
                ...section,
                data: {
                    fullName: p.fullName ?? "",
                    headline: normalizeOptional(p.headline),

                    address: normalizeOptional(p.address),
                    postalCode: normalizeOptional(p.postalCode),
                    city: normalizeOptional(p.city),

                    birthPlace: normalizeOptional(p.birthPlace),
                    nationality: normalizeOptional(p.nationality),
                    gender: p.gender ?? undefined,
                    maritalStatus: p.maritalStatus ?? undefined,
                    drivingLicense: normalizeOptional(p.drivingLicense),

                    showBirthDate: Boolean(p.showBirthDate ?? false),
                    showAddress: Boolean(p.showAddress ?? true),
                    showGender: Boolean(p.showGender ?? false),

                    email: normalizeOptional(p.email),
                    phone: normalizeOptional(p.phone),
                    website: normalizeOptional(p.website),

                    linkedin: normalizeOptional(p.linkedin),
                    github: normalizeOptional(p.github),

                    facebook: normalizeOptional(p.facebook),
                    instagram: normalizeOptional(p.instagram),
                    youtube: normalizeOptional(p.youtube),
                    x: normalizeOptional(p.x),
                    discord: normalizeOptional(p.discord),

                    medium: normalizeOptional(p.medium),
                    devto: normalizeOptional(p.devto),
                },
            };
        }

        /* ---------------- custom ---------------- */
        if (isCustomSection(section)) {
            const d: any = section.data ?? {};
            return {
                ...section,
                data: {
                    title: d?.title ?? "Nueva sección",
                    items: Array.isArray(d?.items)
                        ? d.items.map((item: any) => ({
                            id: item?.id ?? crypto.randomUUID(),
                            title: item?.title ?? "",
                            subtitle: item?.subtitle ?? "",
                            description: item?.description ?? "",
                            date: item?.date ?? "",
                            url: item?.url ?? "",
                        }))
                        : [],
                },
            };
        }

        /* ---------------- languages ---------------- */
        if (isLanguagesSection(section)) {
            return {
                ...section,
                data: Array.isArray(section.data)
                    ? section.data.map((l: any) => ({
                        id: l?.id ?? crypto.randomUUID(),
                        code: l?.code ?? "other",
                        name: l?.name ?? "",
                        level: l?.level ?? "basic",
                        certification: l?.certification ?? "",
                    }))
                    : [],
            };
        }

        /* ---------------- projects ---------------- */
        if (isProjectsSection(section)) {
            return {
                ...section,
                data: Array.isArray(section.data)
                    ? section.data.map((p: any) => ({
                        id: p?.id ?? crypto.randomUUID(),
                        name: p?.name ?? "",
                        description: p?.description ?? "",
                        url: p?.url ?? "",
                        startDate: p?.startDate ?? "",
                        endDate: p?.endDate ?? "",
                    }))
                    : [],
            };
        }

        return section;
    });
}

/** Colapsa múltiples experience en 1 */
function mergeExperienceSections(sections: CVSection[]): CVSection[] {
    const expSections = sections.filter((s) => s.type === "experience") as CVSection<"experience">[];

    if (expSections.length <= 1) return sections;

    const mergedItems = expSections
        .flatMap((s) => (Array.isArray(s.data) ? s.data : []))
        .map((it: any) => ({
            ...it,
            id: it?.id ?? crypto.randomUUID(),
            endDate: normalizeOptional(it?.endDate),
            items: Array.isArray(it?.items) ? it.items : [],
        }));

    const seen = new Set<string>();
    const unique = mergedItems.filter((it: any) => {
        if (!it?.id) return true;
        if (seen.has(it.id)) return false;
        seen.add(it.id);
        return true;
    });

    let used = false;

    return sections
        .filter((s) => s.type !== "experience" || !used)
        .map((s) => {
            if (s.type !== "experience") return s;
            used = true;
            return { ...s, data: unique };
        });
}

/** Mantiene profile primero */
function sortSections(sections: CVSection[]): CVSection[] {
    const profile = sections.find((s) => s.type === "profile");
    const rest = sections.filter((s) => s.type !== "profile");
    return profile ? [profile, ...rest] : rest;
}

/** Pipeline único */
function buildSections(sections: CVSection[] | undefined): CVSection[] {
    return sortSections(mergeExperienceSections(normalizeSections(sections)));
}

/** content normalizado: sections + meta.headerImage */
function normalizeContent(rawContent: any) {
    const base = rawContent && typeof rawContent === "object" ? rawContent : {};
    const rawMeta = (base as any).meta && typeof (base as any).meta === "object" ? (base as any).meta : {};
    const headerImage = normalizeHeaderImageMeta(rawMeta?.headerImage);

    return {
        ...(base as any),
        sections: buildSections((base as any)?.sections),
        meta: {
            ...rawMeta,
            headerImage,
        },
    };
}

/** Normaliza CV raw de API a Curriculum (serializable) */
function normalizeCV(raw: any): Curriculum {
    const contentNormalized = normalizeContent(raw?.content);

    const bd = raw?.birthDate;
    const birthDate =
        typeof bd === "string"
            ? (bd.trim().length ? bd.trim() : null)
            : bd
                ? yyyyMmDdFromDate(new Date(bd))
                : null;

    return {
        id: raw?.id ?? null,
        userId: raw?.userId ?? null,
        title: raw?.title || "Mi CV",
        summary: raw?.summary ?? "",
        birthDate,

        content: {
            ...contentNormalized,
            meta: {
                ...contentNormalized.meta,
                headerImage: normalizeHeaderImageMeta(contentNormalized?.meta?.headerImage),
            },
        },

        styleConfig: normalizeStyleConfig(raw?.styleConfig),

        isPublic: Boolean(raw?.isPublic ?? false),

        createdAt:
            typeof raw?.createdAt === "string"
                ? raw.createdAt
                : raw?.createdAt
                    ? new Date(raw.createdAt).toISOString()
                    : new Date().toISOString(),

        updatedAt:
            typeof raw?.updatedAt === "string"
                ? raw.updatedAt
                : raw?.updatedAt
                    ? new Date(raw.updatedAt).toISOString()
                    : new Date().toISOString(),
    } as Curriculum;
}

/* =========================================================
   Hook
========================================================= */

export function useCV(cvId: number | null) {
    const [cv, setCV] = useState<Curriculum | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (cvId === null) {
            const content = normalizeContent({
                sections: [
                    {
                        id: crypto.randomUUID(),
                        type: "profile",
                        data: { fullName: "" },
                    },
                ],
                meta: { headerImage: { url: null, publicId: null, show: false } },
            });

            setCV({
                id: null,
                userId: null,
                title: "Nuevo CV",
                summary: "",
                birthDate: null,
                content,
                styleConfig: normalizeStyleConfig({
                    theme: { color: "slate" },
                    template: "classic",
                    showDocTitle: true,
                }),
                isPublic: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as Curriculum);

            setLoading(false);
            return;
        }

        setLoading(true);
        fetch(`/api/cv/${cvId}`, { cache: "no-store" })
            .then((res) => res.json())
            .then((data) => {
                const normalized = normalizeCV(data?.cv);
                setCV(normalized);
                setLoading(false);
            })
            .catch(() => {
                setCV(null);
                setLoading(false);
            });
    }, [cvId]);

    const save = async (updated: Curriculum) => {
        const sections = buildSections(updated.content?.sections);

        const normalizeTitleForDb = (title: unknown) => {
            const t = typeof title === "string" ? title.trim() : "";
            if (!t || t === "Nuevo CV") return "Curriculum Vitae";
            return t;
        };

        const prevMeta = updated.content?.meta ?? {};
        const headerImage = normalizeHeaderImageMeta(prevMeta?.headerImage);

        const isNew = updated.id == null;

        const payload = {
            title: normalizeTitleForDb(updated.title),
            summary: updated.summary ?? "",
            content: {
                ...(updated as any).content,
                sections,
                meta: {
                    ...prevMeta,
                    headerImage,
                },
            },
            styleConfig: normalizeStyleConfig(updated.styleConfig) ?? null,
            birthDate: updated.birthDate ?? null,

            // ✅ mandar SIEMPRE boolean para que el toggle funcione bien
            isPublic: Boolean(updated.isPublic),
        };

        const res = await fetch(isNew ? "/api/cv" : `/api/cv/${updated.id}`, {
            method: isNew ? "POST" : "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(data?.error || "Save failed");
        }

        const normalized = normalizeCV(data?.cv);
        setCV(normalized);

        return normalized;
    };

    const remove = async (id: number) => {
        const res = await fetch(`/api/cv/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "No se pudo eliminar el CV");
        return data;
    };

    return { cv, setCV, save, remove, loading };
}


