//src/lib/permissions.ts
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
            return isFriend && !isFollower;
        default:
            return false;
    }
}

export function isHeEnableToView(
    myAccountConfiguration: Configuration | null,
    isLogged: boolean,
    isFriend: boolean,
    isFollower: boolean
): EnableToView | null {
    const ctx = { isLogged, isFriend, isFollower };

    if (!myAccountConfiguration) {
        return null
    }

    return {
        profileImage: canView({ visibility: myAccountConfiguration.profileImageVisibility, ...ctx }),
        coverImage: canView({ visibility: myAccountConfiguration.coverImageVisibility, ...ctx }),
        fullProfile: canView({ visibility: myAccountConfiguration.fullProfileVisibility, ...ctx }),

        wall: canView({ visibility: myAccountConfiguration.wallVisibility, ...ctx }),
        posts: canView({ visibility: myAccountConfiguration.postsVisibility, ...ctx }),
        postComments: canView({ visibility: myAccountConfiguration.postCommentsVisibility, ...ctx }),
        postReplies: canView({ visibility: myAccountConfiguration.postRepliesVisibility, ...ctx }),

        media: canView({ visibility: myAccountConfiguration.mediaVisibility, ...ctx }),
        mediaComments: canView({ visibility: myAccountConfiguration.mediaCommentsVisibility, ...ctx }),
        mediaReplies: canView({ visibility: myAccountConfiguration.mediaRepliesVisibility, ...ctx }),

        friendsList: canView({ visibility: myAccountConfiguration.friendsListVisibility, ...ctx }),
        followersList: canView({ visibility: myAccountConfiguration.followersListVisibility, ...ctx }),
        followingList: canView({ visibility: myAccountConfiguration.followingListVisibility, ...ctx }),

        likes: canView({ visibility: myAccountConfiguration.likesVisibility, ...ctx }),
        privateMessages: canView({ visibility: myAccountConfiguration.privateMessagesVisibility, ...ctx }),
    };
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
): EnableToView {
    const ctx = { isLogged, isFriend, following };

    if (!accountConfiguration) {
        console.warn("El usuario no tiene configuración en la db");
        return {
            profileImage: false,
            coverImage: false,
            fullProfile: false,

            wall: false,
            posts: false,
            postComments: false,
            postReplies: false,

            media: false,
            mediaComments: false,
            mediaReplies: false,

            friendsList: false,
            followersList: false,
            followingList: false,

            likes: false,
            privateMessages: false,
        }
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

export const myOwnPermissions: EnableToView = {
    profileImage: true,
    coverImage: true,
    fullProfile: true,

    wall: true,
    posts: true,
    postComments: true,
    postReplies: true,

    media: true,
    mediaComments: true,
    mediaReplies: true,

    friendsList: true,
    followersList: true,
    followingList: true,

    likes: true,
    privateMessages: true,
}
