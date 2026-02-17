// src/types/business-theme.ts

export const DEFAULT_PRESETS = ["classic", "modern", "bold", "minimal"] as const;
export type DefaultThemePresetId = (typeof DEFAULT_PRESETS)[number];

// ✅ Incluye userPreset para el selector (activo), aunque no sea hardcodeado
export type ThemePresetId = DefaultThemePresetId | "userPreset";

export type BusinessThemeConfig = {
    preset: ThemePresetId;

    header: {
        bbg: string;   // button background
        bbhr: string;  // button background hover
        bcr: string;   // button color
        bty: string;   // button typography
        btse: string;  // button text size
        bbr: string;   // button border
        bbcr: string;  // button border color
        brs: string;   // button radius
        ban: string;   // button align
        bgp: string;   // button gap

        bbae: string;  // button background active
        bcae: string;  // button color active
        bbcae: string; // button border color active
    };

    components: {
        button: { variant: "solid" | "soft" | "outline" };
        card: { shadow: "none" | "sm" | "md" };
    };

    hero: {
        bgcr: string;
        br: string;
        bcr: string;
        rs: string;
        tcr: string;
        tty: string;
        ttse: string;
        tatt: string;
        scr: string;
        sty: string;
        stse: string;
        satt: string;
    };

    text: {
        bgcr: string;
        br: string;
        bcr: string;
        rs: string;
        tcr: string;
        tty: string;
        ttsc: string;
        tat: string;
        bycr: string;
        byty: string;
        bytse: string;
        byatt: string;
    };

    features: {
        bgcr: string;
        br: string;
        bcr: string;
        rs: string;

        tcr: string;
        tty: string;
        ttse: string;
        tatt: string;

        ibgcr: string;
        ibr: string;
        ibcr: string;
        irs: string;

        itcr: string;
        itty: string;
        ittse: string;
        itatt: string;

        itxcr: string;
        itxty: string;
        itxtse: string;
        itxatt: string;
    };

    gallery: {
        bgcr: string;
        br: string;
        bcr: string;
        rs: string;
        tcr: string;
        tty: string;
        ttse: string;
        tatt: string;
        cbcr: string;
        crs: string;
    };

    cta: {
        bgcr: string;
        br: string;
        bcr: string;
        rs: string;

        ticr: string;
        tity: string;
        titse: string;
        tiatt: string;

        tcr: string;
        tty: string;
        ttse: string;
        tatt: string;

        btbdcr: string;
        btbdcrhv: string;
        btbr: string;
        btbrcr: string;
        btrs: string;

        btcr: string;
        btty: string;
        bttse: string;
        btan: string;
    };

    productive: {
        bgcr: string;
        br: string;
        bcr: string;
        rs: string;

        tcr: string;
        tty: string;
        yyse: string;
        tatt: string;

        itcr: string;
        itty: string;
        itse: string;
        itatt: string;

        itxcr: string;
        itxty: string;
        itxtse: string;
        itxatt: string;
    };
};

export const THEME_PRESETS: Record<DefaultThemePresetId, BusinessThemeConfig> = {
    classic: {
        preset: "classic",
        header: {
            bbg: "#444444",
            bbhr: "#555555",
            bcr: "#dddddd",
            bty: "system",
            btse: "20px",
            bbr: "1px",
            bbcr: "#dddddd",
            brs: "8px",
            ban: "start",
            bgp: "4px",
            bbae: "#444444",
            bcae: "#ffffff",
            bbcae: "#555555",
        },
        components: {
            button: { variant: "solid" },
            card: { shadow: "none" },
        },
        hero: {
            bgcr: "#111111",
            br: "1px",
            bcr: "#dddddd",
            rs: "8px",
            tcr: "#dddddd",
            tty: "system",
            ttse: "20px",
            tatt: "start",
            scr: "#dddddd",
            sty: "system",
            stse: "18px",
            satt: "start",
        },
        text: {
            bgcr: "#111111",
            br: "1px",
            bcr: "#dddddd",
            rs: "8px",
            tcr: "#dddddd",
            tty: "system",
            ttsc: "20px",
            tat: "start",
            bycr: "#dddddd",
            byty: "system",
            bytse: "18px",
            byatt: "start",
        },
        features: {
            bgcr: "#111111",
            br: "1px",
            bcr: "#dddddd",
            rs: "8px",
            tcr: "#dddddd",
            tty: "system",
            ttse: "20px",
            tatt: "start",
            ibgcr: "#222222",
            ibr: "1px",
            ibcr: "#dddddd",
            irs: "6px",
            itcr: "#dddddd",
            itty: "system",
            ittse: "18px",
            itatt: "start",
            itxcr: "#dddddd",
            itxty: "system",
            itxtse: "16px",
            itxatt: "start",
        },
        gallery: {
            bgcr: "#111111",
            br: "1px",
            bcr: "#dddddd",
            rs: "8px",
            tcr: "#dddddd",
            tty: "system",
            ttse: "16px",
            tatt: "start",
            cbcr: "#000000",
            crs: "6px",
        },
        cta: {
            bgcr: "#111111",
            br: "1px",
            bcr: "#dddddd",
            rs: "8px",
            ticr: "#dddddd",
            tity: "system",
            titse: "20px",
            tiatt: "start",
            tcr: "#dddddd",
            tty: "system",
            ttse: "16px",
            tatt: "start",
            btbdcr: "#22dd22",
            btbdcrhv: "#22ee22",
            btbr: "1px",
            btbrcr: "#33ff33",
            btrs: "4px",
            btcr: "#dddddd",
            btty: "system",
            bttse: "18px",
            btan: "start",
        },
        productive: {
            bgcr: "#111111",
            br: "1px",
            bcr: "#dddddd",
            rs: "8px",
            tcr: "#dddddd",
            tty: "system",
            yyse: "20px",
            tatt: "start",
            itcr: "#dddddd",
            itty: "system",
            itse: "18px",
            itatt: "start",
            itxcr: "#dddddd",
            itxty: "system",
            itxtse: "16px",
            itxatt: "start",
        },
    },

    // ✅ inventados para pruebas
    modern: {
        preset: "modern",
        header: {
            bbg: "#0b1220",
            bbhr: "#101b31",
            bcr: "#dbeafe",
            bty: "system",
            btse: "18px",
            bbr: "1px",
            bbcr: "#1e3a8a",
            brs: "12px",
            ban: "start",
            bgp: "6px",
            bbae: "#1d4ed8",
            bcae: "#ffffff",
            bbcae: "#60a5fa",
        },
        components: {
            button: { variant: "soft" },
            card: { shadow: "sm" },
        },
        hero: {
            bgcr: "#0b1220",
            br: "1px",
            bcr: "#1e293b",
            rs: "16px",
            tcr: "#e0f2fe",
            tty: "system",
            ttse: "26px",
            tatt: "start",
            scr: "#93c5fd",
            sty: "system",
            stse: "18px",
            satt: "start",
        },
        text: {
            bgcr: "#0b1220",
            br: "1px",
            bcr: "#1e293b",
            rs: "16px",
            tcr: "#e0f2fe",
            tty: "system",
            ttsc: "22px",
            tat: "start",
            bycr: "#cbd5e1",
            byty: "system",
            bytse: "18px",
            byatt: "start",
        },
        features: {
            bgcr: "#0b1220",
            br: "1px",
            bcr: "#1e293b",
            rs: "16px",
            tcr: "#e0f2fe",
            tty: "system",
            ttse: "22px",
            tatt: "start",
            ibgcr: "#0f172a",
            ibr: "1px",
            ibcr: "#1e293b",
            irs: "14px",
            itcr: "#e0f2fe",
            itty: "system",
            ittse: "18px",
            itatt: "start",
            itxcr: "#cbd5e1",
            itxty: "system",
            itxtse: "16px",
            itxatt: "start",
        },
        gallery: {
            bgcr: "#0b1220",
            br: "1px",
            bcr: "#1e293b",
            rs: "16px",
            tcr: "#e0f2fe",
            tty: "system",
            ttse: "16px",
            tatt: "start",
            cbcr: "#0f172a",
            crs: "12px",
        },
        cta: {
            bgcr: "#0b1220",
            br: "1px",
            bcr: "#1e293b",
            rs: "16px",
            ticr: "#e0f2fe",
            tity: "system",
            titse: "22px",
            tiatt: "start",
            tcr: "#cbd5e1",
            tty: "system",
            ttse: "16px",
            tatt: "start",
            btbdcr: "#2563eb",
            btbdcrhv: "#1d4ed8",
            btbr: "1px",
            btbrcr: "#60a5fa",
            btrs: "10px",
            btcr: "#ffffff",
            btty: "system",
            bttse: "18px",
            btan: "start",
        },
        productive: {
            bgcr: "#0b1220",
            br: "1px",
            bcr: "#1e293b",
            rs: "16px",
            tcr: "#e0f2fe",
            tty: "system",
            yyse: "22px",
            tatt: "start",
            itcr: "#e0f2fe",
            itty: "system",
            itse: "18px",
            itatt: "start",
            itxcr: "#cbd5e1",
            itxty: "system",
            itxtse: "16px",
            itxatt: "start",
        },
    },

    bold: {
        preset: "bold",
        header: {
            bbg: "#111111",
            bbhr: "#1f1f1f",
            bcr: "#ffffff",
            bty: "system",
            btse: "20px",
            bbr: "2px",
            bbcr: "#ffffff",
            brs: "2px",
            ban: "start",
            bgp: "8px",
            bbae: "#ffffff",
            bcae: "#111111",
            bbcae: "#ffffff",
        },
        components: {
            button: { variant: "outline" },
            card: { shadow: "md" },
        },
        hero: {
            bgcr: "#111111",
            br: "2px",
            bcr: "#ffffff",
            rs: "4px",
            tcr: "#ffffff",
            tty: "system",
            ttse: "30px",
            tatt: "start",
            scr: "#e5e5e5",
            sty: "system",
            stse: "20px",
            satt: "start",
        },
        text: {
            bgcr: "#111111",
            br: "2px",
            bcr: "#ffffff",
            rs: "4px",
            tcr: "#ffffff",
            tty: "system",
            ttsc: "24px",
            tat: "start",
            bycr: "#e5e5e5",
            byty: "system",
            bytse: "18px",
            byatt: "start",
        },
        features: {
            bgcr: "#111111",
            br: "2px",
            bcr: "#ffffff",
            rs: "4px",
            tcr: "#ffffff",
            tty: "system",
            ttse: "24px",
            tatt: "start",
            ibgcr: "#1f1f1f",
            ibr: "2px",
            ibcr: "#ffffff",
            irs: "4px",
            itcr: "#ffffff",
            itty: "system",
            ittse: "18px",
            itatt: "start",
            itxcr: "#e5e5e5",
            itxty: "system",
            itxtse: "16px",
            itxatt: "start",
        },
        gallery: {
            bgcr: "#111111",
            br: "2px",
            bcr: "#ffffff",
            rs: "4px",
            tcr: "#ffffff",
            tty: "system",
            ttse: "16px",
            tatt: "start",
            cbcr: "#1f1f1f",
            crs: "4px",
        },
        cta: {
            bgcr: "#111111",
            br: "2px",
            bcr: "#ffffff",
            rs: "4px",
            ticr: "#ffffff",
            tity: "system",
            titse: "24px",
            tiatt: "start",
            tcr: "#e5e5e5",
            tty: "system",
            ttse: "16px",
            tatt: "start",
            btbdcr: "#ffffff",
            btbdcrhv: "#e5e5e5",
            btbr: "2px",
            btbrcr: "#ffffff",
            btrs: "4px",
            btcr: "#111111",
            btty: "system",
            bttse: "18px",
            btan: "start",
        },
        productive: {
            bgcr: "#111111",
            br: "2px",
            bcr: "#ffffff",
            rs: "4px",
            tcr: "#ffffff",
            tty: "system",
            yyse: "24px",
            tatt: "start",
            itcr: "#ffffff",
            itty: "system",
            itse: "18px",
            itatt: "start",
            itxcr: "#e5e5e5",
            itxty: "system",
            itxtse: "16px",
            itxatt: "start",
        },
    },

    minimal: {
        preset: "minimal",
        header: {
            bbg: "#0b0b0b",
            bbhr: "#111111",
            bcr: "#e5e7eb",
            bty: "system",
            btse: "16px",
            bbr: "0px",
            bbcr: "#000000",
            brs: "999px",
            ban: "start",
            bgp: "6px",
            bbae: "#e5e7eb",
            bcae: "#0b0b0b",
            bbcae: "#000000",
        },
        components: {
            button: { variant: "solid" },
            card: { shadow: "none" },
        },
        hero: {
            bgcr: "#0b0b0b",
            br: "0px",
            bcr: "#000000",
            rs: "18px",
            tcr: "#f9fafb",
            tty: "system",
            ttse: "22px",
            tatt: "start",
            scr: "#9ca3af",
            sty: "system",
            stse: "16px",
            satt: "start",
        },
        text: {
            bgcr: "#0b0b0b",
            br: "0px",
            bcr: "#000000",
            rs: "18px",
            tcr: "#f9fafb",
            tty: "system",
            ttsc: "20px",
            tat: "start",
            bycr: "#d1d5db",
            byty: "system",
            bytse: "16px",
            byatt: "start",
        },
        features: {
            bgcr: "#0b0b0b",
            br: "0px",
            bcr: "#000000",
            rs: "18px",
            tcr: "#f9fafb",
            tty: "system",
            ttse: "20px",
            tatt: "start",
            ibgcr: "#111111",
            ibr: "0px",
            ibcr: "#000000",
            irs: "16px",
            itcr: "#f9fafb",
            itty: "system",
            ittse: "16px",
            itatt: "start",
            itxcr: "#d1d5db",
            itxty: "system",
            itxtse: "14px",
            itxatt: "start",
        },
        gallery: {
            bgcr: "#0b0b0b",
            br: "0px",
            bcr: "#000000",
            rs: "18px",
            tcr: "#f9fafb",
            tty: "system",
            ttse: "14px",
            tatt: "start",
            cbcr: "#111111",
            crs: "14px",
        },
        cta: {
            bgcr: "#0b0b0b",
            br: "0px",
            bcr: "#000000",
            rs: "18px",
            ticr: "#f9fafb",
            tity: "system",
            titse: "20px",
            tiatt: "start",
            tcr: "#d1d5db",
            tty: "system",
            ttse: "14px",
            tatt: "start",
            btbdcr: "#f9fafb",
            btbdcrhv: "#e5e7eb",
            btbr: "0px",
            btbrcr: "#000000",
            btrs: "999px",
            btcr: "#0b0b0b",
            btty: "system",
            bttse: "16px",
            btan: "start",
        },
        productive: {
            bgcr: "#0b0b0b",
            br: "0px",
            bcr: "#000000",
            rs: "18px",
            tcr: "#f9fafb",
            tty: "system",
            yyse: "20px",
            tatt: "start",
            itcr: "#f9fafb",
            itty: "system",
            itse: "16px",
            itatt: "start",
            itxcr: "#d1d5db",
            itxty: "system",
            itxtse: "14px",
            itxatt: "start",
        },
    },
};

/**
 * Merge seguro: completa con preset base (default) y aplica overrides.
 * - Si preset es userPreset, el base cae a classic (para defaults),
 *   y luego se aplica base/override.
 */
export function mergeTheme(
    base?: Partial<BusinessThemeConfig> | null,
    override?: Partial<BusinessThemeConfig> | null
): BusinessThemeConfig {
    const preset = (override?.preset ?? base?.preset ?? "classic") as ThemePresetId;

    // ✅ userPreset no está hardcodeado, así que tomamos classic como base visual
    const presetBase =
        preset === "userPreset"
            ? THEME_PRESETS.classic
            : (THEME_PRESETS[preset] ?? THEME_PRESETS.classic);

    return {
        preset,

        header: {
            ...presetBase.header,
            ...(base?.header ?? {}),
            ...(override?.header ?? {}),
        },

        components: {
            button: {
                ...presetBase.components.button,
                ...(base?.components?.button ?? {}),
                ...(override?.components?.button ?? {}),
            },
            card: {
                ...presetBase.components.card,
                ...(base?.components?.card ?? {}),
                ...(override?.components?.card ?? {}),
            },
        },

        hero: {
            ...presetBase.hero,
            ...(base?.hero ?? {}),
            ...(override?.hero ?? {}),
        },

        text: {
            ...presetBase.text,
            ...(base?.text ?? {}),
            ...(override?.text ?? {}),
        },

        features: {
            ...presetBase.features,
            ...(base?.features ?? {}),
            ...(override?.features ?? {}),
        },

        gallery: {
            ...presetBase.gallery,
            ...(base?.gallery ?? {}),
            ...(override?.gallery ?? {}),
        },

        cta: {
            ...presetBase.cta,
            ...(base?.cta ?? {}),
            ...(override?.cta ?? {}),
        },

        productive: {
            ...presetBase.productive,
            ...(base?.productive ?? {}),
            ...(override?.productive ?? {}),
        },
    };
}


