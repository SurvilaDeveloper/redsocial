import { isIP } from "node:net";

import { RateLimitInfrastructureError } from "@/lib/rate-limit";

type HeaderReader = {
    get(name: string): string | null;
};

function normalizeIp(value: string) {
    let candidate = value.trim();

    if (candidate.startsWith("[")) {
        const closingBracket = candidate.indexOf("]");
        if (closingBracket > 0) {
            candidate = candidate.slice(1, closingBracket);
        }
    } else if (
        candidate.includes(".") &&
        candidate.split(":").length === 2
    ) {
        candidate = candidate.split(":")[0];
    }

    const zoneIndex = candidate.indexOf("%");
    if (zoneIndex > 0) candidate = candidate.slice(0, zoneIndex);

    return isIP(candidate) ? candidate.toLowerCase() : null;
}

export function getRateLimitClientIp(headers: HeaderReader) {
    const configuredHeader =
        process.env.RATE_LIMIT_IP_HEADER?.trim().toLowerCase();

    if (!configuredHeader && process.env.NODE_ENV === "production") {
        throw new RateLimitInfrastructureError(
            "RATE_LIMIT_IP_HEADER must be configured in production."
        );
    }

    const headerName = configuredHeader || "x-forwarded-for";
    const rawValue = headers.get(headerName);
    const firstValue =
        headerName === "x-forwarded-for"
            ? rawValue?.split(",")[0]?.trim()
            : rawValue?.trim();

    const normalized = firstValue ? normalizeIp(firstValue) : null;

    if (normalized) return normalized;

    if (process.env.NODE_ENV !== "production") {
        const localFallback = normalizeIp(
            headers.get("x-real-ip") ?? "127.0.0.1"
        );

        if (localFallback) return localFallback;
    }

    throw new RateLimitInfrastructureError(
        `Missing or invalid client IP in ${headerName}.`
    );
}
