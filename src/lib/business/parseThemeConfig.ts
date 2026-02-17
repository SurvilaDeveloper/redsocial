// src/lib/business/parseThemeConfig.ts
import type { BusinessThemeConfig, DefaultThemePresetId, ThemePresetId } from "@/types/business-theme";
import { DEFAULT_PRESETS, THEME_PRESETS } from "@/types/business-theme";
import type { Prisma } from "@prisma/client";

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isDefaultPresetId(v: string): v is DefaultThemePresetId {
    return (DEFAULT_PRESETS as readonly string[]).includes(v);
}

/**
 * Resuelve el theme "activo" para el sitio público.
 *
 * Regla:
 * - themePreset default => preset hardcodeado
 * - themePreset userPreset => lee themeConfig (si existe)
 * - backward compat: si themePreset falta, intenta leer themeConfig.preset
 *
 * Devuelve SIEMPRE un Partial para que themeToCssVars pueda mergear.
 */
export function parseThemeConfig(
    themePreset: string | null | undefined,
    themeConfig: Prisma.JsonValue | null | undefined
): Partial<BusinessThemeConfig> {
    const rawPreset = String(themePreset ?? "").trim();

    // --- 1) Si existe themePreset en DB, manda
    if (rawPreset === "userPreset") {
        // si hay config válida, la devolvemos forzando preset=userPreset
        if (isPlainObject(themeConfig)) {
            return { ...(themeConfig as any), preset: "userPreset" as ThemePresetId };
        }
        // sin config: igual exponemos userPreset, mergeTheme cae a base classic
        return { preset: "userPreset" as ThemePresetId };
    }

    if (isDefaultPresetId(rawPreset)) {
        const p = rawPreset as DefaultThemePresetId;
        // devolvemos el preset hardcodeado (y forzamos el preset por las dudas)
        return { ...THEME_PRESETS[p], preset: p };
    }

    // --- 2) Backward compat: si themePreset está vacío/invalid, probamos leer themeConfig.preset
    if (isPlainObject(themeConfig)) {
        const p = String((themeConfig as any)?.preset ?? "").trim();

        if (p === "userPreset") {
            return { ...(themeConfig as any), preset: "userPreset" as ThemePresetId };
        }

        if (isDefaultPresetId(p)) {
            const dp = p as DefaultThemePresetId;
            return { ...THEME_PRESETS[dp], preset: dp };
        }

        // si es objeto pero sin preset válido, lo dejamos como overrides sobre classic
        // (esto te permite soportar configs viejas parciales)
        return { ...(themeConfig as any), preset: "classic" as ThemePresetId };
    }

    // --- 3) Fallback final
    return { ...THEME_PRESETS.classic, preset: "classic" as ThemePresetId };
}