// src/components/cv/renderers/CVRendererTwoColumns.tsx
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

export function CVRendererTwoColumns({ cv }: Props) {
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

    const main = rest.filter(
        (s) => s.type === "experience" || s.type === "education" || s.type === "custom"
    );
    const side = rest.filter(
        (s) => s.type === "skills" || s.type === "languages" || s.type === "projects"
    );

    const headerImage = getHeaderImageMeta(cv);

    return (
        <div className="relative">
            {/* === BACKGROUND DECOR (sutil, imprimible, sin z negativo) === */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className={`absolute -top-28 -left-28 h-80 w-80 rounded-full ${tone.bg50}`} />
                <div className={`absolute -top-36 left-56 h-72 w-72 rounded-full ${tone.bg100} opacity-60`} />
                <div className={`absolute -bottom-40 -right-40 h-96 w-96 rounded-full ${tone.bg50}`} />
                <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
            </div>

            <div className="relative z-10 space-y-6">
                {/* Header + Profile */}
                <div className="cv-block space-y-6">
                    {profileSection ? (
                        <div className="cv-section break-inside-avoid relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                            <div className={`absolute inset-x-0 top-0 h-2 ${tone.bg900}`} />
                            <div className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full ${tone.bg50} z-0`} />
                            <div className={`pointer-events-none absolute -top-12 right-16 h-24 w-24 rounded-full ${tone.bg100} opacity-70 z-0`} />

                            <div className="relative z-10 p-7 space-y-6">
                                <HeaderPreview
                                    profile={profileData}
                                    summary={(cv as any).summary ?? ""}
                                    imageUrl={headerImage.url}
                                    showImage={headerImage.show}
                                />

                                <div className="pt-4 border-t border-neutral-200/70">
                                    <ProfilePreview
                                        data={profileData}
                                        birthDate={(cv as any).birthDate ?? null}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* === TWO COLUMNS 50/50 (WYSIWYG print) === */}
                <div className="grid grid-cols-12 gap-6 items-start">
                    {/* LEFT */}
                    <main className="col-span-12 lg:col-span-6 print:col-span-6 space-y-6 min-w-0">
                        {main.map((section) => renderSection(section, tone, { column: "left" }))}
                    </main>

                    {/* RIGHT (decorated column, same width) */}
                    <aside className="col-span-12 lg:col-span-6 print:col-span-6 min-w-0">
                        <div className="relative">
                            {/* column decor */}
                            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-3xl">
                                {/* soft panel */}
                                <div className={`${tone.bg50} absolute inset-0 opacity-70`} />
                                {/* accent rail */}
                                <div className={`absolute inset-y-0 left-0 w-2 ${tone.bg900}`} />
                                {/* diagonal shine */}
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.03),transparent_55%)]" />
                                {/* blobs */}
                                <div className={`absolute -top-14 -right-14 h-44 w-44 rounded-full ${tone.bg50}`} />
                                <div className={`absolute bottom-10 -right-20 h-52 w-52 rounded-full ${tone.bg100} opacity-40`} />
                            </div>

                            <div className="relative z-10 rounded-3xl border bg-white/80 backdrop-blur-[1px] p-5 shadow-sm space-y-6">
                                {side.map((section) => renderSection(section, tone, { column: "right" }))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );

    function renderSection(section: CVSection, toneObj: Tone, opts?: { column?: "left" | "right" }) {
        const compact = opts?.column === "right";

        switch (section.type) {
            case "experience":
                return (
                    <SectionCard
                        key={section.id}
                        title="Experiencia"
                        tone={toneObj}
                        emphasis="high"
                        variant={compact ? "compact" : "default"}
                    >
                        <ExperiencePreview data={section.data as ExperienceData} />
                    </SectionCard>
                );

            case "education":
                return (
                    <SectionCard
                        key={section.id}
                        title="Educación"
                        tone={toneObj}
                        emphasis="low"
                        variant={compact ? "compact" : "default"}
                    >
                        <EducationPreview data={section.data as EducationData} />
                    </SectionCard>
                );

            case "projects":
                return (
                    <SectionCard
                        key={section.id}
                        title="Proyectos"
                        tone={toneObj}
                        emphasis="low"
                        variant={compact ? "compact" : "default"}
                    >
                        <ProjectsPreview data={section.data as ProjectData[]} />
                    </SectionCard>
                );

            case "skills":
                return (
                    <SectionCard
                        key={section.id}
                        title="Skills"
                        tone={toneObj}
                        emphasis="high"
                        variant={compact ? "compact" : "default"}
                    >
                        <SkillsPreview data={section.data as SkillData[]} />
                    </SectionCard>
                );

            case "languages":
                return (
                    <SectionCard
                        key={section.id}
                        title="Idiomas"
                        tone={toneObj}
                        emphasis="low"
                        variant={compact ? "compact" : "default"}
                    >
                        <LanguagesPreview data={section.data as LanguageData[]} />
                    </SectionCard>
                );

            case "custom": {
                const d = section.data as CustomData;
                const title = d.title?.trim() || "Sección";
                return (
                    <SectionCard
                        key={section.id}
                        title={title}
                        tone={toneObj}
                        emphasis="low"
                        variant={compact ? "compact" : "default"}
                    >
                        <CustomPreview data={d} />
                    </SectionCard>
                );
            }

            default:
                return null;
        }
    }
}

function SectionCard({
    title,
    children,
    tone,
    emphasis = "low",
    variant = "default",
}: {
    title: string;
    children: React.ReactNode;
    tone: Tone;
    emphasis?: "high" | "low";
    variant?: "default" | "compact";
}) {
    const compact = variant === "compact";
    const topStrip = emphasis === "high" ? tone.bg900 : tone.bg100;

    return (
        // ✅ cv-section para print + break-inside-avoid
        <section className="cv-section break-inside-avoid relative">
            {/* card */}
            <div className="relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                {/* top strip */}
                <div className={`absolute inset-x-0 top-0 h-1.5 ${topStrip}`} />

                {/* small blob */}
                <div className={`pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full ${tone.bg50} z-0`} />

                <div className={compact ? "relative z-10 p-4" : "relative z-10 p-6"}>
                    <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-start gap-3 min-w-0">
                            {/* decor icon (sin texto) */}
                            <div
                                className={`shrink-0 h-8 w-8 rounded-2xl border bg-white shadow-sm flex items-center justify-center ${tone.ring200} ring-2`}
                                aria-hidden
                            >
                                <div className={`h-2.5 w-2.5 rounded-full ${tone.bg900}`} />
                            </div>

                            <h2
                                className={
                                    compact
                                        ? "text-sm font-semibold tracking-tight text-neutral-900 min-w-0 break-words"
                                        : "text-lg font-semibold tracking-tight text-neutral-900 min-w-0 break-words"
                                }
                            >
                                {title}
                            </h2>
                        </div>

                        {/* dot */}
                        <div
                            className={`shrink-0 h-6 w-6 rounded-full border bg-white shadow-sm flex items-center justify-center ${tone.ring200} ring-2`}
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
