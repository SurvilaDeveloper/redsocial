import type { RateLimitRule } from "@/lib/rate-limit";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function rule(
    scope: string,
    subject: string,
    limit: number,
    windowSeconds: number,
    cost = 1
): RateLimitRule {
    return { scope, subject, limit, windowSeconds, cost };
}

const userSubject = (userId: string | number) => `user:${userId}`;
const ipSubject = (ip: string) => `ip:${ip}`;
const emailSubject = (email: string) =>
    `email:${email.trim().toLowerCase()}`;

export function registrationIpRules(ip: string) {
    const subject = ipSubject(ip);

    return [
        rule("register:ip:15m", subject, 5, 15 * MINUTE),
        rule("register:ip:24h", subject, 20, DAY),
    ];
}

export function registrationEmailRules(email: string) {
    const subject = emailSubject(email);

    return [
        rule("register:email:1h", subject, 3, HOUR),
        rule("register:email:24h", subject, 5, DAY),
    ];
}

export function verificationIpRules(ip: string) {
    return [rule("verification:ip:1h", ipSubject(ip), 10, HOUR)];
}

export function verificationEmailRules(email: string) {
    return [
        rule(
            "verification:email:1h",
            emailSubject(email),
            3,
            HOUR
        ),
    ];
}

export function authenticatedUploadRules(
    userId: string | number,
    ip: string
) {
    return [
        rule(
            "upload:all:user:10m",
            userSubject(userId),
            30,
            10 * MINUTE
        ),
        rule(
            "upload:all:user:24h",
            userSubject(userId),
            120,
            DAY
        ),
        rule(
            "upload:all:ip:10m",
            ipSubject(ip),
            100,
            10 * MINUTE
        ),
    ];
}

export function postUploadRules(userId: string | number) {
    const subject = userSubject(userId);

    return [
        rule("upload:post:user:5m", subject, 14, 5 * MINUTE),
        rule("upload:post:user:1h", subject, 60, HOUR),
    ];
}

export function profileUploadRules(userId: string | number) {
    const subject = userSubject(userId);

    return [
        rule("upload:profile:user:15m", subject, 6, 15 * MINUTE),
        rule("upload:profile:user:24h", subject, 20, DAY),
    ];
}

export function siteUploadRules(userId: string | number) {
    const subject = userSubject(userId);

    return [
        rule("upload:site:user:15m", subject, 40, 15 * MINUTE, 2),
        rule("upload:site:user:24h", subject, 200, DAY, 2),
    ];
}

export function cvUploadRules(userId: string | number) {
    const subject = userSubject(userId);

    return [
        rule("upload:cv:user:30m", subject, 20, 30 * MINUTE, 2),
        rule("upload:cv:user:24h", subject, 60, DAY, 2),
    ];
}

export function listingUploadRules({
    userId,
    listingType,
    listingId,
    mediaType,
}: {
    userId: string | number;
    listingType: "product" | "service";
    listingId: number;
    mediaType: string;
}) {
    const cost = mediaType.startsWith("video/") ? 3 : 1;

    return [
        rule(
            "upload:listing:user:30m",
            userSubject(userId),
            18,
            30 * MINUTE,
            cost
        ),
        rule(
            "upload:listing:user:24h",
            userSubject(userId),
            60,
            DAY,
            cost
        ),
        rule(
            "upload:listing:item:30m",
            `listing:${listingType}:${listingId}`,
            18,
            30 * MINUTE,
            cost
        ),
    ];
}

export function mediaReferenceRules(userId: string | number) {
    return [
        rule(
            "media-reference:user:10m",
            userSubject(userId),
            30,
            10 * MINUTE
        ),
    ];
}

export function businessContactRules(slug: string, ip: string) {
    return [
        rule(
            "business-contact:slug-ip:10m",
            `slug:${slug}:ip:${ip}`,
            5,
            10 * MINUTE
        ),
        rule(
            "business-contact:ip:1h",
            ipSubject(ip),
            20,
            HOUR
        ),
    ];
}
