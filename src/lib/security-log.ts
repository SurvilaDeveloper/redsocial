import { prisma } from "@/lib/prisma";
import { SecurityEventType } from "./security-events";

type LogSecurityParams = {
    userId?: number | null;
    type: SecurityEventType;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: any;
};

export async function logSecurityEvent({
    userId,
    type,
    ip,
    userAgent,
    metadata,
}: LogSecurityParams) {
    try {
        await prisma.securityLog.create({
            data: {
                userId: userId ?? undefined,
                type,
                ip: ip ?? undefined,
                userAgent: userAgent ?? undefined,
                metadata,
            },
        });
    } catch (err) {
        // ❗ NUNCA romper el flujo principal por un log
        console.error("SecurityLog error:", err);
    }
}
