// src/lib/fonts/families.ts

/**
 * Fuente única de verdad para:
 * - resolver font-family real desde una key (system, inter, etc.)
 * - renderizar previews en el editor
 * - lista de opciones TYPO_OPTIONS
 *
 * IMPORTANTE: las keys guardadas en DB / JSON deben coincidir con estas keys.
 */

export const FONT_FAMILY: Record<string, string> = {
    // genéricas / sistema
    system: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    sans: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    serif: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",

    // Sans (next/font/google variables)
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

    // Serif (next/font/google variables)
    merriweather: "var(--font-merriweather), ui-serif, Georgia, Cambria, serif",
    "playfair-display": "var(--font-playfair-display), ui-serif, Georgia, Cambria, serif",
    lora: "var(--font-lora), ui-serif, Georgia, Cambria, serif",
    "cormorant-garamond": "var(--font-cormorant-garamond), ui-serif, Georgia, Cambria, serif",
    "eb-garamond": "var(--font-eb-garamond), ui-serif, Georgia, Cambria, serif",
    spectral: "var(--font-spectral), ui-serif, Georgia, Cambria, serif",

    // Mono (next/font/google variables)
    "jetbrains-mono":
        "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    "fira-code":
        "var(--font-fira-code), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    "source-code-pro":
        "var(--font-source-code-pro), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    "ibm-plex-mono":
        "var(--font-ibm-plex-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",

    // extras sin next/font
    georgia: "Georgia, ui-serif, serif",
    roboto: "Roboto, ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial",
    ubuntu: "Ubuntu, ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial",
    "ui-monospace": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",

    "system-rounded": "ui-rounded, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
};

export function resolveFontFamily(key: string) {
    const k = String(key || "").trim();
    return FONT_FAMILY[k] ?? FONT_FAMILY.system;
}

// alias legacy (ya lo usás en editores)
export function previewFontFamily(key: string) {
    return resolveFontFamily(key);
}

export const TYPO_OPTIONS = [
    "system",
    "sans",
    "serif",
    "mono",

    "inter",
    "manrope",
    "plus-jakarta-sans",
    "space-grotesk",
    "dm-sans",
    "urbanist",
    "poppins",
    "montserrat",
    "rubik",
    "outfit",
    "nunito-sans",
    "lato",
    "work-sans",
    "source-sans-3",
    "open-sans",
    "raleway",
    "roboto",
    "ubuntu",
    "system-rounded",

    // Serif
    "georgia",
    "merriweather",
    "playfair-display",
    "lora",
    "cormorant-garamond",
    "eb-garamond",
    "spectral",

    // Mono
    "jetbrains-mono",
    "fira-code",
    "source-code-pro",
    "ibm-plex-mono",
    "ui-monospace",
] as const satisfies readonly string[];