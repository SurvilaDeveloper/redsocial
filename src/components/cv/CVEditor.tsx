// src/components/cv/CVEditor.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCV } from "@/hooks/useCV";
import type {
    Curriculum,
    CVSection,
    CVStyleConfig,
    CVStyleElement,
    CVTextStyle,
    CVThemeColor,
    HeaderImageMeta,
} from "@/types/cv";
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

import { Save, ChevronDown } from "lucide-react";

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

import type { CVTemplateId } from "@/types/cv";
import { CVTemplateSelect } from "./styles/CVTemplateSelect";
import { CVFontsMenu } from "./styles/CVFontsMenu";

import { CVThemeSelect } from "./styles/CVThemeSelect";
import { coerceThemeColor } from "@/types/cv"; // ahora está en cv.ts
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/* ===========================
   Style defaults / normalize
=========================== */

const FONT_FAMILIES = ["sans-serif", "serif", "monospace", "cursive", "fantasy"] as const;
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px"] as const;

// ✅ Solo keys de texto (NO incluye showDocTitle)
const STYLE_KEYS: CVStyleElement[] = [
    "docTitle",
    "name",
    "headline",
    "summary",
    "personal",
    "title",
    "subtitle",
    "description",
    "date",
    "itemTitle",
    "itemSubtitle",
    "link",
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

    personal: makeStyle("12px", { color: "#374151" }),

    title: makeStyle("14px"),
    subtitle: makeStyle("12px", { color: "#374151" }),
    description: makeStyle("12px"),
    date: makeStyle("12px", { color: "#6B7280" }),

    itemTitle: makeStyle("14px"),
    itemSubtitle: makeStyle("12px", { color: "#374151" }),

    link: makeStyle("12px"),
};

const DEFAULT_STYLE_CONFIG: CVStyleConfig = {
    ...DEFAULTS_BY_KEY,
    showDocTitle: true,
    template: "classic",
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

    // legacy: algunos CVs viejos tenían "title" como style general
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
    out.theme = {
        ...(obj.theme ?? {}),
        color: coerceThemeColor(obj?.theme?.color),
    };

    return out as CVStyleConfig;
}

/* ===========================
   Header image meta helpers
   (cv.content.meta.headerImage)
=========================== */

function normalizeHeaderImageMeta(input: any): HeaderImageMeta {
    const url = typeof input?.url === "string" && input.url.trim().length ? input.url.trim() : null;
    const publicId = typeof input?.publicId === "string" && input.publicId.trim().length ? input.publicId.trim() : null;
    const show = Boolean(input?.show ?? false);
    return { url, publicId, show };
}

function getHeaderImageMeta(cv: Curriculum): HeaderImageMeta {
    return normalizeHeaderImageMeta(cv.content?.meta?.headerImage);
}

/* ===========================
   CVEditor
=========================== */

export function CVEditor({ cvId }: { cvId: number | null }) {
    const router = useRouter();

    // useCV debe retornar Curriculum (si todavía no, por ahora tipamos acá)
    const { cv, setCV, save, remove, loading } = useCV(cvId) as unknown as {
        cv: Curriculum | null;
        setCV: React.Dispatch<React.SetStateAction<Curriculum | null>>;
        save: (payload: Curriculum) => Promise<Curriculum>;
        remove: (id: number) => Promise<void>;
        loading: boolean;
    };

    const [previewOpen, setPreviewOpen] = useState(false);

    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTogglingPublic, setIsTogglingPublic] = useState(false);

    // AlertDialog (cerrar con cambios)
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);

    // styleConfig (local editable; se persiste con Guardar)
    const [styleConfig, setStyleConfig] = useState<CVStyleConfig>(DEFAULT_STYLE_CONFIG);

    // ✅ Collapsibles por sección (sin localStorage)
    const [openById, setOpenById] = useState<Record<string, boolean>>({});

    // Delete CV
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = useCallback(async () => {
        if (!cv?.id) return;

        setIsDeleting(true);
        try {
            await remove(cv.id);
            setDeleteDialogOpen(false);
            router.push("/cv");
            router.refresh?.();
        } catch (e: any) {
            console.error(e);
            alert(e?.message ?? "Error eliminando el CV");
        } finally {
            setIsDeleting(false);
        }
    }, [cv?.id, remove, router]);

    const isOpen = useCallback(
        (id: string, fallback = false) => {
            const v = openById[id];
            return typeof v === "boolean" ? v : fallback;
        },
        [openById]
    );

    const setOpen = useCallback((id: string, open: boolean) => {
        setOpenById((prev) => ({ ...prev, [id]: open }));
    }, []);

    const expandAll = useCallback(() => {
        setOpenById((prev) => {
            const next = { ...prev };
            for (const s of cv?.content?.sections ?? []) next[s.id] = true;
            return next;
        });
    }, [cv]);

    const collapseAll = useCallback(() => {
        setOpenById((prev) => {
            const next = { ...prev };
            for (const s of cv?.content?.sections ?? []) next[s.id] = false;
            return next;
        });
    }, [cv]);

    const applyStyleConfig = useCallback(
        (next: CVStyleConfig) => {
            setStyleConfig(next);
            // ✅ mantener cv.styleConfig sincronizado (el modal ya lo lee desde cv)
            setCV((prev) => (prev ? { ...prev, styleConfig: next } : prev));
            setIsDirty(true);
        },
        [setCV]
    );

    useEffect(() => {
        if (!cv) return;
        setStyleConfig(normalizeStyleConfig(cv.styleConfig));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cv?.id]);

    // ✅ cv efectivo SIEMPRE incluye styleConfig actual
    const effectiveCv = useMemo(() => {
        if (!cv) return null;
        return { ...cv, styleConfig } as Curriculum;
    }, [cv, styleConfig]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const hasSection = (type: CVSection["type"]) => cv?.content.sections.some((s) => s.type === type);

    const updateRoot = useCallback(
        (
            patch: Partial<Pick<Curriculum, "summary" | "birthDate">> & {
                headerImage?:
                | Partial<HeaderImageMeta>
                | ((prev: HeaderImageMeta) => Partial<HeaderImageMeta>);
            } & Record<string, any>
        ) => {
            setCV((prev) => {
                if (!prev) return prev;

                const prevHeader = getHeaderImageMeta(prev);

                let nextHeader = prevHeader;

                if (patch.headerImage) {
                    const nextPartial =
                        typeof patch.headerImage === "function"
                            ? patch.headerImage(prevHeader)
                            : patch.headerImage;

                    nextHeader = {
                        url: nextPartial.url !== undefined ? (nextPartial.url ?? null) : prevHeader.url,
                        publicId:
                            nextPartial.publicId !== undefined ? (nextPartial.publicId ?? null) : prevHeader.publicId,
                        show: nextPartial.show !== undefined ? Boolean(nextPartial.show) : prevHeader.show,
                    };
                }

                const { headerImage, ...rootPatch } = patch;

                setIsDirty(true);

                const prevContent = prev.content ?? { sections: [] };
                const prevMeta = prevContent.meta ?? {};

                const currentHeader = normalizeHeaderImageMeta(prevMeta.headerImage);
                const headerToStore = patch.headerImage ? nextHeader : currentHeader;

                return {
                    ...prev,
                    ...rootPatch,
                    content: {
                        ...prevContent,
                        meta: {
                            ...prevMeta,
                            headerImage: headerToStore,
                        },
                        sections: prevContent.sections ?? [],
                    },
                    imageUrl: headerToStore.url ?? null,
                    imagePublicId: headerToStore.publicId ?? null,
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

    const handleTogglePublic = useCallback(async () => {
        if (!effectiveCv) return;

        setIsTogglingPublic(true);
        setIsSaving(true);

        try {
            const next = { ...effectiveCv, isPublic: !Boolean(effectiveCv.isPublic) };
            const saved = await save(next);

            // Actualiza estado local con lo que devuelve la API
            setCV(saved);

            // Esto “ya guardó” el cambio
            setIsDirty(false);
        } finally {
            setIsSaving(false);
            setIsTogglingPublic(false);
        }
    }, [effectiveCv, save, setCV]);


    const handleSave = useCallback(async () => {
        if (!effectiveCv) return;

        setIsSaving(true);
        try {
            const saved = await save(effectiveCv);
            setIsDirty(false);

            if (cvId === null) router.replace(`/cv/${saved.id}`);
        } finally {
            setIsSaving(false);
        }
    }, [effectiveCv, cvId, router, save]);

    const handleSaveAndClose = useCallback(async () => {
        if (!effectiveCv) return;

        setIsSaving(true);
        try {
            await save(effectiveCv);
            setIsDirty(false);
            setCloseDialogOpen(false);
            router.push("/");
        } finally {
            setIsSaving(false);
        }
    }, [effectiveCv, router, save]);

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
                    ...prev.content,
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

            const created = createSection(type);

            setOpenById((m) => ({ ...m, [created.id]: true }));

            return {
                ...prev,
                content: {
                    ...prev.content,
                    sections: [...prev.content.sections, created],
                },
            };
        });
    };

    const removeSection = useCallback(
        (id: string) => {
            setOpenById((prev) => {
                const { [id]: _omit, ...rest } = prev;
                return rest;
            });

            setCV((prev) => {
                if (!prev) return prev;
                setIsDirty(true);
                return {
                    ...prev,
                    content: {
                        ...prev.content,
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
                    ...prev.content,
                    sections: prev.content.sections.map((s) => (s.id === updated.id ? updated : s)),
                },
            };
        });
    };

    const closePreview = () => setPreviewOpen(false);

    if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
    if (!cv || !effectiveCv) return <p className="text-sm text-muted-foreground">No encontrado</p>;

    const themeColor = coerceThemeColor(styleConfig?.theme?.color);

    return (
        <div className="space-y-4 pt-0">
            {/* ---------- Top bar fixed ---------- */}
            <div className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
                <div className="mx-auto px-3 py-2">
                    <div className="flex flex- row items-center justify-between gap-3">
                        {/* Left */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative flex flex-row gap-2">
                                <CVFontsMenu
                                    disabled={isSaving}
                                    styleConfig={styleConfig}
                                    styleKeys={STYLE_KEYS}
                                    onChange={(next) => applyStyleConfig(next)}
                                    onDirty={() => setIsDirty(true)}
                                />

                                <CVTemplateSelect
                                    value={(styleConfig.template ?? "classic") as CVTemplateId}
                                    onChange={(t) => {
                                        applyStyleConfig({ ...styleConfig, template: t });
                                    }}
                                />

                                <CVThemeSelect
                                    value={themeColor}
                                    onChange={(next) => {
                                        applyStyleConfig({
                                            ...styleConfig,
                                            theme: {
                                                ...(styleConfig.theme ?? {}),
                                                color: next,
                                            },
                                        });
                                    }}
                                />

                                <div className="min-w-0">
                                    <div className="text-[8px] text-muted-foreground">{dirtyLabel}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="flex flex-row items-center justify-end gap-0 w-full">
                            <Button onClick={() => setPreviewOpen(true)} disabled={isSaving} className="lg:hidden">
                                Preview
                            </Button>
                            <Button
                                variant={cv.isPublic ? "secondary" : "default"}
                                onClick={handleTogglePublic}
                                disabled={isSaving || isDeleting || isTogglingPublic || !cv.id}
                                title={!cv.id ? "Primero guardá el CV" : cv.isPublic ? "Dejar de hacerlo público" : "Hacer público este CV"}
                            >
                                {cv.isPublic ? "Dejar de hacer público" : "Hacer público"}
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={() => setDeleteDialogOpen(true)}
                                disabled={isSaving || isDeleting || !cv.id}
                                title={!cv.id ? "Primero guardá el CV para poder eliminarlo" : "Eliminar CV"}
                            >
                                Eliminar
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

                            {/* ---------- AlertDialog: eliminar CV ---------- */}
                            <AlertDialog
                                open={deleteDialogOpen}
                                onOpenChange={(open) => {
                                    if (isDeleting) return;
                                    setDeleteDialogOpen(open);
                                }}
                            >
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar este CV?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esto elimina el CV de la base. Tus imágenes usadas en este CV se conservan.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>

                                        <AlertDialogAction asChild>
                                            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                                {isDeleting ? "Eliminando…" : "Eliminar definitivamente"}
                                            </Button>
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
            {previewOpen && <CVPreviewModal cv={effectiveCv} onClose={closePreview} />}

            {/* ---------- Main layout ---------- */}
            <div className="w-full px-0">
                <div className="lg:grid lg:grid-cols-2 lg:gap-2">
                    {/* ================= LEFT: Editor ================= */}
                    <div className="space-y-0">
                        {/* ✅ Título + Expand/Collapse pegados */}
                        <div className="flex flex-col items-center justify-center w-full gap-0">
                            <div className="fixed top-[56px] left-0 flex flex-row items-center justify-start gap-1 bg-slate-900/70 z-10 w-full h-6 lg:w-auto">
                                <Button type="button" variant="secondary" size="sm" className="h-8" onClick={expandAll}>
                                    Expandir todo
                                </Button>
                                <Button type="button" variant="secondary" size="sm" className="h-8 " onClick={collapseAll}>
                                    Colapsar todo
                                </Button>
                            </div>

                            <div className="flex flex-row items-center justify-center gap-1 w-full pt-10">
                                <span className="text-slate-400 text-[10px] text-nowrap">Edita el título</span>
                                <input
                                    value={cv.title ?? ""}
                                    onChange={(e) => {
                                        const title = e.target.value;
                                        setCV((prev) => (prev ? { ...prev, title } : prev));
                                        setIsDirty(true);
                                    }}
                                    placeholder={cv.id ? "Curriculum Vitae (escribe un título)" : "Nuevo CV (escribe un título)"}
                                    className="w-96 bg-transparent text-sm font-semibold text-slate-100 outline-none placeholder:text-slate-500 border border-slate-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            {/* Profile fijo arriba */}
                            {cv.content.sections
                                .filter((s) => s.type === "profile")
                                .map((section) => (
                                    <SortableSectionCard
                                        key={section.id}
                                        section={section}
                                        title={section.type}
                                        collapsible={{
                                            open: isOpen(section.id, true),
                                            onOpenChange: (open) => setOpen(section.id, open),
                                        }}
                                    >
                                        {isProfileSection(section) && (
                                            <ProfileSectionEditor
                                                curriculumId={cv.id}
                                                value={section.data}
                                                onChange={(data) => updateSection({ ...section, data })}
                                                birthDate={cv.birthDate ?? null}
                                                onBirthDateChange={(next) => updateRoot({ birthDate: next })}
                                                summary={cv.summary ?? ""}
                                                onSummaryChange={(next) => updateRoot({ summary: next })}
                                                profileImageUrl={getHeaderImageMeta(cv).url}
                                                onProfileImageChange={(url) => updateRoot({ headerImage: { url } })}
                                                showProfileImage={getHeaderImageMeta(cv).show}
                                                onShowProfileImageChange={(next) => updateRoot({ headerImage: { show: next } })}
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
                                    <div className="space-y-1 divide-y divide-border/40">
                                        {cv.content.sections
                                            .filter((s) => s.type !== "profile")
                                            .map((section) => (
                                                <SortableSectionCard
                                                    key={section.id}
                                                    section={section}
                                                    title={section.type}
                                                    onRemove={() => removeSection(section.id)}
                                                    collapsible={{
                                                        open: isOpen(section.id, false),
                                                        onOpenChange: (open) => setOpen(section.id, open),
                                                    }}
                                                >
                                                    {isExperienceSection(section) && (
                                                        <ExperienceSectionEditor section={section} onChange={updateSection} />
                                                    )}
                                                    {isEducationSection(section) && (
                                                        <EducationSectionEditor section={section} onChange={updateSection} />
                                                    )}
                                                    {isSkillsSection(section) && (
                                                        <SkillsSectionEditor section={section} onChange={updateSection} />
                                                    )}

                                                    {isLanguagesSection(section) && (
                                                        <LanguagesSectionEditor
                                                            value={section.data}
                                                            onChange={(data) => updateSection({ ...section, data })}
                                                        />
                                                    )}

                                                    {isProjectsSection(section) && (
                                                        <ProjectsSectionEditor
                                                            value={section.data}
                                                            onChange={(data) => updateSection({ ...section, data })}
                                                        />
                                                    )}

                                                    {isCustomSection(section) && (
                                                        <CustomSectionEditor section={section} onChange={updateSection} />
                                                    )}
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
                                        <Button variant="outline" size="sm" className="h-8" onClick={() => setPreviewOpen(true)}>
                                            Pantalla completa / Imprimir
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-0">
                                    <div className="origin-top scale-[1]">
                                        <CVPreviewSheet cv={effectiveCv} scale={1} />
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

/* ===========================
   Helpers
=========================== */

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
    collapsible,
}: {
    section: CVSection;
    title: string;
    children: React.ReactNode;
    onRemove?: () => void;
    collapsible?: {
        open: boolean;
        onOpenChange: (open: boolean) => void;
    };
}) {
    const isProfile = section.type === "profile";

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: section.id,
        disabled: isProfile,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    const open = collapsible?.open ?? true;

    return (
        <div ref={setNodeRef} style={style}>
            <Card className="border-0 bg-transparent shadow-none w-full p-0">
                <Collapsible open={open} onOpenChange={(v) => collapsible?.onOpenChange?.(v)} className="rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between py-0 w-full p-0">
                        <div className="flex items-center gap-2 min-w-0">
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

                            <CardTitle className="text-sm capitalize p-0">{title}</CardTitle>

                            {collapsible ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        collapsible.onOpenChange(!open);
                                    }}
                                    className="ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                                    title={open ? "Colapsar" : "Expandir"}
                                >
                                    {open ? "Ocultar" : "Mostrar"}
                                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open ? "rotate-180" : "rotate-0")} />
                                </button>
                            ) : null}
                        </div>

                        {!isProfile && onRemove && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onRemove();
                                }}
                            >
                                Eliminar
                            </Button>
                        )}
                    </CardHeader>

                    <CollapsibleContent>
                        <CardContent className="p-0">{children}</CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        </div>
    );
}
