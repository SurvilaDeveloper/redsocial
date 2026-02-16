
//src/lib/rate-limit.ts

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimitTokenBucket({
    key,
    capacity,
    refillPerSec,
}: {
    key: string;
    capacity: number;
    refillPerSec: number;
}) {
    const now = Date.now();
    const b = buckets.get(key) ?? { tokens: capacity, updatedAt: now };
    const elapsed = Math.max(0, (now - b.updatedAt) / 1000);
    const nextTokens = Math.min(capacity, b.tokens + elapsed * refillPerSec);

    if (nextTokens < 1) {
        buckets.set(key, { tokens: nextTokens, updatedAt: now });
        return { ok: false, retryAfterSec: Math.ceil((1 - nextTokens) / refillPerSec) };
    }

    buckets.set(key, { tokens: nextTokens - 1, updatedAt: now });
    return { ok: true, retryAfterSec: 0 };
}

// Nota: esto es “best-effort” en serverless (memoria por instancia).
// Si querés 100% robusto, lo pasamos a Redis/Upstash/KV.
