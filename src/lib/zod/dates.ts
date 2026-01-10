// src/lib/zod/dates.ts
import { z } from "zod";

/* =========================================================
   Helpers: normalización
========================================================= */

const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);

export const optionalTrimmed = z.preprocess(
    trim,
    z.string().min(1).optional()
);

/* =========================================================
   Fechas
========================================================= */

// YYYY-MM (mes)
export const monthYYYYMM = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato esperado: YYYY-MM (ej: 2024-07)");

export const optionalMonthYYYYMM = z.preprocess(
    (v) => {
        const t = typeof v === "string" ? v.trim() : "";
        return t ? t : undefined;
    },
    monthYYYYMM.optional()
);

// YYYY (año)
export const yearYYYY = z
    .string()
    .regex(/^\d{4}$/, "Formato esperado: YYYY (ej: 2024)");

// Custom: YYYY o YYYY-MM
export const yearOrMonth = z.union([yearYYYY, monthYYYYMM]);

export const optionalYearOrMonth = z.preprocess(
    (v) => {
        const t = typeof v === "string" ? v.trim() : "";
        return t ? t : undefined;
    },
    yearOrMonth.optional()
);

// YYYY-MM-DD (día)
export const dateYYYYMMDD = z
    .string()
    .regex(
        /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
        "Formato esperado: YYYY-MM-DD"
    )
    .refine((s) => {
        // Validación real de calendario (evita 2024-02-31)
        const [y, m, d] = s.split("-").map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));
        return (
            dt.getUTCFullYear() === y &&
            dt.getUTCMonth() === m - 1 &&
            dt.getUTCDate() === d
        );
    }, "Fecha inválida");

export const optionalDateYYYYMMDD = z.preprocess(
    (v) => {
        const t = typeof v === "string" ? v.trim() : "";
        return t ? t : undefined;
    },
    dateYYYYMMDD.optional()
);

// BirthDate (no futura)
export const birthDateSchema = dateYYYYMMDD.superRefine((s, ctx) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));

    const now = new Date();
    const todayUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    if (dt > todayUTC) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha no puede ser futura",
        });
    }
});

export const optionalBirthDateSchema = z.preprocess(
    (v) => {
        const t = typeof v === "string" ? v.trim() : "";
        return t ? t : undefined;
    },
    birthDateSchema.optional()
);

/* =========================================================
   Comparación de rangos YYYY o YYYY-MM
========================================================= */

function monthKey(d?: string) {
    if (!d) return undefined;
    if (/^\d{4}$/.test(d)) return `${d}-01`; // YYYY -> YYYY-01
    return d; // YYYY-MM
}

export function endAfterStartRefine(
    data: { startDate?: string; endDate?: string },
    ctx: z.RefinementCtx
) {
    const s = monthKey(data.startDate);
    const e = monthKey(data.endDate);
    if (!s || !e) return;
    if (e < s) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message: "La fecha de fin no puede ser anterior a la de inicio",
        });
    }
}

/* =========================================================
   Mappers Date ⇄ string (UTC safe)
========================================================= */

export function dateFromYYYYMMDD(s: string): Date {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

export function yyyyMmDdFromDate(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
