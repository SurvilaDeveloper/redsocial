// global.d.ts

export { };

declare global {
    type RelationshipState =
        import("@/lib/relationship-state").RelationshipState;

    type PostVisibility = 1 | 2 | 3 | 4;

    type Reaction = "LIKE" | "UNLIKE" | null;

    type SocialRelations = {
        relState: RelationshipState;
        following: boolean;
        isFollower: boolean;
    };

    type PostRelations = SocialRelations & {
        likesCount: number;
        unlikesCount: number;
        userReaction: Reaction;
    };

    interface MiniUser {
        id: number;
        name: string;
        imageUrl: string | null;
        imagePublicId?: string | null;
        image?: string | null;
    }

    interface PostCommentResponse {
        id: number;
        response: string;
        createdAt: string;
        who_responses: number;
        active?: number | null;
        user?: MiniUser;

        likesCount?: number;
        unlikesCount?: number;
        userReaction?: Reaction;
    }

    interface PostComment {
        id: number;
        comment: string;
        createdAt: string;
        post_id: number;
        who_comments: number;
        active?: number | null;
        user?: MiniUser;
        responses?: PostCommentResponse[];

        likesCount?: number;
        unlikesCount?: number;
        userReaction?: Reaction;
    }

    interface Post {
        id: number;
        post_comment?: PostComment[];
        user_id: number;

        title: string | null;
        description: string | null;

        imagenumber: number | null;
        createdAt: string;

        active: number;
        visibility: PostVisibility;

        deletedAt?: string | null;

        relations: PostRelations;

        user?: MiniUser;

        images?: {
            id: number;
            post_id: number;
            imageUrl: string;
            imagePublicId: string;
            index: number;
            active?: number | null;

            likesCount?: number;
            unlikesCount?: number;
            userReaction?: Reaction;
        }[];

        commentsCount?: number;
    }
}





