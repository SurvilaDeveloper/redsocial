// src/components/cv/renderers/CVRendererSwitch.tsx  (ACTUALIZAR)
import type { EditorCV } from "@/types/cvEditor";
import type { CVStyleConfig } from "@/types/cvStyle";

import { CVRendererClassic } from "./CVRendererClassic";
import { CVRendererTwoColumns } from "./CVRendererTwoColumns";
import { CVRendererCompact } from "./CVRendererCompact";
import { CVRendererModernSidebar } from "./CVRendererModernSidebar";
import { CVRendererTimeline } from "./CVRendererTimeline";
import { CVRendererRightProfileAccent } from "./CVRendererRightProfileAccent";
import { CVRendererRibbonTheme } from "./CVRendererRibbonTheme";

export type CVTemplateId =
    | "classic"
    | "twoColumns"
    | "compact"
    | "modernSidebar"
    | "timeline"
    | "rightProfileAccent"
    | "ribbonTheme";

export function CVRendererSwitch({
    cv,
    styleConfig,
}: {
    cv: EditorCV;
    styleConfig: CVStyleConfig;
}) {
    const template = ((styleConfig as any)?.template ?? "classic") as CVTemplateId;

    switch (template) {
        case "rightProfileAccent":
            return <CVRendererRightProfileAccent cv={cv} />;
        case "modernSidebar":
            return <CVRendererModernSidebar cv={cv} />;
        case "timeline":
            return <CVRendererTimeline cv={cv} />;
        case "twoColumns":
            return <CVRendererTwoColumns cv={cv} />;
        case "compact":
            return <CVRendererCompact cv={cv} />;
        case "classic":
            return <CVRendererClassic cv={cv} />;
        case "ribbonTheme":
            return <CVRendererRibbonTheme cv={cv} />;
        default:
            return <CVRendererClassic cv={cv} />;
    }
}

