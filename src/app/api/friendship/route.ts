import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, subject } = await req.json();
    const friendOne = parseInt(session.user.id);

    if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    function relationState(o: {
        a_b_req: number | undefined,
        a_b_res: number | undefined,
        b_a_req: number | undefined,
        b_a_res: number | undefined
    } | null): number {
        if (o) {
            if (o.a_b_req === 0 && o.a_b_res === 0 && o.b_a_req === 0 && o.b_a_res === 0) {
                return 1

            } else if (o.a_b_req === 1 && o.a_b_res === 0 && o.b_a_req === 0 && o.b_a_res === 0) {
                return 2

            } else if (o.a_b_req === 0 && o.a_b_res === 0 && o.b_a_req === 1 && o.b_a_res === 0) {
                return 3

            } else if (o.a_b_req === 0 && o.a_b_res === 1 && o.b_a_req === 1 && o.b_a_res === 0) {
                return 4

            } else if (o.a_b_req === 1 && o.a_b_res === 0 && o.b_a_req === 0 && o.b_a_res === 1) {
                return 5

            } else if (o.a_b_req === 0 && o.a_b_res === 1 && o.b_a_req === 0 && o.b_a_res === 0) {
                return 6

            } else if (o.a_b_req === 0 && o.a_b_res === 0 && o.b_a_req === 0 && o.b_a_res === 1) {
                return 7

            } else if (o.a_b_req === 1 && o.a_b_res === 1 && o.b_a_req === 1 && o.b_a_res === 1) {
                return 8
            }
        }
        return 0
    }

    async function setFriendship(o: { req1: number, res1: number, req2: number, res2: number }): Promise<boolean> {
        try {
            await prisma.$transaction(async (prisma) => {
                await prisma.friendship.upsert({
                    where: {
                        friend_one_friend_two: { friend_one: friendOne, friend_two: userId }
                    },
                    update: { friend_request: o.req1, friend_response: o.res1 },
                    create: { friend_one: friendOne, friend_two: userId, friend_request: o.req1, friend_response: o.res1 }
                });
                await prisma.friendship.upsert({
                    where: {
                        friend_one_friend_two: { friend_one: userId, friend_two: friendOne }
                    },
                    update: { friend_request: o.req2, friend_response: o.res2 },
                    create: { friend_one: userId, friend_two: friendOne, friend_request: o.req2, friend_response: o.res2 }
                });
            });
            return true; // Si todo salió bien
        } catch (error) {
            console.error("Error en setFriendship:", error);
            return false; // Si hubo un error
        }
    }
    try {
        const oneToTwo = await prisma.friendship.findFirst({
            where: { friend_one: friendOne, friend_two: userId }
        });

        const twoToOne = await prisma.friendship.findFirst({
            where: { friend_one: userId, friend_two: friendOne }
        });

        const variables = {
            a_b_req: oneToTwo?.friend_request,
            a_b_res: oneToTwo?.friend_response,
            b_a_req: twoToOne?.friend_request,
            b_a_res: twoToOne?.friend_response
        }

        const relState = relationState(variables)
        let setFriendshipSuccess: boolean;
        let newRelState: number;
        if (subject === "get") {
            return NextResponse.json({ relState })
        } else if (subject === "sendRequest") { //
            if (relState === 3) {
                setFriendshipSuccess = await setFriendship({ req1: 1, res1: 1, req2: 1, res2: 1 })
                newRelState = 8
            } else {
                setFriendshipSuccess = await setFriendship({ req1: 1, res1: 0, req2: 0, res2: 0 })
                newRelState = 2
            }
        } else if (subject === "acceptRequest") {
            setFriendshipSuccess = await setFriendship({ req1: 1, res1: 1, req2: 1, res2: 1 })
            newRelState = 8
        } else if (subject === "rejectRequest") {
            setFriendshipSuccess = await setFriendship({ req1: 0, res1: 1, req2: 1, res2: 0 })
            newRelState = 4
        } else if (subject === "deleteFriendship") {
            setFriendshipSuccess = await setFriendship({ req1: 0, res1: 1, req2: 0, res2: 0 })
            newRelState = 6
        } else if (subject === "cancelRequest") {
            setFriendshipSuccess = await setFriendship({ req1: 0, res1: 0, req2: 0, res2: 0 })
            newRelState = 1
        } else {
            return NextResponse.json({ relState, message: "No hubo cambios en la tabla friendship" })
        }
        return NextResponse.json({
            relState: newRelState,
            message:
                setFriendshipSuccess ?
                    "Se modifico la tabla friendship con exito"
                    :
                    "Hubo un error al actualizar la tabla friendship"
        })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}