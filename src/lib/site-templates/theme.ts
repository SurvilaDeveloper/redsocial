// src/lib/site-templates/theme.ts
import { resolveFontFamily } from "@/lib/fonts/families";

type PlainObject = Record<string, any>;

function isPlainObject(v: unknown): v is PlainObject {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function safeStr(v: any, fallback = ""): string {
    const s = typeof v === "string" ? v.trim() : "";
    return s || fallback;
}

/**
 * Deep merge (simple) para presets + overrides.
 * - arrays: override reemplaza
 * - objects: merge recursivo
 * - primitives: override reemplaza
 */
function deepMerge<T extends PlainObject>(base: T, override: any): T {
    if (!isPlainObject(override)) return base;

    const out: PlainObject = { ...base };

    for (const k of Object.keys(override)) {
        const bv = (out as any)[k];
        const ov = (override as any)[k];

        if (Array.isArray(ov)) {
            out[k] = ov.slice();
            continue;
        }

        if (isPlainObject(bv) && isPlainObject(ov)) {
            out[k] = deepMerge({ ...bv }, ov);
            continue;
        }

        out[k] = ov;
    }

    return out as T;
}

/**
 * -----------------------------------------
 * Tipos del theme de /t (propios)
 * -----------------------------------------
 */
export type TemplateThemePresetId = "classic" | "minimal" | "userPreset";

export type TemplateThemeConfig = {
    preset: TemplateThemePresetId;

    main: { bg: string; surface: string; width: string };

    header: {
        bbg: string;
        bbhr: string;
        bcr: string;
        bty: string;
        btse: string;
        bbr: string;
        bbcr: string;
        brs: string;
        ban: string;
        bgp: string;
        bbae: string;
        bcae: string;
        bbcae: string;
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
        cbr: string;//card border NUEVO
        cbrcr: string;//card border color NUEVO
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
        cbgcr: string; // card background color
        cbr: string; // card border
        cbrcr: string; // card border color
        crs: string; //card radius
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
    contact: {
        bgcr: string;
        br: string;
        bcr: string;
        rs: string;

        lcr: string;
        lty: string;
        ltse: string;

        ibgcr: string;
        ibr: string;
        ibcr: string;
        irs: string;
        icr: string;

        ipcr: string; // placeholder
        ifcr: string; // focus border

        btbg: string;
        btbgHv: string;
        btbr: string;
        btbrcr: string;
        btrs: string;

        btcr: string;
        btty: string;
        bttse: string;
        btan: string; // start|center|end
    };


    components: { button: { variant: string }; card: { shadow: string } };
};

/**
 * -----------------------------------------
 * Presets propios de /t
 * -----------------------------------------
 */
const PRESETS: Record<Exclude<TemplateThemePresetId, "userPreset">, TemplateThemeConfig> = {
    classic: {
        preset: "classic",
        main: { bg: "#0b1220", surface: "#0b1220", width: "83%" },

        header: {
            bbg: "#111827",
            bbhr: "#1f2937",
            bcr: "#e5e7eb",
            bty: "system",
            btse: "14px",
            bbr: "1px",
            bbcr: "#334155",
            brs: "10px",
            ban: "start",
            bgp: "6px",
            bbae: "#0f172a",
            bcae: "#ffffff",
            bbcae: "#475569",
        },

        hero: {
            bgcr: "#0f172a",
            br: "1px",
            bcr: "#1f2937",
            rs: "16px",
            tcr: "#ffffff",
            tty: "system",
            ttse: "22px",
            tatt: "start",
            scr: "#cbd5e1",
            sty: "system",
            stse: "16px",
            satt: "start",
        },

        text: {
            bgcr: "#0f172a",
            br: "1px",
            bcr: "#1f2937",
            rs: "16px",
            tcr: "#ffffff",
            tty: "system",
            ttsc: "18px",
            tat: "start",
            bycr: "#cbd5e1",
            byty: "system",
            bytse: "14px",
            byatt: "start",
        },

        features: {
            bgcr: "#0f172a",
            br: "1px",
            bcr: "#1f2937",
            rs: "16px",
            tcr: "#ffffff",
            tty: "system",
            ttse: "18px",
            tatt: "start",
            ibgcr: "#111827",
            ibr: "1px",
            ibcr: "#1f2937",
            irs: "14px",
            itcr: "#ffffff",
            itty: "system",
            ittse: "14px",
            itatt: "start",
            itxcr: "#cbd5e1",
            itxty: "system",
            itxtse: "12px",
            itxatt: "start",
        },

        gallery: {
            bgcr: "#0f172a",
            br: "1px",
            bcr: "#1f2937",
            rs: "16px",
            tcr: "#ffffff",
            tty: "system",
            ttse: "16px",
            tatt: "start",
            cbcr: "#000000",
            cbr: "1px", //card border NUEVO
            cbrcr: "#111111", //card border color NUEVO
            crs: "12px",
        },

        cta: {
            bgcr: "#0f172a",
            br: "1px",
            bcr: "#1f2937",
            rs: "16px",
            ticr: "#ffffff",
            tity: "system",
            titse: "18px",
            tiatt: "start",
            tcr: "#cbd5e1",
            tty: "system",
            ttse: "14px",
            tatt: "start",
            btbdcr: "#22c55e",
            btbdcrhv: "#16a34a",
            btbr: "1px",
            btbrcr: "#34d399",
            btrs: "12px",
            btcr: "#052e16",
            btty: "system",
            bttse: "14px",
            btan: "start",
        },

        productive: {
            bgcr: "#0f172a",
            br: "1px",
            bcr: "#1f2937",
            rs: "16px",
            cbgcr: "#000000",   // card background color Nuevo
            cbr: "1px",         // card border nuevo
            cbrcr: "#dddddd",   // card border color Nuevo
            crs: "6px",         //card radius Nuevo
            tcr: "#ffffff",
            tty: "system",
            yyse: "16px",
            tatt: "start",
            itcr: "#ffffff",
            itty: "system",
            itse: "14px",
            itatt: "start",
            itxcr: "#cbd5e1",
            itxty: "system",
            itxtse: "12px",
            itxatt: "start",
        },
        contact: {
            bgcr: "#0f172a",
            br: "1px",
            bcr: "#1f2937",
            rs: "16px",

            lcr: "#cbd5e1",
            lty: "system",
            ltse: "12px",

            ibgcr: "#000000",
            ibr: "1px",
            ibcr: "#1f2937",
            irs: "12px",
            icr: "#e5e7eb",

            ipcr: "rgba(148,163,184,0.75)", // slate-400-ish
            ifcr: "rgba(148,163,184,0.9)",

            btbg: "#22c55e",
            btbgHv: "#16a34a",
            btbr: "1px",
            btbrcr: "#34d399",
            btrs: "12px",

            btcr: "#052e16",
            btty: "system",
            bttse: "14px",
            btan: "start",
        },

        components: { button: { variant: "solid" }, card: { shadow: "soft" } },
    },

    minimal: {
        preset: "minimal",
        main: { bg: "#0b1220", surface: "#0b1220", width: "83%" },

        header: {
            bbg: "transparent",
            bbhr: "rgba(255,255,255,0.06)",
            bcr: "#e5e7eb",
            bty: "system",
            btse: "14px",
            bbr: "1px",
            bbcr: "rgba(255,255,255,0.12)",
            brs: "999px",
            ban: "start",
            bgp: "8px",
            bbae: "rgba(255,255,255,0.10)",
            bcae: "#ffffff",
            bbcae: "rgba(255,255,255,0.18)",
        },

        hero: {
            bgcr: "transparent",
            br: "1px",
            bcr: "rgba(255,255,255,0.12)",
            rs: "18px",
            tcr: "#ffffff",
            tty: "system",
            ttse: "22px",
            tatt: "start",
            scr: "#cbd5e1",
            sty: "system",
            stse: "16px",
            satt: "start",
        },

        text: {
            bgcr: "transparent",
            br: "1px",
            bcr: "rgba(255,255,255,0.12)",
            rs: "18px",
            tcr: "#ffffff",
            tty: "system",
            ttsc: "18px",
            tat: "start",
            bycr: "#cbd5e1",
            byty: "system",
            bytse: "14px",
            byatt: "start",
        },

        features: {
            bgcr: "transparent",
            br: "1px",
            bcr: "rgba(255,255,255,0.12)",
            rs: "18px",
            tcr: "#ffffff",
            tty: "system",
            ttse: "18px",
            tatt: "start",
            ibgcr: "rgba(255,255,255,0.04)",
            ibr: "1px",
            ibcr: "rgba(255,255,255,0.10)",
            irs: "16px",
            itcr: "#ffffff",
            itty: "system",
            ittse: "14px",
            itatt: "start",
            itxcr: "#cbd5e1",
            itxty: "system",
            itxtse: "12px",
            itxatt: "start",
        },

        gallery: {
            bgcr: "transparent",
            br: "1px",
            bcr: "rgba(255,255,255,0.12)",
            rs: "18px",
            tcr: "#ffffff",
            tty: "system",
            ttse: "16px",
            tatt: "start",
            cbcr: "#000000",
            cbr: "1px", //card border NUEVO
            cbrcr: "#111111", //card border color NUEVO
            crs: "14px",
        },

        cta: {
            bgcr: "transparent",
            br: "1px",
            bcr: "rgba(255,255,255,0.12)",
            rs: "18px",
            ticr: "#ffffff",
            tity: "system",
            titse: "18px",
            tiatt: "start",
            tcr: "#cbd5e1",
            tty: "system",
            ttse: "14px",
            tatt: "start",
            btbdcr: "#ffffff",
            btbdcrhv: "rgba(255,255,255,0.9)",
            btbr: "1px",
            btbrcr: "rgba(255,255,255,0.3)",
            btrs: "999px",
            btcr: "#0b1220",
            btty: "system",
            bttse: "14px",
            btan: "start",
        },

        productive: {
            bgcr: "transparent",
            br: "1px",
            bcr: "rgba(255,255,255,0.12)",
            rs: "18px",
            cbgcr: "#000000",   // card background color Nuevo
            cbr: "1px",         // card border nuevo
            cbrcr: "#dddddd",   // card border color Nuevo
            crs: "6px",         //card radius Nuevo
            tcr: "#ffffff",
            tty: "system",
            yyse: "16px",
            tatt: "start",
            itcr: "#ffffff",
            itty: "system",
            itse: "14px",
            itatt: "start",
            itxcr: "#cbd5e1",
            itxty: "system",
            itxtse: "12px",
            itxatt: "start",
        },
        contact: {
            bgcr: "transparent",
            br: "1px",
            bcr: "rgba(255,255,255,0.12)",
            rs: "18px",

            lcr: "#cbd5e1",
            lty: "system",
            ltse: "12px",

            ibgcr: "rgba(0,0,0,0.4)",
            ibr: "1px",
            ibcr: "rgba(255,255,255,0.12)",
            irs: "14px",
            icr: "#e5e7eb",

            ipcr: "rgba(148,163,184,0.75)",
            ifcr: "rgba(255,255,255,0.25)",

            btbg: "#ffffff",
            btbgHv: "rgba(255,255,255,0.9)",
            btbr: "1px",
            btbrcr: "rgba(255,255,255,0.3)",
            btrs: "999px",

            btcr: "#0b1220",
            btty: "system",
            bttse: "14px",
            btan: "start",
        },


        components: { button: { variant: "ghost" }, card: { shadow: "none" } },
    },
};

export function resolveTemplateTheme(presetRaw: string | null | undefined, themeConfig: unknown): TemplateThemeConfig {
    const preset = safeStr(presetRaw, "classic") as TemplateThemePresetId;

    const base = preset === "minimal" ? PRESETS.minimal : PRESETS.classic;

    if (isPlainObject(themeConfig)) {
        const merged = deepMerge({ ...base }, themeConfig);

        const p2 = safeStr((themeConfig as any).preset);
        const finalPreset: TemplateThemePresetId =
            p2 === "minimal" || p2 === "classic" || p2 === "userPreset"
                ? (p2 as TemplateThemePresetId)
                : preset === "userPreset"
                    ? "userPreset"
                    : base.preset;

        return { ...merged, preset: finalPreset };
    }

    if (preset === "userPreset") return { ...PRESETS.classic, preset: "userPreset" };

    return base;
}

/**
 * Convierte el theme de /t a CSS variables (inline style).
 * Naming: --t-<section>-<key>
 */
export function templateThemeToCssVars(t: TemplateThemeConfig): Record<string, string> {
    return {
        "--t-pr-preset": t.preset,

        // header
        "--t-hr-bbg": t.header.bbg,
        "--t-hr-bbhr": t.header.bbhr,
        "--t-hr-bcr": t.header.bcr,
        "--t-hr-bty": resolveFontFamily(t.header.bty),
        "--t-hr-btse": t.header.btse,
        "--t-hr-bbr": t.header.bbr,
        "--t-hr-bbcr": t.header.bbcr,
        "--t-hr-brs": t.header.brs,
        "--t-hr-ban": t.header.ban,
        "--t-hr-bgp": t.header.bgp,
        "--t-hr-bbae": t.header.bbae,
        "--t-hr-bcae": t.header.bcae,
        "--t-hr-bbcae": t.header.bbcae,

        // components
        "--t-cs-button-variant": t.components.button.variant,
        "--t-cs-card-shadow": t.components.card.shadow,

        // hero
        "--t-ho-bgcr": t.hero.bgcr,
        "--t-ho-br": t.hero.br,
        "--t-ho-bcr": t.hero.bcr,
        "--t-ho-rs": t.hero.rs,
        "--t-ho-tcr": t.hero.tcr,
        "--t-ho-tty": resolveFontFamily(t.hero.tty),
        "--t-ho-ttse": t.hero.ttse,
        "--t-ho-tatt": t.hero.tatt,
        "--t-ho-scr": t.hero.scr,
        "--t-ho-sty": resolveFontFamily(t.hero.sty),
        "--t-ho-stse": t.hero.stse,
        "--t-ho-satt": t.hero.satt,

        // text
        "--t-tx-bgcr": t.text.bgcr,
        "--t-tx-br": t.text.br,
        "--t-tx-bcr": t.text.bcr,
        "--t-tx-rs": t.text.rs,
        "--t-tx-tcr": t.text.tcr,
        "--t-tx-tty": resolveFontFamily(t.text.tty),
        "--t-tx-ttse": t.text.ttsc,
        "--t-tx-tatt": t.text.tat,
        "--t-tx-bycr": t.text.bycr,
        "--t-tx-byty": resolveFontFamily(t.text.byty),
        "--t-tx-bytse": t.text.bytse,
        "--t-tx-byatt": t.text.byatt,

        // features
        "--t-fs-bgcr": t.features.bgcr,
        "--t-fs-br": t.features.br,
        "--t-fs-bcr": t.features.bcr,
        "--t-fs-rs": t.features.rs,
        "--t-fs-tcr": t.features.tcr,
        "--t-fs-tty": resolveFontFamily(t.features.tty),
        "--t-fs-ttse": t.features.ttse,
        "--t-fs-tatt": t.features.tatt,
        "--t-fs-ibgcr": t.features.ibgcr,
        "--t-fs-ibr": t.features.ibr,
        "--t-fs-ibcr": t.features.ibcr,
        "--t-fs-irs": t.features.irs,
        "--t-fs-itcr": t.features.itcr,
        "--t-fs-itty": resolveFontFamily(t.features.itty),
        "--t-fs-ittse": t.features.ittse,
        "--t-fs-itatt": t.features.itatt,
        "--t-fs-itxcr": t.features.itxcr,
        "--t-fs-itxty": resolveFontFamily(t.features.itxty),
        "--t-fs-itxtse": t.features.itxtse,
        "--t-fs-itxatt": t.features.itxatt,

        // gallery
        "--t-gy-bgcr": t.gallery.bgcr,
        "--t-gy-br": t.gallery.br,
        "--t-gy-bcr": t.gallery.bcr,
        "--t-gy-rs": t.gallery.rs,
        "--t-gy-tcr": t.gallery.tcr,
        "--t-gy-tty": resolveFontFamily(t.gallery.tty),
        "--t-gy-ttse": t.gallery.ttse,
        "--t-gy-tatt": t.gallery.tatt,
        "--t-gy-cbcr": t.gallery.cbcr,
        "--t-gy-cbr": t.gallery.cbr,//card border NUEVO
        "--t-gy-cbrcr": t.gallery.cbrcr,//card border color NUEVO
        "--t-gy-crs": t.gallery.crs,

        // cta
        "--t-ca-bgcr": t.cta.bgcr,
        "--t-ca-br": t.cta.br,
        "--t-ca-bcr": t.cta.bcr,
        "--t-ca-rs": t.cta.rs,
        "--t-ca-ticr": t.cta.ticr,
        "--t-ca-tity": resolveFontFamily(t.cta.tity),
        "--t-ca-titse": t.cta.titse,
        "--t-ca-tiatt": t.cta.tiatt,
        "--t-ca-tcr": t.cta.tcr,
        "--t-ca-tty": resolveFontFamily(t.cta.tty),
        "--t-ca-ttse": t.cta.ttse,
        "--t-ca-tatt": t.cta.tatt,
        "--t-ca-btbdcr": t.cta.btbdcr,
        "--t-ca-btbdcrhv": t.cta.btbdcrhv,
        "--t-ca-btbr": t.cta.btbr,
        "--t-ca-btbrcr": t.cta.btbrcr,
        "--t-ca-btrs": t.cta.btrs,
        "--t-ca-btcr": t.cta.btcr,
        "--t-ca-btty": resolveFontFamily(t.cta.btty),
        "--t-ca-bttse": t.cta.bttse,
        "--t-ca-btan": t.cta.btan,

        // productive
        "--t-pe-bgcr": t.productive.bgcr,
        "--t-pe-br": t.productive.br,
        "--t-pe-bcr": t.productive.bcr,
        "--t-pe-rs": t.productive.rs,
        "--t-pe-cbgcr": t.productive.cbgcr,   // card background color Nuevo
        "--t-pe-cbr": t.productive.cbr,         // card border nuevo
        "--t-pe-cbrcr": t.productive.cbrcr,   // card border color Nuevo
        "--t-pe-crs": t.productive.crs, // card border radius Nuevo
        "--t-pe-tcr": t.productive.tcr,
        "--t-pe-tty": resolveFontFamily(t.productive.tty),
        "--t-pe-yyse": t.productive.yyse,
        "--t-pe-tatt": t.productive.tatt,
        "--t-pe-itcr": t.productive.itcr,
        "--t-pe-itty": resolveFontFamily(t.productive.itty),
        "--t-pe-itse": t.productive.itse,
        "--t-pe-itatt": t.productive.itatt,
        "--t-pe-itxcr": t.productive.itxcr,
        "--t-pe-itxty": resolveFontFamily(t.productive.itxty),
        "--t-pe-itxtse": t.productive.itxtse,
        "--t-pe-itxatt": t.productive.itxatt,

        // contact
        "--t-co-bgcr": t.contact.bgcr,
        "--t-co-br": t.contact.br,
        "--t-co-bcr": t.contact.bcr,
        "--t-co-rs": t.contact.rs,

        "--t-co-lcr": t.contact.lcr,
        "--t-co-lty": resolveFontFamily(t.contact.lty),
        "--t-co-ltse": t.contact.ltse,

        "--t-co-ibgcr": t.contact.ibgcr,
        "--t-co-ibr": t.contact.ibr,
        "--t-co-ibcr": t.contact.ibcr,
        "--t-co-irs": t.contact.irs,
        "--t-co-icr": t.contact.icr,

        "--t-co-ipcr": t.contact.ipcr,
        "--t-co-ifcr": t.contact.ifcr,

        "--t-co-btbg": t.contact.btbg,
        "--t-co-btbgHv": t.contact.btbgHv,
        "--t-co-btbr": t.contact.btbr,
        "--t-co-btbrcr": t.contact.btbrcr,
        "--t-co-btrs": t.contact.btrs,

        "--t-co-btcr": t.contact.btcr,
        "--t-co-btty": resolveFontFamily(t.contact.btty),
        "--t-co-bttse": t.contact.bttse,
        "--t-co-btan": t.contact.btan,

    };
}