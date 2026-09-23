// src/types/post-api.ts
import type { Post as PostModel, Image as ImageModel } from "@prisma/client";

export type PostRelations = {
    isFriend: boolean;
    isFollower: boolean;
    isOwner: boolean;
    isLogged: boolean;
};

export type PostNoViewReason =
    | "login_required"
    | "followers_or_friends_only"
    | "friends_only"
    | "post_hidden"
    | "invalid_visibility";

export type PostApiOk = PostModel & {
    images: ImageModel[];
    relations: PostRelations;
    canView: true;
    reason: null;
};

/**
 * `/api/post` mantiene `user_id` como nombre legacy en la respuesta
 * cuando el post no puede verse, aunque el modelo Prisma actual expone
 * esa columna como `authorId`.
 */
export type PostApiNoView = Pick<
    PostModel,
    "id" | "title" | "createdAt" | "visibility" | "active"
> & {
    user_id: PostModel["authorId"];
    relations: PostRelations;
    canView: false;
    reason: PostNoViewReason;
};

export type PostApiError = { error: string };

export type PostApiResponse = PostApiOk | PostApiNoView | PostApiError;
