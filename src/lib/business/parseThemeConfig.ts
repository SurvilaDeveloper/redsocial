// src/lib/business/parseThemeConfig.ts
import type { BusinessThemeConfig } from "@/types/business-theme";
import type { Prisma } from "@prisma/client";

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseThemeConfig(
    value: Prisma.JsonValue | null | undefined
): Partial<BusinessThemeConfig> | undefined {
    if (!isPlainObject(value)) return undefined;

    // opcional: si querés exigir que al menos exista "preset" o "palette"
    const v = value as Record<string, unknown>;
    if (!("preset" in v) && !("palette" in v)) return undefined;

    return value as Partial<BusinessThemeConfig>;
}

