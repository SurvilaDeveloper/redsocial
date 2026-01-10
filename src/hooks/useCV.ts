// src/hooks/useCV.ts
import { useEffect, useState } from "react";
import type { Curriculum, CVSection } from "@/types/cv";
import type { EditorCV } from "@/types/cvEditor";
import type { CVStyleConfig } from "@/types/cvStyle";
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

import type { CVThemeColor } from "@/types/cvTheme";
import { coerceThemeColor } from "@/types/cvTheme";


/* =========================================================
   Helpers
========================================================= */

function normalizeStyleConfig(raw: any): CVStyleConfig {
    const base = raw && typeof raw === "object" ? raw : {};
    const themeColor = coerceThemeColor(base?.theme?.color);

    return {
        ...base,
        theme: {
            ...(base?.theme ?? {}),
            color: themeColor as CVThemeColor,
        },
    } as CVStyleConfig;
}



function normalizeOptional(v: any): string | undefined {
    if (v === null || v === undefined) return undefined;
    if (typeof v !== "string") return String(v);
    const t = v.trim();
    return t.length ? t : undefined;
}

/** Meta persistida en content (JSON) */
export type HeaderImageMeta = {
    url: string | null;
    publicId: string | null;
    show: boolean;
};

function normalizeHeaderImageMeta(input: any): HeaderImageMeta {
    const url =
        typeof input?.url === "string" && input.url.trim().length
            ? input.url.trim()
            : null;

    const publicId =
        typeof input?.publicId === "string" && input.publicId.trim().length
            ? input.publicId.trim()
            : null;

    const show = Boolean(input?.show ?? false);

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
                        id: it.id ?? crypto.randomUUID(),
                        institution: it.institution ?? "",
                        degree: it.degree ?? "",
                        startDate: it.startDate ?? "",
                        endDate: it.endDate ?? undefined,
                        description: it.description ?? "",
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
                        endDate: raw?.endDate ?? undefined,
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
                    ? section.data.map((s) => ({
                        id: (s as any).id ?? crypto.randomUUID(),
                        name: (s as any).name ?? "",
                        level: (s as any).level ?? "basic",
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
            return {
                ...section,
                data: {
                    title: (section as any).data?.title ?? "Nueva sección",
                    items: Array.isArray((section as any).data?.items)
                        ? (section as any).data.items.map((item: any) => ({
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
    const expSections = sections.filter(
        (s) => s.type === "experience"
    ) as CVSection<"experience">[];

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
    const rawMeta = rawContent?.meta ?? {};
    const headerImage = normalizeHeaderImageMeta(rawMeta?.headerImage);

    return {
        ...rawContent,
        sections: buildSections(rawContent?.sections),
        meta: {
            ...rawMeta,
            headerImage,
        },
    };
}

/** Normaliza CV raw de API a Curriculum */
function normalizeCV(cv: any): Curriculum {
    const contentNormalized = normalizeContent(cv?.content);

    // legacy root (por si existía)
    const legacyUrl =
        typeof cv?.imageUrl === "string" && cv.imageUrl.trim().length
            ? cv.imageUrl.trim()
            : null;

    const legacyPublicId =
        typeof cv?.imagePublicId === "string" && cv.imagePublicId.trim().length
            ? cv.imagePublicId.trim()
            : null;

    const mergedHeaderImage: HeaderImageMeta = {
        url: contentNormalized.meta.headerImage.url ?? legacyUrl,
        publicId: contentNormalized.meta.headerImage.publicId ?? legacyPublicId,
        show: Boolean(contentNormalized.meta.headerImage.show ?? false),
    };

    return {
        id: cv.id,
        userId: cv.userId,
        title: cv.title || "Mi CV",
        summary: cv.summary ?? "",
        content: {
            ...contentNormalized,
            meta: {
                ...contentNormalized.meta,
                headerImage: mergedHeaderImage,
            },
        },
        styleConfig: normalizeStyleConfig(cv.styleConfig),

        isPublic: cv.isPublic ?? false,
        createdAt: cv.createdAt,
        updatedAt: cv.updatedAt,
        birthDate: cv.birthDate ? yyyyMmDdFromDate(new Date(cv.birthDate)) : null,
    } as any;
}

/* =========================================================
   Hook
========================================================= */

type EditorCVWithStyle = EditorCV & {
    styleConfig?: CVStyleConfig | null;
    birthDate?: string | null;

    // ✅ conveniencia (para no romper tu UI actual mientras migrás)
    imageUrl?: string | null;
    imagePublicId?: string | null;
    showProfileImage?: boolean;
};

export function useCV(cvId: number | null) {
    const [cv, setCV] = useState<EditorCVWithStyle | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (cvId === null) {
            const content = normalizeContent({
                sections: [
                    {
                        id: crypto.randomUUID(),
                        type: "profile",
                        data: { fullName: "" },
                    } as any,
                ],
                meta: { headerImage: { url: null, publicId: null, show: false } },
            });

            setCV({
                id: null,
                title: "Nuevo CV",
                summary: "",
                content,
                styleConfig: normalizeStyleConfig({
                    // si más adelante querés defaults de textos, podés meterlos acá
                    theme: { color: "slate" },
                }),

                birthDate: null,

                // convenience
                imageUrl: content.meta.headerImage.url,
                imagePublicId: content.meta.headerImage.publicId,
                showProfileImage: content.meta.headerImage.show,
            });

            setLoading(false);
            return;
        }

        fetch(`/api/cv/${cvId}`)
            .then((res) => res.json())
            .then((data) => {
                const normalized = normalizeCV(data.cv);
                const headerImage = (normalized as any)?.content?.meta?.headerImage as
                    | HeaderImageMeta
                    | undefined;

                setCV({
                    id: normalized.id,
                    title: normalized.title,
                    summary: normalized.summary ?? "",
                    content: normalized.content,
                    styleConfig: (normalized as any).styleConfig ?? null,
                    birthDate: (normalized as any).birthDate ?? null,

                    // convenience
                    imageUrl: headerImage?.url ?? null,
                    imagePublicId: headerImage?.publicId ?? null,
                    showProfileImage: Boolean(headerImage?.show ?? false),
                });

                setLoading(false);
            });
    }, [cvId]);

    const save = async (updated: EditorCVWithStyle) => {
        const sections = buildSections(updated.content?.sections);

        const normalizeTitleForDb = (title: unknown) => {
            const t = typeof title === "string" ? title.trim() : "";
            if (!t || t === "Nuevo CV") return "Curriculum Vitae";
            return t;
        };

        // ✅ META PREVIA (si existía) + derivación desde root convenience
        const prevMeta = (updated as any)?.content?.meta ?? {};

        const headerImageFromContent = normalizeHeaderImageMeta(prevMeta?.headerImage);

        // fallback a lo que tu UI está seteando hoy (root)
        const headerImageFromRoot: HeaderImageMeta = {
            url: typeof updated.imageUrl === "string" ? updated.imageUrl : null,
            publicId: typeof updated.imagePublicId === "string" ? updated.imagePublicId : null,
            show: Boolean(updated.showProfileImage ?? false),
        };

        // prioridad: content.meta.headerImage > root legacy
        const headerImage: HeaderImageMeta = {
            url: headerImageFromContent.url ?? headerImageFromRoot.url,
            publicId: headerImageFromContent.publicId ?? headerImageFromRoot.publicId,
            show: Boolean(headerImageFromContent.show ?? headerImageFromRoot.show),
        };

        const content = {
            ...(updated as any).content,
            sections,
            meta: {
                ...prevMeta,
                headerImage,
            },
        };

        const payload = {
            id: updated.id,
            title: normalizeTitleForDb(updated.title),
            summary: updated.summary ?? "",
            content,
            styleConfig: normalizeStyleConfig(updated.styleConfig),

            birthDate: updated.birthDate ?? null,
            isPublic: (updated as any).isPublic ?? undefined,
        };

        const res = await fetch(
            payload.id === null ? "/api/cv" : `/api/cv/${payload.id}`,
            {
                method: payload.id === null ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        const text = await res.text();
        if (!res.ok) throw new Error("Save failed");

        const data = JSON.parse(text);
        const normalized = normalizeCV(data.cv);

        const headerImage2 = (normalized as any)?.content?.meta?.headerImage as
            | HeaderImageMeta
            | undefined;

        setCV({
            id: normalized.id,
            title: normalized.title,
            summary: normalized.summary ?? "",
            content: normalized.content,
            styleConfig: (normalized as any).styleConfig,
            birthDate: (normalized as any).birthDate ?? null,

            // convenience
            imageUrl: headerImage2?.url ?? null,
            imagePublicId: headerImage2?.publicId ?? null,
            showProfileImage: Boolean(headerImage2?.show ?? false),
        });

        return normalized;
    };

    return { cv, setCV, save, loading };
}
