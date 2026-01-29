//src/lib/reportReasons.ts
export const REPORT_REASONS = [
    { value: "spam", label: "Spam o publicidad" },
    { value: "harassment", label: "Acoso / amenazas / hostigamiento" },
    { value: "hate", label: "Odio / discriminación" },
    { value: "sexual", label: "Contenido sexual" },
    { value: "violence", label: "Violencia / incitación" },
    { value: "illegal", label: "Actividad ilegal" },
    { value: "privacy", label: "Datos personales / doxxing" },
    { value: "impersonation", label: "Suplantación de identidad" },
    { value: "misinformation", label: "Información falsa peligrosa" },
    { value: "other", label: "Otro" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];
