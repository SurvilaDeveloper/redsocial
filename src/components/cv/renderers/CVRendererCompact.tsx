// src/components/cv/renderers/CVRendererCompact.tsx
"use client";

import React, { useMemo } from "react";
import type { EditorCV } from "@/types/cvEditor";
import type {
    CVSection,
    ProfileData,
    ExperienceData,
    EducationData,
    SkillData,
    LanguageData,
    ProjectData,
    CustomData,
} from "@/types/cv";

import { TONES, type Tone, type CVThemeColor, coerceThemeColor } from "@/types/cvTheme";

import { HeaderPreview } from "../preview/HeaderPreview";
import ProfilePreview from "../preview/ProfilePreview";
import { ExperiencePreview } from "../preview/ExperiencePreview";
import { EducationPreview } from "../preview/EducationPreview";
import { SkillsPreview } from "../preview/SkillsPreview";
import { LanguagesPreview } from "../preview/LanguagesPreview";
import { ProjectsPreview } from "../preview/ProjectsPreview";
import { CustomPreview } from "../preview/CustomPreview";

type Props = { cv: EditorCV };

type HeaderImageMeta = {
    url: string | null;
    publicId: string | null;
    show: boolean;
};

function getHeaderImageMeta(cv: any): HeaderImageMeta {
    const raw = cv?.content?.meta?.headerImage ?? {};
    return {
        url: typeof raw.url === "string" && raw.url.trim().length ? raw.url.trim() : null,
        publicId:
            typeof raw.publicId === "string" && raw.publicId.trim().length
                ? raw.publicId.trim()
                : null,
        show: Boolean(raw.show ?? false),
    };
}

export function CVRendererCompact({ cv }: Props) {
    // ✅ Theme color (final path + fallback legacy)
    const color = useMemo<CVThemeColor>(() => {
        const fromStyle = (cv as any)?.styleConfig?.theme?.color;
        const legacy = (cv as any)?.color;
        return coerceThemeColor(fromStyle ?? legacy);
    }, [cv]);

    const tone: Tone = useMemo(() => TONES[color], [color]);

    const sections = cv.content?.sections ?? [];

    const profileSection = sections.find((s) => s.type === "profile") as
        | CVSection<"profile">
        | undefined;

    const profileData = (profileSection?.data ?? { fullName: "" }) as ProfileData;
    const rest = sections.filter((s) => s.type !== "profile");

    const headerImage = getHeaderImageMeta(cv);

    return (
        <div className="space-y-4">
            {/* ================= Compact Header Card ================= */}
            <div className="cv-section relative break-inside-avoid overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className={`absolute inset-x-0 top-0 h-1.5 ${tone.bg900}`} />

                {/* decor detrás */}
                <div className={`pointer-events-none absolute -top-8 -left-10 h-24 w-24 rounded-full ${tone.bg50} z-0`} />
                <div className={`pointer-events-none absolute -top-10 right-6 h-28 w-28 rounded-full ${tone.bg100} opacity-80 z-0`} />

                <div className="relative z-10 p-5 space-y-3">
                    {profileSection ? (
                        <HeaderPreview
                            profile={profileData}
                            summary={(cv as any).summary ?? ""}
                            imageUrl={headerImage.url}
                            showImage={headerImage.show}
                            className="pb-1 mb-0"
                        />
                    ) : null}

                    {profileSection ? (
                        <div className={`pt-3 border-t ${tone.border200}`}>
                            <ProfilePreview
                                data={profileData}
                                birthDate={(cv as any).birthDate ?? null}
                                className="pb-0 mb-0"
                            />
                        </div>
                    ) : null}
                </div>
            </div>

            {/* ================= Secciones ================= */}
            <div className="relative space-y-3">
                {/* línea vertical decorativa sutil (no tapa contenido) */}
                <div className={`pointer-events-none absolute left-[10px] top-0 bottom-0 w-px ${tone.bg100} z-0`} />

                <div className="relative z-10 space-y-3">
                    {rest.map((section) => {
                        switch (section.type) {
                            case "experience":
                                return (
                                    <SectionBlock key={section.id} title="Experiencia" tone={tone}>
                                        <ExperiencePreview data={section.data as ExperienceData} />
                                    </SectionBlock>
                                );

                            case "education":
                                return (
                                    <SectionBlock key={section.id} title="Educación" tone={tone}>
                                        <EducationPreview data={section.data as EducationData} />
                                    </SectionBlock>
                                );

                            case "projects":
                                return (
                                    <SectionBlock key={section.id} title="Proyectos" tone={tone}>
                                        <ProjectsPreview data={section.data as ProjectData[]} />
                                    </SectionBlock>
                                );

                            case "skills":
                                return (
                                    <SectionBlock key={section.id} title="Skills" tone={tone}>
                                        <SkillsPreview data={section.data as SkillData[]} />
                                    </SectionBlock>
                                );

                            case "languages":
                                return (
                                    <SectionBlock key={section.id} title="Idiomas" tone={tone}>
                                        <LanguagesPreview data={section.data as LanguageData[]} />
                                    </SectionBlock>
                                );

                            case "custom": {
                                const d = section.data as CustomData;
                                const title = d.title?.trim() || "Sección";
                                return (
                                    <SectionBlock key={section.id} title={title} tone={tone}>
                                        <CustomPreview data={d} />
                                    </SectionBlock>
                                );
                            }

                            default:
                                return null;
                        }
                    })}
                </div>
            </div>
        </div>
    );
}

function SectionBlock({
    title,
    children,
    tone,
}: {
    title: string;
    children: React.ReactNode;
    tone: Tone;
}) {
    return (
        // ✅ .cv-section para que tu @media print lo cubra
        <section className="cv-section relative pl-7 break-inside-avoid">
            {/* Bullet alineado a la línea vertical */}
            <div className={`absolute left-[4px] top-4 h-3.5 w-3.5 rounded-full ${tone.bg900} shadow-sm`} />

            {/* ✅ overflow-visible para evitar recortes en print */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-visible">
                <div className="flex items-center justify-between gap-3 px-4 pt-4 min-w-0">
                    <h2 className="text-base font-semibold tracking-tight text-neutral-900 min-w-0 break-words">
                        {title}
                    </h2>

                    {/* ✅ sin texto (solo decorativo) */}
                    <div
                        className={`shrink-0 h-6 w-6 rounded-full border bg-white shadow-sm flex items-center justify-center ${tone.ring200} ring-2`}
                        aria-hidden
                    >
                        <div className={`h-2 w-2 rounded-full ${tone.bg900} opacity-70`} />
                    </div>
                </div>

                <div className="mt-3 h-px w-full bg-neutral-200/80" />

                <div
                    className="px-4 pb-4 pt-3 min-w-0 break-words"
                    style={{ overflowWrap: "anywhere" }}
                >
                    {children}
                </div>
            </div>
        </section>
    );
}
