//src/app/api/business/slug/[slug]/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBusinessContactEmail } from "@/lib/email";
import { rateLimitTokenBucket } from "@/lib/rate-limit";

function isValidEmail(email: string) {
    // validación mínima (formato razonable)
    const s = String(email || "").trim();
    if (s.length < 6 || s.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;

        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") ||
            "unknown";

        // 5 envíos cada 10 minutos aprox => capacity=5, refill=5/600=0.00833
        const rl = rateLimitTokenBucket({
            key: `biz_contact:${slug}:${ip}`,
            capacity: 5,
            refillPerSec: 5 / 600,
        });
        if (!rl.ok) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        // Honeypot (anti spam barato)
        if (typeof body.company === "string" && body.company.trim().length > 0) {
            // fingimos ok para no dar feedback al bot
            return NextResponse.json({ ok: true });
        }

        const name = String(body.name ?? "").trim().slice(0, 80);
        const email = String(body.email ?? "").trim();
        const subject = String(body.subject ?? "").trim().slice(0, 120);
        const message = String(body.message ?? "").trim().slice(0, 4000);

        if (!isValidEmail(email)) {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }

        // si querés, podés permitir mensaje vacío; yo lo dejo requerido (mínimo)
        if (!message) {
            return NextResponse.json({ error: "Message required" }, { status: 400 });
        }

        const business = await prisma.business.findUnique({
            where: { slug },
            include: { site: true, owner: true },
        });

        if (!business || business.deletedAt != null || business.active !== 1) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const contactEmail = business.site?.contactEmail || business.owner.email;

        console.info("[business-contact] submit", {
            businessId: business.id,
            businessSlug: business.slug,
            ip,
            fromEmail: email,
            hasName: !!name,
            hasSubject: !!subject,
            messageLen: message.length,
        });

        // si el dueño no quiere form
        if (business.site?.showContactForm === false) {
            return NextResponse.json({ error: "Contact form disabled" }, { status: 403 });
        }

        await sendBusinessContactEmail({
            businessName: business.name,
            toOwnerEmail: contactEmail,
            fromEmail: email,
            fromName: name || undefined,
            subject: subject || undefined,
            message,
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("POST /api/business/[slug]/contact error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
