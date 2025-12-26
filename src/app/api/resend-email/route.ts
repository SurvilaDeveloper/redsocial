// app/api/resend-email/route.ts
import { NextResponse } from "next/server";
import { issueVerificationEmail } from "@/lib/verificationEmail";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        const result = await issueVerificationEmail(email);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, emailState: result.emailState });
    } catch {
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

