// src/app/t/[templateId]/layout.tsx
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { TemplatePortal } from "@/components/site-templates/TemplatePortal";
import { getSiteTemplateById } from "@/lib/site-templates/siteTemplates";

import { resolveTemplateTheme, templateThemeToCssVars } from "@/lib/site-templates/theme";

export default async function PublicTemplateLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ templateId: string }>;
}) {
    const { templateId } = await params;

    const t = getSiteTemplateById(templateId);
    if (!t) notFound();

    // ✅ /t: theme vive en site (sin legacy, sin /b)
    const preset = String((t as any)?.site?.themePreset ?? "classic").trim() || "classic";
    const config = (t as any)?.site?.themeConfig ?? null;

    // ✅ engine propio (aislado)
    const resolvedTheme = resolveTemplateTheme(preset, config);

    // ✅ css vars propias: --t-*
    const cssVars = templateThemeToCssVars(resolvedTheme);

    //console.log(cssVars);

    return (
        <TemplatePortal>
            <div
                id="TEMPLATE"
                style={cssVars as React.CSSProperties}
                className="absolute top-0 min-h-dvh w-screen"
            >
                <main className="flex flex-row items-center justify-center">{children}</main>
            </div>
        </TemplatePortal>
    );
}
