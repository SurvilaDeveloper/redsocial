// src/app/api/profile/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

const nullableString = (max: number) =>
    z
        .string()
        .max(max)
        .optional()
        .nullable()
        .transform((v) => (v == null || v === "" ? null : v));

const profileUpdateSchema = z.object({
    nick: nullableString(50).refine(
        (v) => v == null || v.length >= 2,
        "El nick debe tener al menos 2 caracteres"
    ),
    bio: nullableString(500),

    phoneNumber: nullableString(30),
    movilNumber: nullableString(30),

    birthday: z.union([z.string().datetime(), z.null()]).optional(),

    // 🌍 Geo IDs
    countryId: z.number().int().positive().nullable().optional(),
    provinceId: z.number().int().positive().nullable().optional(),
    cityId: z.number().int().positive().nullable().optional(),

    country: nullableString(100),
    province: nullableString(100),
    city: nullableString(100),

    street: nullableString(127),
    number: nullableString(7),
    department: nullableString(7),
    mail_code: nullableString(10),

    website: nullableString(127),
    language: nullableString(3),
    occupation: nullableString(100),
    company: nullableString(100),

    twitterHandle: nullableString(100),
    facebookHandle: nullableString(100),
    instagramHandle: nullableString(100),
    linkedinHandle: nullableString(100),
    githubHandle: nullableString(100),
});

/* -------------------------------------------------------------------------- */
/*                                   UTILS                                    */
/* -------------------------------------------------------------------------- */

function prismaUniqueErrorMessage(e: any) {
    if (e?.code === "P2002") {
        const target = Array.isArray(e?.meta?.target)
            ? e.meta.target.join(", ")
            : String(e?.meta?.target || "");
        return `Ya existe otro usuario con el mismo valor en: ${target}`;
    }
    return null;
}

async function getSessionUserId() {
    const session = await auth();
    const id = session?.user?.id ? Number(session.user.id) : null;
    return id && Number.isFinite(id) ? id : null;
}

/* -------------------------------------------------------------------------- */
/*                                     GET                                    */
/* -------------------------------------------------------------------------- */

export async function GET() {
    const userId = await getSessionUserId();

    if (!userId) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,

            nick: true,
            bio: true,
            phoneNumber: true,
            movilNumber: true,
            birthday: true,

            countryId: true,
            provinceId: true,
            cityId: true,
            country: true,
            province: true,
            city: true,

            street: true,
            number: true,
            department: true,
            mail_code: true,

            website: true,
            language: true,
            occupation: true,
            company: true,

            twitterHandle: true,
            facebookHandle: true,
            instagramHandle: true,
            linkedinHandle: true,
            githubHandle: true,

            imageUrl: true,
            imagePublicId: true,
            imageWallUrl: true,
            imageWallPublicId: true,
        },
    });

    if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
}

/* -------------------------------------------------------------------------- */
/*                                    PATCH                                   */
/* -------------------------------------------------------------------------- */

export async function PATCH(req: NextRequest) {
    const userId = await getSessionUserId();

    if (!userId) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Body inválido", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { birthday, ...rest } = parsed.data;

    try {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                ...rest,
                birthday:
                    birthday === undefined
                        ? undefined
                        : birthday === null
                            ? null
                            : new Date(birthday),
            },
            select: {
                id: true,
                nick: true,
                bio: true,
                phoneNumber: true,
                movilNumber: true,
                birthday: true,

                country: true,
                province: true,
                city: true,

                countryId: true,
                provinceId: true,
                cityId: true,

                street: true,
                number: true,
                department: true,
                mail_code: true,

                website: true,
                language: true,
                occupation: true,
                company: true,

                twitterHandle: true,
                facebookHandle: true,
                instagramHandle: true,
                linkedinHandle: true,
                githubHandle: true,

                imageUrl: true,
                imageWallUrl: true,
            },
        });

        return NextResponse.json({ data: updated });
    } catch (e: any) {
        const msg = prismaUniqueErrorMessage(e);
        if (msg) {
            return NextResponse.json({ error: msg }, { status: 409 });
        }

        console.error(e);
        return NextResponse.json(
            { error: "Error actualizando perfil" },
            { status: 500 }
        );
    }
}




