// src/lib/post-visibility.ts

export function canViewPost(
    visibility: PostVisibility,
    opts: {
        isOwner: boolean;
        isLogged: boolean;
        isFriend: boolean;
        following: boolean;
    }
): boolean {
    const { isOwner, isLogged, isFriend, following } = opts;

    if (isOwner) return true;
    if (visibility === 1) return true;
    if (visibility === 2) return isLogged;
    if (visibility === 3) return isLogged && (isFriend || following);
    if (visibility === 4) return isLogged && isFriend;

    return false;
}
