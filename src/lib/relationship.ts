//src/lib/relationship.ts

import { prisma } from "@/lib/prisma";

export type RelationshipState =
    | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

//determina el estado de la relación de amistad entre dos usuarios
export function relationState(o: {
    a_b_req?: number;
    a_b_res?: number;
    b_a_req?: number;
    b_a_res?: number;
} | null): RelationshipState {

    if (!o) return 0;

    if (o.a_b_req === 0 && o.a_b_res === 0 && o.b_a_req === 0 && o.b_a_res === 0) return 1;
    if (o.a_b_req === 1 && o.a_b_res === 0 && o.b_a_req === 0 && o.b_a_res === 0) return 2;
    if (o.a_b_req === 0 && o.a_b_res === 0 && o.b_a_req === 1 && o.b_a_res === 0) return 3;
    if (o.a_b_req === 0 && o.a_b_res === 1 && o.b_a_req === 1 && o.b_a_res === 0) return 4;
    if (o.a_b_req === 1 && o.a_b_res === 0 && o.b_a_req === 0 && o.b_a_res === 1) return 5;
    if (o.a_b_req === 0 && o.a_b_res === 1 && o.b_a_req === 0 && o.b_a_res === 0) return 6;
    if (o.a_b_req === 0 && o.a_b_res === 0 && o.b_a_req === 0 && o.b_a_res === 1) return 7;
    if (o.a_b_req === 1 && o.a_b_res === 1 && o.b_a_req === 1 && o.b_a_res === 1) return 8;

    return 0;
}

//leedores el estado de la relación de amistad entre dos usuarios
export async function getRelationshipState(
    userA: number,
    userB: number
): Promise<RelationshipState> {

    const [oneToTwo, twoToOne] = await Promise.all([
        prisma.friendship.findFirst({
            where: { friend_one: userA, friend_two: userB }
        }),
        prisma.friendship.findFirst({
            where: { friend_one: userB, friend_two: userA }
        }),
    ]);

    return relationState({
        a_b_req: oneToTwo?.friend_request,
        a_b_res: oneToTwo?.friend_response,
        b_a_req: twoToOne?.friend_request,
        b_a_res: twoToOne?.friend_response,
    });
}

export async function setFriendship(
    userA: number,
    userB: number,
    o: { req1: number; res1: number; req2: number; res2: number }
): Promise<boolean> {
    try {
        await prisma.$transaction(async (tx) => {
            await tx.friendship.upsert({
                where: {
                    friend_one_friend_two: { friend_one: userA, friend_two: userB }
                },
                update: { friend_request: o.req1, friend_response: o.res1 },
                create: { friend_one: userA, friend_two: userB, friend_request: o.req1, friend_response: o.res1 }
            });

            await tx.friendship.upsert({
                where: {
                    friend_one_friend_two: { friend_one: userB, friend_two: userA }
                },
                update: { friend_request: o.req2, friend_response: o.res2 },
                create: { friend_one: userB, friend_two: userA, friend_request: o.req2, friend_response: o.res2 }
            });
        });

        return true;
    } catch (error) {
        console.error("Error en setFriendship:", error);
        return false;
    }
}


