// src/types/cvTheme.ts

export type CVThemeColor = "slate" | "blue" | "green" | "red" | "violet" | "amber";

export type Tone = {
    // backgrounds
    bg900: string;
    bg800: string;
    bg700: string;
    bg100: string;
    bg50: string;

    // borders/rings/text accents
    ring200: string;
    border200: string;
    text900: string;
    text700: string;
};

export const TONES: Record<CVThemeColor, Tone> = {
    slate: {
        bg900: "bg-slate-900",
        bg800: "bg-slate-800",
        bg700: "bg-slate-700",
        bg100: "bg-slate-100",
        bg50: "bg-slate-50",
        ring200: "ring-slate-200",
        border200: "border-slate-200",
        text900: "text-slate-900",
        text700: "text-slate-700",
    },
    blue: {
        bg900: "bg-blue-900",
        bg800: "bg-blue-800",
        bg700: "bg-blue-700",
        bg100: "bg-blue-100",
        bg50: "bg-blue-50",
        ring200: "ring-blue-200",
        border200: "border-blue-200",
        text900: "text-blue-900",
        text700: "text-blue-700",
    },
    green: {
        bg900: "bg-green-900",
        bg800: "bg-green-800",
        bg700: "bg-green-700",
        bg100: "bg-green-100",
        bg50: "bg-green-50",
        ring200: "ring-green-200",
        border200: "border-green-200",
        text900: "text-green-900",
        text700: "text-green-700",
    },
    red: {
        bg900: "bg-red-900",
        bg800: "bg-red-800",
        bg700: "bg-red-700",
        bg100: "bg-red-100",
        bg50: "bg-red-50",
        ring200: "ring-red-200",
        border200: "border-red-200",
        text900: "text-red-900",
        text700: "text-red-700",
    },
    violet: {
        bg900: "bg-violet-900",
        bg800: "bg-violet-800",
        bg700: "bg-violet-700",
        bg100: "bg-violet-100",
        bg50: "bg-violet-50",
        ring200: "ring-violet-200",
        border200: "border-violet-200",
        text900: "text-violet-900",
        text700: "text-violet-700",
    },
    amber: {
        bg900: "bg-amber-900",
        bg800: "bg-amber-800",
        bg700: "bg-amber-700",
        bg100: "bg-amber-100",
        bg50: "bg-amber-50",
        ring200: "ring-amber-200",
        border200: "border-amber-200",
        text900: "text-amber-900",
        text700: "text-amber-700",
    },
};

export function coerceThemeColor(input: unknown): CVThemeColor {
    const v = typeof input === "string" ? (input.trim() as CVThemeColor) : null;
    return v && v in TONES ? v : "slate";
}
