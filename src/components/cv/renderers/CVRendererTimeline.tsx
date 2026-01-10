// src/components/cv/renderers/CVRendererTimeline.tsx
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

export function CVRendererTimeline({ cv }: Props) {
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
        <div className="relative">
            {/* === DECOR (timeline vibe, visible preview + print) === */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                {/* top soft blobs */}
                <div className={`absolute -top-28 -left-28 h-80 w-80 rounded-full ${tone.bg50}`} />
                <div className={`absolute -top-36 left-52 h-72 w-72 rounded-full ${tone.bg100} opacity-60`} />
                <div className={`absolute -top-32 -right-28 h-96 w-96 rounded-full ${tone.bg50}`} />

                {/* subtle diagonal wash */}
                <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(0,0,0,0.03),transparent_55%)]" />

                {/* tiny dots */}
                <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
            </div>

            <div className="relative z-10 space-y-6">
                {/* === HERO (header + profile) === */}
                <div className="cv-block space-y-6">
                    {profileSection ? (
                        <div className="cv-section break-inside-avoid relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                            <div className={`absolute inset-x-0 top-0 h-2 ${tone.bg900}`} />

                            {/* hint of timeline in header */}
                            <div className={`pointer-events-none absolute left-7 top-0 bottom-0 w-px ${tone.bg100} opacity-80 z-0`} />
                            <div className={`pointer-events-none absolute left-[22px] top-7 h-3 w-3 rounded-full ${tone.bg900} z-0`} />
                            <div className={`pointer-events-none absolute left-[20px] top-10 h-4 w-4 rounded-full ${tone.bg100} opacity-80 z-0`} />

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

                {/* === TIMELINE BODY === */}
                <div className="cv-timeline grid grid-cols-12 gap-6">
                    <div className="col-span-12 space-y-6">
                        {rest.map((section) => renderSection(section, tone))}
                    </div>
                </div>
            </div>
        </div>
    );

    function renderSection(section: CVSection, toneObj: Tone) {
        switch (section.type) {
            case "experience":
                return (
                    <TimelineSection key={section.id} title="Experiencia" tone={toneObj} emphasis="high">
                        <ExperiencePreview data={section.data as ExperienceData} />
                    </TimelineSection>
                );
            case "education":
                return (
                    <TimelineSection key={section.id} title="Educación" tone={toneObj} emphasis="low">
                        <EducationPreview data={section.data as EducationData} />
                    </TimelineSection>
                );
            case "projects":
                return (
                    <TimelineSection key={section.id} title="Proyectos" tone={toneObj} emphasis="low">
                        <ProjectsPreview data={section.data as ProjectData[]} />
                    </TimelineSection>
                );
            case "skills":
                return (
                    <TimelineSection key={section.id} title="Skills" tone={toneObj} emphasis="high">
                        <SkillsPreview data={section.data as SkillData[]} />
                    </TimelineSection>
                );
            case "languages":
                return (
                    <TimelineSection key={section.id} title="Idiomas" tone={toneObj} emphasis="low">
                        <LanguagesPreview data={section.data as LanguageData[]} />
                    </TimelineSection>
                );
            case "custom": {
                const d = section.data as CustomData;
                const title = d.title?.trim() || "Sección";
                return (
                    <TimelineSection key={section.id} title={title} tone={toneObj} emphasis="low">
                        <CustomPreview data={d} />
                    </TimelineSection>
                );
            }
            default:
                return null;
        }
    }
}

function TimelineSection({
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
    const topStrip = emphasis === "high" ? tone.bg900 : tone.bg100;
    const dot = emphasis === "high" ? tone.bg900 : tone.bg100;

    return (
        // ✅ cv-section + break-inside para print WYSIWYG
        <section className="cv-section break-inside-avoid relative">
            {/* card */}
            <div className="relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                {/* top strip */}
                <div className={`absolute inset-x-0 top-0 h-1.5 ${topStrip}`} />

                {/* background blob */}
                <div className={`pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full ${tone.bg50} z-0`} />

                <div className="relative z-10 p-6">
                    {/* header row */}
                    <div className="flex items-center gap-3 min-w-0">
                        {/* dot */}
                        <span className={`shrink-0 h-3.5 w-3.5 rounded-full ${dot} shadow-sm`} aria-hidden />

                        <h2 className="cv-title border-b pb-1 flex-1 min-w-0 break-words">
                            {title}
                        </h2>

                        {/* small decorative ring (no text) */}
                        <span
                            className={`shrink-0 h-7 w-7 rounded-full border bg-white shadow-sm flex items-center justify-center ${tone.ring200} ring-2`}
                            aria-hidden
                        >
                            <span className={`h-2 w-2 rounded-full ${tone.bg900} opacity-70`} />
                        </span>
                    </div>

                    {/* timeline body */}
                    <div
                        className="cv-timeline-body mt-4 pl-6 min-w-0 break-words"
                        style={{ overflowWrap: "anywhere" }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
}