// src/types/initialUserCV.ts
import type { Prisma } from "@prisma/client";

/**
 * Mantener este select como "source of truth" del tipo.
 * Si cambiás campos, TypeScript te obliga a actualizar.
 */
export const initialUserCVSelect = {
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
    image: true,
} satisfies Prisma.UserSelect;

export type InitialUserCVDb = Prisma.UserGetPayload<{
    select: typeof initialUserCVSelect;
}>;

/** Client-safe: Date -> string (ISO) */
export type InitialUserCV = Omit<InitialUserCVDb, "birthday"> & {
    birthday: string | null;
};

export function serializeInitialUserCV(user: InitialUserCVDb): InitialUserCV {
    return {
        ...user,
        birthday: user.birthday ? user.birthday.toISOString() : null,
    };
}
