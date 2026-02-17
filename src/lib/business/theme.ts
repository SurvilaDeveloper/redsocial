// src/lib/business/theme.ts
import type { BusinessThemeConfig } from "@/types/business-theme";
import { mergeTheme } from "@/types/business-theme";

const FONT_FAMILY: Record<string, string> = {
    // genéricas / sistema
    system: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    sans: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    serif: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",

    // --- Sans (cargadas en layout.tsx)
    inter: "var(--font-inter), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    manrope: "var(--font-manrope), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    "plus-jakarta-sans":
        "var(--font-plus-jakarta-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    "space-grotesk":
        "var(--font-space-grotesk), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    "dm-sans": "var(--font-dm-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    urbanist: "var(--font-urbanist), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    poppins: "var(--font-poppins), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    montserrat: "var(--font-montserrat), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    rubik: "var(--font-rubik), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    outfit: "var(--font-outfit), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    "nunito-sans":
        "var(--font-nunito-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    lato: "var(--font-lato), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    "work-sans": "var(--font-work-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    "source-sans-3":
        "var(--font-source-sans-3), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    "open-sans": "var(--font-open-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    raleway: "var(--font-raleway), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",

    // --- Serif (cargadas en layout.tsx)
    merriweather: "var(--font-merriweather), ui-serif, Georgia, Cambria, serif",
    "playfair-display": "var(--font-playfair-display), ui-serif, Georgia, Cambria, serif",
    lora: "var(--font-lora), ui-serif, Georgia, Cambria, serif",
    "cormorant-garamond": "var(--font-cormorant-garamond), ui-serif, Georgia, Cambria, serif",
    "eb-garamond": "var(--font-eb-garamond), ui-serif, Georgia, Cambria, serif",
    spectral: "var(--font-spectral), ui-serif, Georgia, Cambria, serif",

    // --- Mono (cargadas en layout.tsx)
    "jetbrains-mono":
        "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    "fira-code":
        "var(--font-fira-code), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    "source-code-pro":
        "var(--font-source-code-pro), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    "ibm-plex-mono":
        "var(--font-ibm-plex-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",

    // opciones “extra” que están en TYPO_OPTIONS pero no requieren carga
    georgia: "Georgia, ui-serif, serif",
    roboto: "Roboto, ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial",
    ubuntu: "Ubuntu, ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial",
    "ui-monospace": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",

    // si querés ese modo
    "system-rounded": "ui-rounded, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
};



function toFontFamily(key: string) {
    return FONT_FAMILY[key] ?? FONT_FAMILY.system;
}

/**
 * Convierte themeConfig a CSS variables (inline style).
 * Lo usás en el layout público del micrositio (una sola vez).
 *
 * Naming:
 *  --b-<seccionAbrev>-<key>
 *  main => mn, header => hr, hero => ho, text => tx, features => fs,
 *  gallery => gy, cta => ca, productive => pe, components => cs
 */
export function themeToCssVars(raw?: Partial<BusinessThemeConfig> | null): Record<string, string> {
    const t = mergeTheme(raw ?? null);

    return {
        // =========================
        // preset
        // =========================
        "--b-pr-preset": t.preset, // theme preset id

        // =========================
        // Navbar (hr)
        // =========================
        "--b-hr-bbg": t.header.bbg,   // button background *
        "--b-hr-bbhr": t.header.bbhr, // button background hover *
        "--b-hr-bcr": t.header.bcr,   // button text color *
        "--b-hr-bty": toFontFamily(t.header.bty),   // button typography *
        "--b-hr-btse": t.header.btse, // button text size *
        "--b-hr-bbr": t.header.bbr,   // button border *
        "--b-hr-bbcr": t.header.bbcr, // button border color *
        "--b-hr-brs": t.header.brs,   // button radius *
        "--b-hr-ban": t.header.ban,   // button align +
        "--b-hr-bgp": t.header.bgp,   // button gap *
        "--b-hr-bbae": t.header.bbae, // button background active *
        "--b-hr-bcae": t.header.bcae, // button color active *
        "--b-hr-bbcae": t.header.bbcae,// button border color active *
        // =========================
        // components (cs)
        // =========================
        "--b-cs-button-variant": t.components.button.variant, // button visual variant
        "--b-cs-card-shadow": t.components.card.shadow,       // card shadow level

        // =========================
        // hero (ho)
        // =========================
        "--b-ho-bgcr": t.hero.bgcr, // hero background color *
        "--b-ho-br": t.hero.br,     // hero border *
        "--b-ho-bcr": t.hero.bcr,   // hero border color *
        "--b-ho-rs": t.hero.rs,     // hero radius *

        "--b-ho-tcr": t.hero.tcr,   // hero title color *
        "--b-ho-tty": toFontFamily(t.hero.tty),   // hero title typography *
        "--b-ho-ttse": t.hero.ttse, // hero title text size *
        "--b-ho-tatt": t.hero.tatt, // hero title align text *

        "--b-ho-scr": t.hero.scr,   // hero subtitle color *
        "--b-ho-sty": toFontFamily(t.hero.sty),   // hero subtitle typography *
        "--b-ho-stse": t.hero.stse, // hero subtitle text size *
        "--b-ho-satt": t.hero.satt, // hero subtitle align text *

        // =========================
        // text (tx)
        // =========================
        "--b-tx-bgcr": t.text.bgcr, // text background color *
        "--b-tx-br": t.text.br,     // text border *
        "--b-tx-bcr": t.text.bcr,   // text border color *
        "--b-tx-rs": t.text.rs,     // text radius *

        "--b-tx-tcr": t.text.tcr,   // text title color *
        "--b-tx-tty": toFontFamily(t.text.tty),   // text title typography *
        "--b-tx-ttse": t.text.ttsc, // text title text size *
        "--b-tx-tatt": t.text.tat,   // text title align text *

        "--b-tx-bycr": t.text.bycr,   // text body color *
        "--b-tx-byty": toFontFamily(t.text.byty),   // text body typography *
        "--b-tx-bytse": t.text.bytse, // text body text size *
        "--b-tx-byatt": t.text.byatt, // text body align text *

        // =========================
        // features (fs)
        // =========================
        "--b-fs-bgcr": t.features.bgcr, // features background color *
        "--b-fs-br": t.features.br,     // features border *
        "--b-fs-bcr": t.features.bcr,   // features border color *
        "--b-fs-rs": t.features.rs,     // features radius *
        //"--b-fs-col": t.features.col,   // features columns *

        "--b-fs-tcr": t.features.tcr,   // features title color *
        "--b-fs-tty": toFontFamily(t.features.tty),   // features title typography *
        "--b-fs-ttse": t.features.ttse, // features title text size *
        "--b-fs-tatt": t.features.tatt, // features title align text *

        "--b-fs-ibgcr": t.features.ibgcr, //features items background color *
        "--b-fs-ibr": t.features.ibr,     //features items border *
        "--b-fs-ibcr": t.features.ibcr,   //features items border color *
        "--b-fs-irs": t.features.irs,     //features items radius *

        "--b-fs-itcr": t.features.itcr,   // features items title color *
        "--b-fs-itty": toFontFamily(t.features.itty),   // features items title typography *
        "--b-fs-ittse": t.features.ittse, // features items title text size *
        "--b-fs-itatt": t.features.itatt, // features items title align text *

        "--b-fs-itxcr": t.features.itxcr,   // features text color *
        "--b-fs-itxty": toFontFamily(t.features.itxty),   // features text typography *
        "--b-fs-itxtse": t.features.itxtse, // features text text size *
        "--b-fs-itxatt": t.features.itxatt, // features text align text *

        // =========================
        // gallery (gy)
        // =========================
        "--b-gy-bgcr": t.gallery.bgcr, // gallery background color *
        "--b-gy-br": t.gallery.br,     // gallery border *
        "--b-gy-bcr": t.gallery.bcr,   // gallery border color *
        "--b-gy-rs": t.gallery.rs,     // gallery radius *

        "--b-gy-tcr": t.gallery.tcr,   // gallery title color *
        "--b-gy-tty": toFontFamily(t.gallery.tty),   // gallery title typography *
        "--b-gy-ttse": t.gallery.ttse, // gallery title text size *
        "--b-gy-tatt": t.gallery.tatt, // gallery title align text *

        "--b-gy-cbcr": t.gallery.cbcr, // gallery card bacgound color *
        "--b-gy-crs": t.gallery.crs, // gallery card radius *

        // =========================
        // cta (ca)
        // =========================
        "--b-ca-bgcr": t.cta.bgcr, // cta background color *
        "--b-ca-br": t.cta.br,     // cta border *
        "--b-ca-bcr": t.cta.bcr,   // cta border color *
        "--b-ca-rs": t.cta.rs,     // cta radius *

        "--b-ca-ticr": t.cta.ticr,  // cta title color *
        "--b-ca-tity": toFontFamily(t.cta.tity),  // cta title typography *
        "--b-ca-titse": t.cta.titse, // cta title text size *
        "--b-ca-tiatt": t.cta.tiatt, // cta title align text *

        "--b-ca-tcr": t.cta.tcr,   // cta text color *
        "--b-ca-tty": toFontFamily(t.cta.tty),   // cta text typography *
        "--b-ca-ttse": t.cta.ttse, // cta text size *
        "--b-ca-tatt": t.cta.tatt, // cta align text *

        "--b-ca-btbdcr": t.cta.btbdcr, //cta button background color *
        "--b-ca-btbdcrhv": t.cta.btbdcrhv, // cta button background color hover *
        "--b-ca-btbr": t.cta.btbr, // cta button border *
        "--b-ca-btbrcr": t.cta.btbrcr, // cta button border color *
        "--b-ca-btrs": t.cta.btrs, // cta button radius *

        "--b-ca-btcr": t.cta.btcr,   // cta button text color +
        "--b-ca-btty": toFontFamily(t.cta.btty),   // cta button typography *
        "--b-ca-bttse": t.cta.bttse, // cta button text size *
        "--b-ca-btan": t.cta.btan, // cta button align *

        // =========================
        // productive (pe)
        // =========================
        "--b-pe-bgcr": t.productive.bgcr, // productive background color
        "--b-pe-br": t.productive.br,     // productive border
        "--b-pe-bcr": t.productive.bcr,   // productive border color
        "--b-pe-rs": t.productive.rs,     // productive radius

        "--b-pe-tcr": t.productive.tcr,   // productive title color
        "--b-pe-tty": toFontFamily(t.productive.tty),   // productive title typography
        "--b-pe-yyse": t.productive.yyse, // productive title text size
        "--b-pe-tatt": t.productive.tatt, // productive title align text

        "--b-pe-itcr": t.productive.itcr,   // productive item title color
        "--b-pe-itty": toFontFamily(t.productive.itty),   // productive item title typography
        "--b-pe-itse": t.productive.itse,   // productive item title text size
        "--b-pe-itatt": t.productive.itatt, // productive item align text

        "--b-pe-itxcr": t.productive.itxcr,   // productive item text color
        "--b-pe-itxty": toFontFamily(t.productive.itxty),   // productive item text typography
        "--b-pe-itxtse": t.productive.itxtse, // productive item text text size
        "--b-pe-itxatt": t.productive.itxatt, // productive item text align text
    };
}


