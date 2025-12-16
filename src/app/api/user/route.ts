import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { email } = await req.json()

    const user = await prisma.user.findFirst({
        where: {
            email: email
        }
    })
    return NextResponse.json({ user: user })
}