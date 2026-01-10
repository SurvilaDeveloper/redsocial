// src/components/cv/renderers/CVRendererRibbonTheme.tsx
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
        publicId: typeof raw.publicId === "string" && raw.publicId.trim().length ? raw.publicId.trim() : null,
        show: Boolean(raw.show ?? false),
    };
}

export function CVRendererRibbonTheme({ cv }: Props) {
    // ✅ FINAL PATH: cv.styleConfig.theme.color
    // ✅ compat temporal: fallback a cv.color si existiera (mientras migrás UI/DB)
    const color = useMemo<CVThemeColor>(() => {
        const fromStyle = (cv as any)?.styleConfig?.theme?.color;
        const legacy = (cv as any)?.color;
        return coerceThemeColor(fromStyle ?? legacy);
    }, [cv]);

    const tone = useMemo(() => TONES[color], [color]);

    const sections = cv.content?.sections ?? [];
    const profileSection = sections.find((s) => s.type === "profile") as CVSection<"profile"> | undefined;

    const profileData = (profileSection?.data ?? { fullName: "" }) as ProfileData;
    const rest = sections.filter((s) => s.type !== "profile");

    // orden pensado para lectura
    const left = rest.filter((s) => s.type === "experience" || s.type === "education" || s.type === "custom");
    const right = rest.filter((s) => s.type === "skills" || s.type === "languages" || s.type === "projects");
    const ordered = [...left, ...right];

    const headerImage = getHeaderImageMeta(cv);

    return (
        <div className="relative">
            {/* ===== Background ribbon system (visible preview + print) ===== */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                {/* diagonal ribbon */}
                <div className={`absolute -top-24 left-[-30%] h-52 w-[160%] rotate-[-6deg] ${tone.bg900} opacity-[0.08]`} />
                <div className={`absolute -top-10 left-[-20%] h-32 w-[140%] rotate-[-6deg] ${tone.bg700} opacity-[0.08]`} />

                {/* corner chips */}
                <div className={`absolute -top-12 -right-12 h-44 w-44 rounded-full ${tone.bg900} opacity-[0.06]`} />
                <div className={`absolute bottom-10 -left-14 h-52 w-52 rounded-full ${tone.bg700} opacity-[0.06]`} />

                {/* subtle dots */}
                <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:22px_22px]" />
            </div>

            <div className="relative z-10 space-y-6">
                {/* ===== Header Zone (two cards side-by-side on lg, same in print) ===== */}
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-7 print:col-span-7 min-w-0">
                        {profileSection ? (
                            <div className="cv-section break-inside-avoid relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                                {/* top accent */}
                                <div className={`absolute inset-x-0 top-0 h-2 ${tone.bg900}`} />

                                {/* small deco */}
                                <div className={`pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full ${tone.bg100} z-0`} />
                                <div className={`pointer-events-none absolute -top-14 left-24 h-40 w-40 rounded-full ${tone.bg50} z-0`} />

                                <div className="relative z-10 p-7">
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

                    <div className="col-span-12 lg:col-span-5 print:col-span-5 min-w-0">
                        {profileSection ? (
                            <div className="cv-section break-inside-avoid relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                                <div className={`absolute inset-x-0 top-0 h-2 ${tone.bg900}`} />

                                {/* “chip stack” */}
                                <div className="pointer-events-none absolute right-4 top-4 z-0 flex gap-2">
                                    <span className={`h-3.5 w-10 rounded-full ${tone.bg900} opacity-[0.18]`} />
                                    <span className={`h-3.5 w-7 rounded-full ${tone.bg700} opacity-[0.18]`} />
                                    <span className={`h-3.5 w-4 rounded-full ${tone.bg800} opacity-[0.18]`} />
                                </div>

                                <div className="relative z-10 p-7">
                                    <div className="flex items-center justify-between gap-3 min-w-0">
                                        <h3 className="text-sm font-semibold tracking-wide text-neutral-900 min-w-0 break-words">
                                            Perfil
                                        </h3>

                                        {/* ✅ indicator only (selector will live in CVEditor later) */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-medium text-neutral-500">{color}</span>
                                            <div
                                                className={`h-8 w-8 rounded-2xl border bg-white shadow-sm flex items-center justify-center ${tone.ring200} ring-2`}
                                            >
                                                <div className={`h-2.5 w-2.5 rounded-full ${tone.bg900}`} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 h-px w-full bg-neutral-200/80" />

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

                {/* ===== Sections: stacked cards with “ribbon corner” ===== */}
                <div className="space-y-6">{ordered.map((section) => renderSection(section, tone))}</div>
            </div>
        </div>
    );

    function renderSection(section: CVSection, tone: Tone) {
        switch (section.type) {
            case "experience":
                return (
                    <RibbonSection key={section.id} title="Experiencia" tone={tone} emphasis="high">
                        <ExperiencePreview data={section.data as ExperienceData} />
                    </RibbonSection>
                );
            case "education":
                return (
                    <RibbonSection key={section.id} title="Educación" tone={tone} emphasis="low">
                        <EducationPreview data={section.data as EducationData} />
                    </RibbonSection>
                );
            case "projects":
                return (
                    <RibbonSection key={section.id} title="Proyectos" tone={tone} emphasis="low">
                        <ProjectsPreview data={section.data as ProjectData[]} />
                    </RibbonSection>
                );
            case "skills":
                return (
                    <RibbonSection key={section.id} title="Skills" tone={tone} emphasis="high">
                        <SkillsPreview data={section.data as SkillData[]} />
                    </RibbonSection>
                );
            case "languages":
                return (
                    <RibbonSection key={section.id} title="Idiomas" tone={tone} emphasis="low">
                        <LanguagesPreview data={section.data as LanguageData[]} />
                    </RibbonSection>
                );
            case "custom": {
                const d = section.data as CustomData;
                const title = d.title?.trim() || "Sección";
                return (
                    <RibbonSection key={section.id} title={title} tone={tone} emphasis="low">
                        <CustomPreview data={d} />
                    </RibbonSection>
                );
            }
            default:
                return null;
        }
    }
}

function RibbonSection({
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
    const topBar = emphasis === "high" ? tone.bg900 : tone.bg700;

    return (
        <section className="cv-section break-inside-avoid relative">
            <div className="relative overflow-hidden rounded-3xl border bg-white shadow-sm">
                {/* top bar */}
                <div className={`absolute inset-x-0 top-0 h-1.5 ${topBar}`} />

                {/* corner ribbon (diagonal) */}
                <div className="pointer-events-none absolute -top-8 right-6 z-0">
                    <div className={`h-24 w-24 rotate-45 rounded-2xl ${tone.bg900} opacity-[0.08]`} />
                </div>

                {/* header row */}
                <div className="relative z-10 px-6 pt-6 pb-4 min-w-0">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <span
                                className={`shrink-0 h-9 w-9 rounded-2xl border bg-white shadow-sm flex items-center justify-center ${tone.ring200} ring-2`}
                                aria-hidden
                            >
                                <span className={`h-2.5 w-2.5 rounded-full ${tone.bg900}`} />
                            </span>

                            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 min-w-0 break-words">{title}</h2>
                        </div>

                        {/* chips */}
                        <div className="shrink-0 flex items-center gap-2" aria-hidden>
                            <span className={`h-2.5 w-8 rounded-full ${tone.bg900} opacity-[0.18]`} />
                            <span className={`h-2.5 w-6 rounded-full ${tone.bg700} opacity-[0.18]`} />
                            <span className={`h-2.5 w-4 rounded-full ${tone.bg800} opacity-[0.18]`} />
                        </div>
                    </div>

                    <div className="mt-4 h-px w-full bg-neutral-200/80" />
                </div>

                {/* body */}
                <div className="relative z-10 px-6 pb-6 min-w-0">
                    <div className="min-w-0 break-words" style={{ overflowWrap: "anywhere" }}>
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
}


