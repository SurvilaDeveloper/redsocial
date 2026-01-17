import type { Configuration } from "@/types/configuration";

export function canView({
    visibility,
    isLogged,
    isFriend,
    isFollower,
}: {
    visibility: number;
    isLogged: boolean;
    isFriend: boolean;
    isFollower: boolean;
}) {
    switch (visibility) {
        case 1:
            return true;
        case 2:
            return isLogged;
        case 3:
            return isLogged && (isFriend || isFollower);
        case 4:
            return isFriend;
        default:
            return false;
    }
}

export function canIView({
    visibility,
    isLogged,
    isFriend,
    following,
}: {
    visibility: number;
    isLogged: boolean;
    isFriend: boolean;
    following: boolean;
}) {
    switch (visibility) {
        case 1:
            return true;
        case 2:
            return isLogged;
        case 3:
            return isLogged && (isFriend || following);
        case 4:
            return isFriend;
        default:
            return false;
    }
}

export function areIEnableToView(
    accountConfiguration: Configuration | null,
    isLogged: boolean,
    isFriend: boolean,
    following: boolean
): EnableToView | null {
    const ctx = { isLogged, isFriend, following };

    if (!accountConfiguration) {
        return null
    }

    return {
        profileImage: canIView({ visibility: accountConfiguration.profileImageVisibility, ...ctx }),
        coverImage: canIView({ visibility: accountConfiguration.coverImageVisibility, ...ctx }),
        fullProfile: canIView({ visibility: accountConfiguration.fullProfileVisibility, ...ctx }),

        wall: canIView({ visibility: accountConfiguration.wallVisibility, ...ctx }),
        posts: canIView({ visibility: accountConfiguration.postsVisibility, ...ctx }),
        postComments: canIView({ visibility: accountConfiguration.postCommentsVisibility, ...ctx }),
        postReplies: canIView({ visibility: accountConfiguration.postRepliesVisibility, ...ctx }),

        media: canIView({ visibility: accountConfiguration.mediaVisibility, ...ctx }),
        mediaComments: canIView({ visibility: accountConfiguration.mediaCommentsVisibility, ...ctx }),
        mediaReplies: canIView({ visibility: accountConfiguration.mediaRepliesVisibility, ...ctx }),

        friendsList: canIView({ visibility: accountConfiguration.friendsListVisibility, ...ctx }),
        followersList: canIView({ visibility: accountConfiguration.followersListVisibility, ...ctx }),
        followingList: canIView({ visibility: accountConfiguration.followingListVisibility, ...ctx }),

        likes: canIView({ visibility: accountConfiguration.likesVisibility, ...ctx }),
        privateMessages: canIView({ visibility: accountConfiguration.privateMessagesVisibility, ...ctx }),
    };
}

