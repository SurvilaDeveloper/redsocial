// src/components/cv/renderers/CVRendererSwitch.tsx
import type { Curriculum } from "@/types/cv";

import { CVRendererClassic } from "./CVRendererClassic";
import { CVRendererCompact } from "./CVRendererCompact";
import { CVRendererModernSidebar } from "./CVRendererModernSidebar";
import { CVRendererTimeline } from "./CVRendererTimeline";
import { CVRendererRightProfileAccent } from "./CVRendererRightProfileAccent";
import { CVRendererRibbonTheme } from "./CVRendererRibbonTheme";

import type { CVTemplateId } from "@/types/cv";

export function CVRendererSwitch({ cv }: { cv: Curriculum }) {
    const template = ((cv.styleConfig?.template ?? "classic") as CVTemplateId);

    switch (template) {
        case "rightProfileAccent":
            return <CVRendererRightProfileAccent cv={cv} />;
        case "modernSidebar":
            return <CVRendererModernSidebar cv={cv} />;
        case "timeline":
            return <CVRendererTimeline cv={cv} />;
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


