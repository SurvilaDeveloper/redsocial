// src/lib/client-timezone.ts
export function getClientTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
