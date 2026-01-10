// src/components/cv/renderers/CVRendererRightProfileAccent.tsx
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

export function CVRendererRightProfileAccent({ cv }: Props) {
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

    // ✅ Orden: primero skills/lang/projects, luego experience/education/custom
    const top = rest.filter(
        (s) => s.type === "skills" || s.type === "languages" || s.type === "projects"
    );
    const bottom = rest.filter(
        (s) => s.type === "experience" || s.type === "education" || s.type === "custom"
    );
    const oneColumn = [...top, ...bottom];

    const headerImage = getHeaderImageMeta(cv);

    return (
        <div className="relative">
            {/* === FULL-HEIGHT VERTICAL ACCENT (behind everything) === */}
            <div className={`pointer-events-none absolute inset-y-0 right-0 w-[28%] ${tone.bg900} z-0`} />
            <div className={`pointer-events-none absolute inset-y-0 right-[28%] w-px ${tone.bg100} opacity-80 z-0`} />

            {/* soft cuts */}
            <div className={`pointer-events-none absolute -top-8 -right-12 h-56 w-56 rounded-full ${tone.bg900} opacity-[0.18] z-0`} />
            <div className={`pointer-events-none absolute -bottom-8 -right-12 h-72 w-72 rounded-full ${tone.bg900} opacity-[0.12] z-0`} />

            {/* subtle grid, global */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px] z-0" />

            {/* CONTENT */}
            <div className="relative z-10 space-y-6">
                {/* === TOP: TWO COLUMNS ONLY (Header + Profile) === */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Header */}
                    <div className="col-span-12 lg:col-span-7 print:col-span-7 min-w-0">
                        {profileSection ? (
                            <div className="cv-section break-inside-avoid relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                                <div className={`absolute inset-x-0 top-0 h-2 ${tone.bg900}`} />
                                <div className={`pointer-events-none absolute -top-10 left-12 h-24 w-24 rounded-full ${tone.bg50} z-0`} />
                                <div className={`pointer-events-none absolute -top-14 left-28 h-28 w-28 rounded-full ${tone.bg100} opacity-80 z-0`} />

                                <div className="relative z-10 p-6">
                                    <HeaderPreview
                                        profile={profileData}
                                        summary={(cv as any).summary ?? ""}
                                        imageUrl={headerImage.url}
                                        showImage={headerImage.show}
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Profile */}
                    <div className="col-span-12 lg:col-span-5 print:col-span-5 min-w-0">
                        {profileSection ? (
                            <div className="cv-section break-inside-avoid relative overflow-hidden rounded-3xl border bg-white/95 shadow-sm">
                                <div className={`absolute inset-x-0 top-0 h-2 ${tone.bg900}`} />

                                {/* small decor */}
                                <div className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full ${tone.bg50} z-0`} />
                                <div className={`pointer-events-none absolute -top-12 right-10 h-20 w-20 rounded-full ${tone.bg100} opacity-80 z-0`} />

                                <div className="relative z-10 p-6">
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

                                    <div className="mt-3 h-px w-full bg-neutral-200/80" />

                                    <div className="pt-4 min-w-0 break-words" style={{ overflowWrap: "anywhere" }}>
                                        <ProfilePreview
                                            data={profileData}
                                            birthDate={(cv as any).birthDate ?? null}
                                            className="border-b-0 pb-0 mb-0"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* === REST: ONE COLUMN, "stacked over" the vertical accent === */}
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
    const topLine = emphasis === "high" ? tone.bg900 : tone.bg100;

    return (
        <section className="cv-section break-inside-avoid relative">
            {/* Card */}
            <div className="relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                {/* top line */}
                <div className={`absolute inset-x-0 top-0 h-1.5 ${topLine}`} />

                {/* corner accent */}
                <div className={`pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full ${tone.bg900} opacity-[0.08] z-0`} />
                <div className={`pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full ${tone.bg900} opacity-[0.06] z-0`} />

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