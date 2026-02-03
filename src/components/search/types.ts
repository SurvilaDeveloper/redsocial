// src/components/search/types.ts
export type FriendStatus = "none" | "friends" | "sent" | "received" | "pending";

export type MutualFriend = {
    id: number;
    name: string;
    nick?: string | null;
};

export type SearchUserRow = {
    id: number;
    name: string;
    nick?: string | null;
    imageUrl?: string | null;

    location?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;

    occupation?: string | null;
    company?: string | null;

    cvTitle?: string | null;
    cvSummary?: string | null;
    hasPublicCV?: boolean;

    isFollowing: boolean;
    isFollower?: boolean; // ✅ nuevo: “te sigue”
    friendStatus: FriendStatus;
    mutualFriend?: MutualFriend | null;

    followersCount?: number; // ✅ nuevo
    followingCount?: number; // ✅ nuevo
    friendsCount?: number;   // ✅ nuevo
};


export const SEARCH_MODES = [
    "all",
    "name",
    "nick",
    "location",
    "occupation",
    "company",
    "social",
    "cv",
    "cvcontent",
    "skills",
    "projects",
] as const;

export type Mode = (typeof SEARCH_MODES)[number];