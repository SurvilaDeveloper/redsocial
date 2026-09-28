import { createHmac } from "node:crypto";

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export type RateLimitRule = {
    scope: string;
    subject: string;
    limit: number;
    windowSeconds: number;
    cost?: number;
};

export type RateLimitDecision = {
    ok: boolean;
    retryAfterSec: number;
    violatedScopes: string[];
};

type RateLimitRow = {
    scope: string;
    count: number;
    limitValue: number;
    remaining: number;
    retryAfterSec: number;
};

export class RateLimitInfrastructureError extends Error {
    constructor(message: string, options?: { cause?: unknown }) {
        super(message, options);
        this.name = "RateLimitInfrastructureError";
    }
}

function getRateLimitSecret() {
    const secret =
        process.env.RATE_LIMIT_SECRET?.trim() ||
        process.env.AUTH_SECRET?.trim();

    if (!secret) {
        throw new RateLimitInfrastructureError(
            "RATE_LIMIT_SECRET or AUTH_SECRET must be configured."
        );
    }

    return secret;
}

function hashSubject(subject: string) {
    return createHmac("sha256", getRateLimitSecret())
        .update(subject)
        .digest("hex");
}

function normalizeRules(rules: RateLimitRule[]) {
    const seen = new Set<string>();

    return rules.map((rule) => {
        const scope = rule.scope.trim();
        const subject = rule.subject.trim();
        const limit = Math.trunc(rule.limit);
        const windowSeconds = Math.trunc(rule.windowSeconds);
        const cost = Math.trunc(rule.cost ?? 1);

        if (!scope || scope.length > 100) {
            throw new RateLimitInfrastructureError(
                "Invalid rate-limit scope."
            );
        }

        if (!subject || limit <= 0 || windowSeconds <= 0 || cost <= 0) {
            throw new RateLimitInfrastructureError(
                "Invalid rate-limit rule."
            );
        }

        const subjectHash = hashSubject(subject);
        const uniqueKey = `${scope}:${subjectHash}`;

        if (seen.has(uniqueKey)) {
            throw new RateLimitInfrastructureError(
                `Duplicate rate-limit rule: ${scope}`
            );
        }

        seen.add(uniqueKey);

        return {
            scope,
            subject_hash: subjectHash,
            limit_value: limit,
            window_seconds: windowSeconds,
            cost,
        };
    });
}

async function cleanupExpiredBucketsBestEffort() {
    if (Math.random() >= 0.01) return;

    try {
        await prisma.$executeRaw(Prisma.sql`
            DELETE FROM "rate_limit_bucket"
            WHERE ctid IN (
                SELECT ctid
                FROM "rate_limit_bucket"
                WHERE "expiresAt" < clock_timestamp()
                LIMIT 200
            )
        `);
    } catch (error) {
        console.warn("rate-limit cleanup failed:", error);
    }
}

export async function consumeRateLimits(
    rules: RateLimitRule[]
): Promise<RateLimitDecision> {
    if (rules.length === 0) {
        return {
            ok: true,
            retryAfterSec: 0,
            violatedScopes: [],
        };
    }

    const normalized = normalizeRules(rules);
    const payload = JSON.stringify(normalized);

    try {
        const rows = await prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
            WITH input AS (
                SELECT
                    item.scope,
                    item.subject_hash,
                    item.limit_value,
                    item.window_seconds,
                    item.cost,
                    to_timestamp(
                        floor(
                            extract(epoch FROM clock_timestamp()) /
                            item.window_seconds
                        ) * item.window_seconds
                    ) AS window_started_at
                FROM jsonb_to_recordset(${payload}::jsonb) AS item(
                    scope text,
                    subject_hash text,
                    limit_value integer,
                    window_seconds integer,
                    cost integer
                )
            ),
            consumed AS (
                INSERT INTO "rate_limit_bucket" (
                    "scope",
                    "subjectHash",
                    "windowStartedAt",
                    "count",
                    "limitValue",
                    "windowSeconds",
                    "expiresAt",
                    "updatedAt"
                )
                SELECT
                    scope,
                    subject_hash,
                    window_started_at,
                    cost,
                    limit_value,
                    window_seconds,
                    window_started_at + make_interval(secs => window_seconds * 2),
                    clock_timestamp()
                FROM input
                ON CONFLICT ("scope", "subjectHash") DO UPDATE SET
                    "windowStartedAt" = CASE
                        WHEN "rate_limit_bucket"."windowStartedAt" < EXCLUDED."windowStartedAt"
                            THEN EXCLUDED."windowStartedAt"
                        ELSE "rate_limit_bucket"."windowStartedAt"
                    END,
                    "count" = CASE
                        WHEN "rate_limit_bucket"."windowStartedAt" < EXCLUDED."windowStartedAt"
                            THEN EXCLUDED."count"
                        ELSE LEAST(
                            "rate_limit_bucket"."count" + EXCLUDED."count",
                            EXCLUDED."limitValue" + 1
                        )
                    END,
                    "limitValue" = EXCLUDED."limitValue",
                    "windowSeconds" = EXCLUDED."windowSeconds",
                    "expiresAt" = EXCLUDED."expiresAt",
                    "updatedAt" = clock_timestamp()
                RETURNING
                    "scope",
                    "count",
                    "limitValue",
                    "windowSeconds",
                    "windowStartedAt"
            )
            SELECT
                "scope",
                "count",
                "limitValue",
                GREATEST("limitValue" - "count", 0)::integer AS "remaining",
                GREATEST(
                    CEIL(
                        extract(
                            epoch FROM (
                                "windowStartedAt" +
                                make_interval(secs => "windowSeconds") -
                                clock_timestamp()
                            )
                        )
                    ),
                    1
                )::integer AS "retryAfterSec"
            FROM consumed
        `);

        await cleanupExpiredBucketsBestEffort();

        const denied = rows.filter((row) => row.count > row.limitValue);

        return {
            ok: denied.length === 0,
            retryAfterSec:
                denied.length === 0
                    ? 0
                    : Math.max(...denied.map((row) => row.retryAfterSec)),
            violatedScopes: denied.map((row) => row.scope),
        };
    } catch (error) {
        if (error instanceof RateLimitInfrastructureError) {
            throw error;
        }

        throw new RateLimitInfrastructureError(
            "Persistent rate limiter is unavailable.",
            { cause: error }
        );
    }
}

export async function enforceRateLimits(rules: RateLimitRule[]) {
    let decision: RateLimitDecision;

    try {
        decision = await consumeRateLimits(rules);
    } catch (error) {
        console.error("rate-limit enforcement failed:", error);
        return rateLimitUnavailableResponse();
    }

    if (decision.ok) return null;

    return NextResponse.json(
        {
            error: "Demasiadas solicitudes. Intenta nuevamente mas tarde.",
            code: "RATE_LIMITED",
            retryAfterSec: decision.retryAfterSec,
        },
        {
            status: 429,
            headers: {
                "Retry-After": String(decision.retryAfterSec),
                "Cache-Control": "no-store",
            },
        }
    );
}

export function isRateLimitInfrastructureError(error: unknown) {
    return error instanceof RateLimitInfrastructureError;
}

export function rateLimitUnavailableResponse() {
    return NextResponse.json(
        {
            error: "El control de solicitudes no esta disponible temporalmente.",
            code: "RATE_LIMIT_UNAVAILABLE",
        },
        {
            status: 503,
            headers: {
                "Cache-Control": "no-store",
            },
        }
    );
}
