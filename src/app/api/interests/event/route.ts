// src/app/api/interests/event/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { z } from "zod";
import { trackPostEventAndApplyProfile } from "@/lib/interests/events";

export const runtime = "nodejs";

const schema = z.object({
    postId: z.number().int().positive(),
    type: z.enum(["view", "like", "own_post"]),
    dwellMs: z.number().int().nonnegative().optional(),
    weight: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const userId = Number(session.user.id);

    const result = await trackPostEventAndApplyProfile({
        userId,
        postId: parsed.data.postId,
        type: parsed.data.type,
        dwellMs: parsed.data.dwellMs ?? null,
        weight: parsed.data.weight,
    });

    return NextResponse.json(result);
}