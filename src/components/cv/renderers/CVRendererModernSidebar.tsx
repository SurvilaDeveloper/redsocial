// src/components/cv/renderers/CVRendererModernSidebar.tsx
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

export function CVRendererModernSidebar({ cv }: Props) {
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

    const sidebar = rest.filter(
        (s) => s.type === "skills" || s.type === "languages" || s.type === "projects"
    );
    const main = rest.filter(
        (s) => s.type === "experience" || s.type === "education" || s.type === "custom"
    );
    const oneColumn = [...sidebar, ...main];

    const headerImage = getHeaderImageMeta(cv);

    return (
        <div className="relative cv-print-root">
            {/* === BACKGROUND DECOR (premium) === */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className={`absolute -top-24 -left-24 h-80 w-80 rounded-full ${tone.bg50}`} />
                <div className={`absolute -top-28 left-40 h-72 w-72 rounded-full ${tone.bg100} opacity-80`} />
                <div className={`absolute -top-32 -right-28 h-96 w-96 rounded-full ${tone.bg50}`} />

                {/* soft diagonal wash */}
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.03),transparent_55%)]" />

                {/* dotted texture */}
                <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px]" />
            </div>

            <div className="relative z-10 space-y-6">
                {/* === HERO / HEADER CARD === */}
                <div className="relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                    <div className={`absolute inset-x-0 top-0 h-2 ${tone.bg900}`} />

                    {/* decor */}
                    <div className={`pointer-events-none absolute -top-12 -left-10 h-32 w-32 rounded-full ${tone.bg50} z-0`} />
                    <div className={`pointer-events-none absolute -top-16 left-24 h-40 w-40 rounded-full ${tone.bg100} opacity-80 z-0`} />
                    <div className={`pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full ${tone.bg50} z-0`} />
                    <div className={`pointer-events-none absolute left-8 top-0 bottom-0 w-px ${tone.bg100} opacity-80 z-0`} />

                    {/* contenido */}
                    <div className="relative z-10 p-7 space-y-6">
                        {profileSection ? (
                            <div className="grid grid-cols-12 gap-6 items-start">
                                {/* ✅ en print forzamos 7/5 aunque el ancho sea < lg */}
                                <div className="col-span-12 lg:col-span-7 print:col-span-7 min-w-0">
                                    <HeaderPreview
                                        profile={profileData}
                                        summary={(cv as any).summary ?? ""}
                                        imageUrl={headerImage.url}
                                        showImage={headerImage.show}
                                    />
                                </div>

                                <div className="col-span-12 lg:col-span-5 print:col-span-5 min-w-0">
                                    <div className={`rounded-2xl border ${tone.bg50} bg-opacity-60 p-5 shadow-sm`}>
                                        <div className="flex items-center justify-between gap-3 min-w-0">
                                            <h3 className="text-sm font-semibold tracking-wide text-neutral-900 min-w-0 break-words">
                                                Perfil
                                            </h3>

                                            <div
                                                className={`shrink-0 h-8 w-8 rounded-2xl border bg-white shadow-sm flex items-center justify-center ${tone.ring200} ring-2`}
                                                aria-hidden
                                            >
                                                <div className={`h-2.5 w-2.5 rounded-full ${tone.bg900}`} />
                                            </div>
                                        </div>

                                        <div className="mt-3 h-px w-full bg-neutral-200/70" />

                                        <div className="pt-4 min-w-0 break-words">
                                            <ProfilePreview
                                                data={profileData}
                                                birthDate={(cv as any).birthDate ?? null}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* === ONE COLUMN SECTIONS === */}
                <div className="space-y-6">
                    {oneColumn.map((section) => renderSection(section, tone))}
                </div>
            </div>
        </div>
    );

    function renderSection(section: CVSection, toneObj: Tone) {
        switch (section.type) {
            case "experience":
                return (
                    <SectionBlock key={section.id} title="Experiencia" tone={toneObj} emphasis="high">
                        <ExperiencePreview data={section.data as ExperienceData} />
                    </SectionBlock>
                );

            case "education":
                return (
                    <SectionBlock key={section.id} title="Educación" tone={toneObj} emphasis="low">
                        <EducationPreview data={section.data as EducationData} />
                    </SectionBlock>
                );

            case "projects":
                return (
                    <SectionBlock key={section.id} title="Proyectos" tone={toneObj} emphasis="low">
                        <ProjectsPreview data={section.data as ProjectData[]} />
                    </SectionBlock>
                );

            case "skills":
                return (
                    <SectionBlock key={section.id} title="Skills" tone={toneObj} emphasis="high">
                        <SkillsPreview data={section.data as SkillData[]} />
                    </SectionBlock>
                );

            case "languages":
                return (
                    <SectionBlock key={section.id} title="Idiomas" tone={toneObj} emphasis="low">
                        <LanguagesPreview data={section.data as LanguageData[]} />
                    </SectionBlock>
                );

            case "custom": {
                const d = section.data as CustomData;
                const title = d.title?.trim() || "Sección";
                return (
                    <SectionBlock key={section.id} title={title} tone={toneObj} emphasis="low">
                        <CustomPreview data={d} />
                    </SectionBlock>
                );
            }

            default:
                return null;
        }
    }
}

function SectionBlock({
    title,
    children,
    tone,
    emphasis = "low",
}: {
    title: string;
    children: React.ReactNode;
    tone: Tone;
    emphasis?: "high" | "low";
}) {
    const topBar = emphasis === "high" ? tone.bg900 : tone.bg100;

    return (
        <section className="cv-section relative break-inside-avoid cv-print-section">
            <div className="relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                <div className={`absolute inset-x-0 top-0 h-1.5 ${topBar}`} />

                <div className={`pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full ${tone.bg50} z-0`} />

                <div className="relative z-10 px-6 pb-6 pt-6 min-w-0">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-start gap-3 min-w-0">
                            <div
                                className={
                                    emphasis === "high"
                                        ? `shrink-0 h-9 w-9 rounded-2xl border ${tone.bg900} shadow-sm flex items-center justify-center`
                                        : `shrink-0 h-9 w-9 rounded-2xl border bg-white shadow-sm flex items-center justify-center ${tone.ring200} ring-2`
                                }
                                aria-hidden
                            >
                                <div
                                    className={
                                        emphasis === "high"
                                            ? "h-2.5 w-2.5 rounded-full bg-white"
                                            : `h-2.5 w-2.5 rounded-full ${tone.bg900}`
                                    }
                                />
                            </div>

                            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 min-w-0 break-words">
                                {title}
                            </h2>
                        </div>

                        <div
                            className={`shrink-0 h-7 w-7 rounded-full border bg-white shadow-sm flex items-center justify-center ${tone.ring200} ring-2`}
                            aria-hidden
                        >
                            <div className={`h-2 w-2 rounded-full ${tone.bg900} opacity-70`} />
                        </div>
                    </div>

                    <div className="mt-4 h-px w-full bg-neutral-200/80" />

                    <div className="pt-4 min-w-0 break-words" style={{ overflowWrap: "anywhere" }}>
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
}
