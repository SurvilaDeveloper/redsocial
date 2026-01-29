//src/app/api/post-comment-responses/[id]/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/zod";

export const runtime = "nodejs";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const reporterId = Number(session.user.id);

    const { id } = await params;
    const responseId = Number(id);
    if (Number.isNaN(responseId)) {
        return NextResponse.json({ error: "Invalid response id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }
    const { reason, details } = parsed.data;

    const responseRow = await prisma.postCommentResponse.findUnique({
        where: { id: responseId },
        select: {
            id: true,
            active: true,
            who_responses: true,
        },
    });

    if (!responseRow || (responseRow.active ?? 1) !== 1) {
        return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    if (responseRow.who_responses === reporterId) {
        return NextResponse.json({ error: "You can't report your own response" }, { status: 400 });
    }

    try {
        const created = await prisma.contentReport.create({
            data: {
                reporterId,
                targetType: "RESPONSE",
                targetId: responseId,
                reason,
                details,
            },
            select: { id: true, createdAt: true },
        });

        return NextResponse.json({ ok: true, data: created });
    } catch (e: any) {
        if (e?.code === "P2002") {
            return NextResponse.json({ error: "Already reported" }, { status: 409 });
        }
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

