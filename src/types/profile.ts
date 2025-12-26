import { Configuration } from "./configuration";

export type ProfileMe = {
    id: number;
    email: string;
    name: string;

    nick: string | null;
    bio: string | null;
    phoneNumber: string | null;
    movilNumber: string | null;
    birthday: string | null; // ISO string

    countryId: number | null;
    provinceId: number | null;
    cityId: number | null;

    country: string | null;
    province: string | null;
    city: string | null;

    street: string | null;
    number: string | null;
    department: string | null;
    mail_code: string | null;

    website: string | null;
    language: string | null;
    occupation: string | null;
    company: string | null;

    twitterHandle: string | null;
    facebookHandle: string | null;
    instagramHandle: string | null;
    linkedinHandle: string | null;
    githubHandle: string | null;

    imageUrl: string | null;
    imagePublicId: string | null;
    imageWallUrl: string | null;
    imageWallPublicId: string | null;

    visibility: number | null;
    darkModeEnabled: boolean | null;
    emailNotifications: boolean | null;
    pushNotifications: boolean | null;

    configuration?: Configuration | null;
};