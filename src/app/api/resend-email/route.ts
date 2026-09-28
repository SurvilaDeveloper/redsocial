// app/api/resend-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { issueVerificationEmail } from "@/lib/verificationEmail";
import { getRateLimitClientIp } from "@/lib/rate-limit-client-ip";
import {
    verificationEmailRules,
    verificationIpRules,
} from "@/lib/rate-limit-policies";
import {
    enforceRateLimits,
    isRateLimitInfrastructureError,
    rateLimitUnavailableResponse,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    try {
        const ip = getRateLimitClientIp(request.headers);
        const ipRateLimited = await enforceRateLimits(
            verificationIpRules(ip)
        );

        if (ipRateLimited) return ipRateLimited;

        const { email } = await request.json();

        const emailRateLimited = await enforceRateLimits(
            verificationEmailRules(String(email ?? ""))
        );

        if (emailRateLimited) return emailRateLimited;

        const result = await issueVerificationEmail(email);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, emailState: result.emailState });
    } catch (error) {
        if (isRateLimitInfrastructureError(error)) {
            console.error("resend-email rate limit error:", error);
            return rateLimitUnavailableResponse();
        }

        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

