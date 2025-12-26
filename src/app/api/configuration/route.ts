// src/app/api/configuration/route.ts
import { NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);

    let configuration = await prisma.configuration.findUnique({
        where: { userId },
    });

    // fallback defensivo
    if (!configuration) {
        configuration = await prisma.configuration.create({
            data: { userId },
        });
    }

    return NextResponse.json(configuration);
}

export async function PUT(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body = await req.json();

    // whitelist de campos editables
    const allowedFields = {
        profileImageVisibility: body.profileImageVisibility,
        coverImageVisibility: body.coverImageVisibility,
        fullProfileVisibility: body.fullProfileVisibility,

        wallVisibility: body.wallVisibility,
        postsVisibility: body.postsVisibility,
        postCommentsVisibility: body.postCommentsVisibility,
        postRepliesVisibility: body.postRepliesVisibility,

        mediaVisibility: body.mediaVisibility,
        mediaCommentsVisibility: body.mediaCommentsVisibility,
        mediaRepliesVisibility: body.mediaRepliesVisibility,

        friendsListVisibility: body.friendsListVisibility,
        followersListVisibility: body.followersListVisibility,
        followingListVisibility: body.followingListVisibility,

        likesVisibility: body.likesVisibility,
        privateMessagesVisibility: body.privateMessagesVisibility,
    };

    // eliminar undefined (muy importante)
    Object.keys(allowedFields).forEach((key) => {
        if (allowedFields[key as keyof typeof allowedFields] === undefined) {
            delete allowedFields[key as keyof typeof allowedFields];
        }
    });

    const configuration = await prisma.configuration.upsert({
        where: { userId },
        update: allowedFields,
        create: {
            userId,
            ...allowedFields,
        },
    });

    return NextResponse.json(configuration);
}
