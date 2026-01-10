// src/components/cv/CVEditor.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCV } from "@/hooks/useCV";
import { CVSection } from "@/types/cv";
import type { CVStyleConfig } from "@/types/cvStyle";
import {
    isEducationSection,
    isExperienceSection,
    isSkillsSection,
    isLanguagesSection,
    isProjectsSection,
    isProfileSection,
    isCustomSection,
} from "@/types/cvGuards";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { EducationSectionEditor } from "@/components/cv/sections/EducationSectionEditor";
import { ExperienceSectionEditor } from "@/components/cv/sections/ExperienceSectionEditor";
import { SkillsSectionEditor } from "./sections/SkillsSectionEditor";
import { LanguagesSectionEditor } from "./sections/LanguagesSectionEditor";
import { ProjectsSectionEditor } from "./sections/ProjectsSectionEditor";
import { ProfileSectionEditor } from "./sections/ProfileSectionEditor";
import { CustomSectionEditor } from "./sections/CustomSectionEditor";

import { CVPreviewModal } from "./CVPreviewModal";
import { CVPreviewSheet } from "./CVPreviewSheet";

import { Save } from "lucide-react";

import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";

import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    useSortable,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

// shadcn alert dialog
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { CVStyleElement, CVTextStyle } from "@/types/cvStyle";
import type { CVTemplateId } from "./renderers/CVRendererSwitch";
import { CVTemplateSelect } from "./styles/CVTemplateSelect";
import { CVFontsMenu } from "./styles/CVFontsMenu";

import { CVThemeSelect } from "./styles/CVThemeSelect";
import { coerceThemeColor } from "@/types/cvTheme";
import type { CVThemeColor } from "@/types/cvTheme";

const FONT_FAMILIES = ["sans-serif", "serif", "monospace", "cursive", "fantasy"] as const;
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px"] as const;

// ✅ Solo keys de texto (NO incluye showDocTitle)
const STYLE_KEYS: CVStyleElement[] = [
    "docTitle",
    "name",
    "headline",
    "summary",
    "title",
    "subtitle",
    "description",
    "date",
    "itemTitle",
    "itemSubtitle",
] as const;

const makeStyle = (
    fontSize: (typeof FONT_SIZES)[number],
    opts?: Partial<Pick<CVTextStyle, "fontFamily" | "color">>
): CVTextStyle => ({
    fontFamily: opts?.fontFamily ?? FONT_FAMILIES[0],
    fontSize,
    color: opts?.color ?? "#000000",
});

// Defaults por rol
const DEFAULTS_BY_KEY: Record<CVStyleElement, CVTextStyle> = {
    docTitle: makeStyle("20px"),
    name: makeStyle("24px"),
    headline: makeStyle("14px", { color: "#374151" }),
    summary: makeStyle("12px", { color: "#374151" }),

    title: makeStyle("14px"),
    subtitle: makeStyle("12px", { color: "#374151" }),
    description: makeStyle("12px"),
    date: makeStyle("12px", { color: "#6B7280" }),

    itemTitle: makeStyle("14px"),
    itemSubtitle: makeStyle("12px", { color: "#374151" }),
};

const DEFAULT_STYLE_CONFIG: CVStyleConfig = {
    ...DEFAULTS_BY_KEY,
    showDocTitle: true,
    template: "classic",
    // ✅ NUEVO: theme defaults
    theme: { color: "slate" as CVThemeColor },
};

// ✅ Retrocompatible (+ theme.color)
function normalizeStyleConfig(value: unknown): CVStyleConfig {
    const fb = DEFAULT_STYLE_CONFIG;

    if (!value || typeof value !== "object") return fb;
    const obj = value as Record<string, any>;

    const out: any = {
        showDocTitle: typeof obj.showDocTitle === "boolean" ? obj.showDocTitle : fb.showDocTitle,
    };

    for (const key of STYLE_KEYS) {
        const v = obj[key];
        const base = DEFAULTS_BY_KEY[key];

        out[key] = {
            fontFamily: typeof v?.fontFamily === "string" ? v.fontFamily : base.fontFamily,
            fontSize: typeof v?.fontSize === "string" ? v.fontSize : base.fontSize,
            color: typeof v?.color === "string" ? v.color : base.color,
        };
    }

    const oldTitle = obj.title;
    if (oldTitle && typeof oldTitle === "object") {
        out.name = { ...out.name, fontFamily: out.name.fontFamily ?? oldTitle.fontFamily, color: out.name.color };
        out.itemTitle = {
            ...out.itemTitle,
            fontFamily: out.itemTitle.fontFamily ?? oldTitle.fontFamily,
            color: out.itemTitle.color,
        };
    }

    out.template = obj.template ? obj.template : "classic";

    // ✅ theme.color: lee de DB si existe, si no slate
    out.theme = {
        ...(obj.theme ?? {}),
        color: coerceThemeColor(obj?.theme?.color),
    };

    return out as CVStyleConfig;
}

// ====== HeaderImage meta helpers (content.meta.headerImage) ======
type HeaderImageMeta = {
    url: string | null;
    publicId: string | null;
    show: boolean;
};

function getHeaderImageMeta(cv: any): HeaderImageMeta {
    const raw = cv?.content?.meta?.headerImage ?? {};
    return {
        url: typeof raw.url === "string" && raw.url.trim().length ? raw.url.trim() : null,
        publicId: typeof raw.publicId === "string" && raw.publicId.trim().length ? raw.publicId.trim() : null,
        show: Boolean(raw.show ?? false),
    };
}

export function CVEditor({ cvId }: { cvId: number | null }) {
    const router = useRouter();
    const { cv, setCV, save, loading } = useCV(cvId);

    const [previewOpen, setPreviewOpen] = useState(false);

    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // AlertDialog (cerrar con cambios)
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);

    // styleConfig (local editable; se persiste con Guardar)
    const [styleConfig, setStyleConfig] = useState<CVStyleConfig>(DEFAULT_STYLE_CONFIG);

    const applyStyleConfig = useCallback((next: CVStyleConfig) => {
        setStyleConfig(next);

        // ✅ importantísimo: mantener cv.styleConfig sincronizado para previews que leen desde cv
        setCV((prev) => (prev ? ({ ...prev, styleConfig: next } as any) : prev));

        setIsDirty(true);
    }, [setCV]);


    useEffect(() => {
        if (!cv) return;
        // eslint-disable-next-line no-console
        console.log("content.meta.headerImage =", (cv as any)?.content?.meta?.headerImage);
    }, [cv]);

    useEffect(() => {
        if (!cv) return;
        const fromDb = (cv as any).styleConfig as unknown;
        setStyleConfig(normalizeStyleConfig(fromDb));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cv?.id]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const hasSection = (type: CVSection["type"]) => cv?.content.sections.some((s) => s.type === type);

    function normalizeHeaderImageMeta(input: any): HeaderImageMeta {
        const url =
            typeof input?.url === "string" && input.url.trim().length ? input.url.trim() : null;

        const publicId =
            typeof input?.publicId === "string" && input.publicId.trim().length ? input.publicId.trim() : null;

        const show = Boolean(input?.show ?? false);

        return { url, publicId, show };
    }

    const updateHeaderImageMeta = useCallback(
        (patch: Partial<HeaderImageMeta>) => {
            setCV((prev) => {
                if (!prev) return prev;

                const prevContent: any = prev.content ?? {};
                const prevMeta: any = prevContent.meta ?? {};
                const current = normalizeHeaderImageMeta(prevMeta.headerImage);

                const next: HeaderImageMeta = { ...current, ...patch };

                setIsDirty(true);

                return {
                    ...prev,
                    content: {
                        ...prevContent,
                        meta: {
                            ...prevMeta,
                            headerImage: next,
                        },
                    },

                    // convenience
                    imageUrl: next.url,
                    imagePublicId: next.publicId,
                    showProfileImage: next.show,
                } as any;
            });
        },
        [setCV]
    );

    /**
     * ✅ Update root + meta en content (sin romper sections)
     */
    const updateRoot = useCallback(
        (
            patch: Partial<Pick<any, "summary" | "birthDate">> & {
                headerImage?:
                | Partial<HeaderImageMeta>
                | ((prev: HeaderImageMeta) => Partial<HeaderImageMeta>);
            } & Record<string, any>
        ) => {
            setCV((prev) => {
                if (!prev) return prev;

                // meta actual
                const prevHeader = getHeaderImageMeta(prev);

                let nextHeader = prevHeader;

                if (patch.headerImage) {
                    const nextPartial =
                        typeof patch.headerImage === "function"
                            ? patch.headerImage(prevHeader)
                            : patch.headerImage;

                    nextHeader = {
                        url:
                            nextPartial.url !== undefined ? (nextPartial.url ?? null) : prevHeader.url,
                        publicId:
                            nextPartial.publicId !== undefined
                                ? (nextPartial.publicId ?? null)
                                : prevHeader.publicId,
                        show:
                            nextPartial.show !== undefined ? Boolean(nextPartial.show) : prevHeader.show,
                    };
                }

                // removemos headerImage del patch root
                const { headerImage, ...rootPatch } = patch;

                setIsDirty(true);

                return {
                    ...prev,
                    ...rootPatch,
                    content: {
                        ...(prev as any).content,
                        meta: {
                            ...((prev as any).content?.meta ?? {}),
                            headerImage: nextHeader,
                        },
                        // ⛔ no tocamos sections acá
                        sections: (prev as any).content?.sections ?? [],
                    },
                };
            });
        },
        [setCV]
    );

    const dirtyLabel = useMemo(() => {
        if (isSaving) return "Guardando…⏳";
        return isDirty ? "Sin guardar🟡" : "Guardado✅";
    }, [isDirty, isSaving]);

    const openCloseFlow = useCallback(() => {
        if (isSaving) return;
        if (!isDirty) {
            router.push("/");
            return;
        }
        setCloseDialogOpen(true);
    }, [isDirty, isSaving, router]);

    const handleSave = useCallback(async () => {
        if (!cv) return;

        setIsSaving(true);
        try {
            const saved = await save({ ...cv, styleConfig } as any);
            setIsDirty(false);

            if (cvId === null) router.replace(`/cv/${saved.id}`);
        } finally {
            setIsSaving(false);
        }
    }, [cv, cvId, router, save, styleConfig]);

    const handleSaveAndClose = useCallback(async () => {
        if (!cv) return;

        setIsSaving(true);
        try {
            await save({ ...cv, styleConfig } as any);
            setIsDirty(false);
            setCloseDialogOpen(false);
            router.push("/");
        } finally {
            setIsSaving(false);
        }
    }, [cv, router, save, styleConfig]);

    const handleCloseWithoutSaving = useCallback(() => {
        if (isSaving) return;
        setCloseDialogOpen(false);
        router.push("/");
    }, [isSaving, router]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        if (active.id === over.id) return;

        setCV((prev) => {
            if (!prev) return prev;

            // Profile fijo arriba: reordenamos solo las "rest"
            const profile = prev.content.sections.find((s) => s.type === "profile");
            const rest = prev.content.sections.filter((s) => s.type !== "profile");

            const oldIndex = rest.findIndex((s) => s.id === active.id);
            const newIndex = rest.findIndex((s) => s.id === over.id);

            if (oldIndex === -1 || newIndex === -1) return prev;

            setIsDirty(true);

            const nextRest = arrayMove(rest, oldIndex, newIndex);

            return {
                ...prev,
                content: {
                    ...(prev as any).content,
                    sections: profile ? [profile, ...nextRest] : nextRest,
                },
            };
        });
    };

    const addSection = (type: CVSection["type"]) => {
        setCV((prev) => {
            if (!prev) return prev;
            if (
                (type === "experience" && hasSection("experience")) ||
                (type === "education" && hasSection("education")) ||
                (type === "skills" && hasSection("skills")) ||
                (type === "languages" && hasSection("languages")) ||
                (type === "projects" && hasSection("projects")) ||
                (type === "profile" && hasSection("profile"))
            )
                return prev;

            setIsDirty(true);

            return {
                ...prev,
                content: {
                    ...(prev as any).content,
                    sections: [...prev.content.sections, createSection(type)],
                },
            };
        });
    };

    const removeSection = useCallback(
        (id: string) => {
            setCV((prev) => {
                if (!prev) return prev;
                setIsDirty(true);
                return {
                    ...prev,
                    content: {
                        ...(prev as any).content,
                        sections: prev.content.sections.filter((s) => s.id !== id),
                    },
                };
            });
        },
        [setCV]
    );

    const updateSection = <T extends CVSection["type"]>(updated: CVSection<T>) => {
        setCV((prev) => {
            if (!prev) return prev;

            setIsDirty(true);

            return {
                ...prev,
                content: {
                    ...(prev as any).content,
                    sections: prev.content.sections.map((s) => (s.id === updated.id ? updated : s)),
                },
            };
        });
    };

    const closePreview = () => setPreviewOpen(false);

    if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
    if (!cv) return <p className="text-sm text-muted-foreground">No encontrado</p>;

    const headerImage = getHeaderImageMeta(cv);
    void headerImage; // (si no lo usás acá, evitás warning)

    const themeColor = coerceThemeColor((styleConfig as any)?.theme?.color);

    return (
        <div className="space-y-4 pt-2">
            {/* ---------- Top bar fixed ---------- */}
            <div className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
                <div className="mx-auto px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                        {/* Left */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative flex flex-row gap-2">
                                <CVFontsMenu
                                    disabled={isSaving}
                                    styleConfig={styleConfig}
                                    styleKeys={STYLE_KEYS}
                                    onChange={(next) => applyStyleConfig(next)}
                                    onDirty={() => setIsDirty(true)} // podés dejarlo, pero ya lo marca applyStyleConfig

                                />

                                <CVTemplateSelect
                                    value={(((styleConfig as any).template ?? "classic") as CVTemplateId)}
                                    onChange={(t) => {
                                        applyStyleConfig(({ ...(styleConfig as any), template: t } as any));
                                    }}
                                />


                                {/* ✅ Theme color select (lives in CVEditor) */}
                                <CVThemeSelect
                                    value={themeColor}
                                    onChange={(next) => {
                                        applyStyleConfig({
                                            ...(styleConfig as any),
                                            theme: {
                                                ...((styleConfig as any).theme ?? {}),
                                                color: next,
                                            },
                                        } as any);
                                    }}
                                />


                                <div className="min-w-0">
                                    <div className="text-xs text-muted-foreground">{dirtyLabel}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="relative flex items-center gap-2">
                            <Button onClick={() => setPreviewOpen(true)} disabled={isSaving} className="lg:hidden">
                                Preview
                            </Button>

                            <Button
                                onClick={handleSave}
                                disabled={!isDirty || isSaving}
                                title={!isDirty ? "No hay cambios para guardar" : "Guardar CV"}
                            >
                                <Save />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={openCloseFlow}
                                disabled={isSaving}
                                title="Cerrar"
                                aria-label="Cerrar"
                            >
                                ✕
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ---------- AlertDialog: cerrar con cambios ---------- */}
            <AlertDialog
                open={closeDialogOpen}
                onOpenChange={(open) => {
                    if (isSaving) return;
                    setCloseDialogOpen(open);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cerrar el editor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tenés cambios sin guardar. Podés guardar y cerrar, cerrar sin guardar o cancelar para seguir editando.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>

                        <Button type="button" variant="outline" onClick={handleCloseWithoutSaving} disabled={isSaving}>
                            Cerrar sin guardar
                        </Button>

                        <AlertDialogAction asChild>
                            <Button type="button" onClick={handleSaveAndClose} disabled={isSaving}>
                                Guardar y cerrar
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ---------- Preview Modal ---------- */}
            {previewOpen && <CVPreviewModal cv={cv} onClose={closePreview} styleConfig={styleConfig} />}

            {/* ---------- Main layout ---------- */}
            <div className="w-full px-3">
                <div className="lg:grid lg:grid-cols-2 lg:gap-4">
                    {/* ================= LEFT: Editor ================= */}
                    <div className="space-y-4">
                        <div className="flex flex-row items-center justify-center w-full">
                            <input
                                value={cv.title ?? ""}
                                onChange={(e) => {
                                    const title = e.target.value;
                                    setCV((prev) => (prev ? { ...prev, title } : prev));
                                    setIsDirty(true);
                                }}
                                placeholder={cv.id === null ? "Nuevo CV (escribe un título)" : "Curriculum Vitae (escribe un título)"}
                                className="w-96 bg-transparent text-sm font-semibold text-slate-100 outline-none placeholder:text-slate-500"
                            />
                        </div>

                        <div className="space-y-2">
                            {/* Profile fijo arriba */}
                            {cv.content.sections
                                .filter((s) => s.type === "profile")
                                .map((section) => (
                                    <SortableSectionCard key={section.id} section={section} title={section.type}>
                                        {isProfileSection(section) && (
                                            <ProfileSectionEditor
                                                curriculumId={cv.id}
                                                value={section.data}
                                                onChange={(data) => updateSection({ ...section, data })}
                                                birthDate={cv.birthDate}
                                                onBirthDateChange={(next) => {
                                                    setCV((prev) => {
                                                        if (!prev) return prev;
                                                        const prevVal = (prev as any).birthDate ?? null;
                                                        const nextVal = next ?? null;
                                                        if (prevVal === nextVal) return prev;
                                                        return { ...prev, birthDate: next };
                                                    });
                                                    setIsDirty(true);
                                                }}
                                                summary={(cv as any).summary ?? ""}
                                                onSummaryChange={(next) => {
                                                    setCV((prev) => (prev ? { ...prev, summary: next } : prev));
                                                    setIsDirty(true);
                                                }}
                                                // ✅ desde content.meta.headerImage
                                                profileImageUrl={(cv as any).imageUrl ?? null}
                                                onProfileImageChange={(url) => {
                                                    updateHeaderImageMeta({ url });
                                                }}
                                                showProfileImage={Boolean((cv as any).showProfileImage)}
                                                onShowProfileImageChange={(next) => {
                                                    updateHeaderImageMeta({ show: next });
                                                }}
                                            />
                                        )}
                                    </SortableSectionCard>
                                ))}
                            <hr className="border-border/40 my-3" />

                            {/* Rest sortable */}
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext
                                    items={cv.content.sections.filter((s) => s.type !== "profile").map((s) => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-4 divide-y divide-border/40">
                                        {cv.content.sections
                                            .filter((s) => s.type !== "profile")
                                            .map((section) => (
                                                <SortableSectionCard
                                                    key={section.id}
                                                    section={section}
                                                    title={section.type}
                                                    onRemove={() => removeSection(section.id)}
                                                >
                                                    {isExperienceSection(section) && <ExperienceSectionEditor section={section} onChange={updateSection} />}
                                                    {isEducationSection(section) && <EducationSectionEditor section={section} onChange={updateSection} />}
                                                    {isSkillsSection(section) && <SkillsSectionEditor section={section} onChange={updateSection} />}

                                                    {isLanguagesSection(section) && (
                                                        <LanguagesSectionEditor value={section.data} onChange={(data) => updateSection({ ...section, data })} />
                                                    )}

                                                    {isProjectsSection(section) && (
                                                        <ProjectsSectionEditor value={section.data} onChange={(data) => updateSection({ ...section, data })} />
                                                    )}

                                                    {isCustomSection(section) && <CustomSectionEditor section={section} onChange={updateSection} />}
                                                </SortableSectionCard>
                                            ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => addSection("experience")} disabled={hasSection("experience")}>
                                + Experiencia
                            </Button>

                            <Button variant="outline" onClick={() => addSection("education")} disabled={hasSection("education")}>
                                + Educación
                            </Button>

                            <Button variant="outline" onClick={() => addSection("skills")} disabled={hasSection("skills")}>
                                + Skills
                            </Button>

                            <Button variant="outline" onClick={() => addSection("languages")} disabled={hasSection("languages")}>
                                + Idiomas
                            </Button>

                            <Button variant="outline" onClick={() => addSection("projects")} disabled={hasSection("projects")}>
                                + Proyectos
                            </Button>

                            <Button variant="outline" onClick={() => addSection("custom")}>
                                + Sección personalizada
                            </Button>
                        </div>
                    </div>

                    {/* ================= RIGHT: Desktop Preview ================= */}
                    <div className="hidden lg:block">
                        <div className="sticky top-[72px] h-[calc(100vh-72px)]">
                            <div className="h-full border-l border-slate-800 bg-slate-950/60 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/70 bg-slate-950/40">
                                    <div className="text-xs font-medium text-slate-300">Preview</div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" className="h-8" onClick={() => window.print()}>
                                            Imprimir
                                        </Button>

                                        <Button variant="outline" size="sm" className="h-8" onClick={() => setPreviewOpen(true)}>
                                            Pantalla completa
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4">
                                    <div className="origin-top scale-[0.9]">
                                        <CVPreviewSheet cv={cv} styleConfig={styleConfig} scale={1} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function createSection(type: CVSection["type"]): CVSection {
    switch (type) {
        case "experience":
            return {
                id: crypto.randomUUID(),
                type,
                data: [
                    {
                        id: crypto.randomUUID(),
                        company: "",
                        role: "",
                        startDate: "",
                        endDate: "",
                        description: "",
                        items: [],
                    },
                ],
            };

        case "education":
            return {
                id: crypto.randomUUID(),
                type,
                data: [
                    {
                        id: crypto.randomUUID(),
                        institution: "",
                        degree: "",
                        startDate: "",
                        endDate: "",
                        description: "",
                    },
                ],
            };

        case "skills":
            return { id: crypto.randomUUID(), type: "skills", data: [] };

        case "languages":
            return { id: crypto.randomUUID(), type: "languages", data: [] };

        case "projects":
            return { id: crypto.randomUUID(), type: "projects", data: [] };

        case "profile":
            return {
                id: crypto.randomUUID(),
                type: "profile",
                data: {
                    fullName: "",
                    headline: undefined,

                    address: undefined,
                    postalCode: undefined,
                    city: undefined,

                    birthPlace: undefined,
                    nationality: undefined,
                    gender: undefined,
                    maritalStatus: undefined,
                    drivingLicense: undefined,

                    showBirthDate: false,
                    showAddress: true,
                    showGender: false,

                    email: undefined,
                    phone: undefined,
                    website: undefined,

                    linkedin: undefined,
                    github: undefined,

                    facebook: undefined,
                    instagram: undefined,
                    youtube: undefined,
                    x: undefined,
                    discord: undefined,

                    medium: undefined,
                    devto: undefined,
                },
            };

        case "custom":
            return { id: crypto.randomUUID(), type: "custom", data: { title: "", items: [] } };
    }
}

function SortableSectionCard({
    section,
    children,
    onRemove,
    title,
}: {
    section: CVSection;
    title: string;
    children: React.ReactNode;
    onRemove?: () => void;
}) {
    const isProfile = section.type === "profile";

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: section.id,
        disabled: isProfile, // ✅ profile no se arrastra
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="flex flex-row items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                        {!isProfile && (
                            <button
                                type="button"
                                className="cursor-grab active:cursor-grabbing px-2 py-1 rounded border text-sm text-muted-foreground hover:bg-accent"
                                title="Arrastrar para reordenar"
                                {...attributes}
                                {...listeners}
                            >
                                ⠿
                            </button>
                        )}

                        <CardTitle className="text-sm capitalize">{title}</CardTitle>
                    </div>

                    {!isProfile && onRemove && (
                        <Button variant="destructive" size="sm" onClick={onRemove}>
                            Eliminar
                        </Button>
                    )}
                </CardHeader>

                <CardContent className="pt-0">{children}</CardContent>
            </Card>
        </div>
    );
}

