//src/types/wall.ts

export type WallUserBasic = {
    id: number;
    name: string | null;
    nick: string | null;
    imageUrl: string | null;
    imageWallUrl: string | null;
    wallHeaderBackgroundColor: string | null;
    wallHeaderBackgroundType: string | null;
};

export type WallUser = {

    bio: string | null;
    occupation: string | null;
    location: string | null;
    website: string | null;
    //imageWallUrl: string | null;
    company: string | null;

    country: string | null;
    province: string | null;
    city: string | null;

    twitterHandle: string | null;
    facebookHandle: string | null;
    instagramHandle: string | null;
    linkedinHandle: string | null;
    githubHandle: string | null;
};

export type UserWallMeta = {
    isOwner: boolean;
    isFriend?: boolean;
    isFollower?: boolean;
    visibility?: number;
};

export type WallUserFull = WallUserBasic & WallUser & UserWallMeta;
