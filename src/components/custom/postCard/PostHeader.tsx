// src/components/custom/postCard/PostHeader.tsx
"use client";

import { formatDate } from "@/lib/dateUtils";
import UserProfileMiniCard from "../userProfileMiniCard";

type Props = {
    session: any;
    user: MiniUser;
    createdAt: string;
    title: string | null;
    relations: PostRelations;
    postId: number;
    onOpenDetail?: (postId: number) => void;
    className?: string;
};

export function PostHeader({
    session,
    user,
    createdAt,
    title,
    relations,
    postId,
    onOpenDetail,
    className,
}: Props) {
    return (
        <div className={className}>
            <UserProfileMiniCard
                session={session}
                userId={user.id}
                userName={user.name}
                profileImageUrl={user.imageUrl ? user.imageUrl : user.image ? user.image : null}
                following={relations.following}
                isFollower={relations.isFollower}
                relState={relations.relState}
            />

            <div className="text-[10px] h-[6px] text-slate-400">{formatDate(createdAt)}</div>

            <h3
                className={"text-lg font-semibold mt-2 flex flex-row items-center justify-center" + (onOpenDetail ? " cursor-pointer hover:text-sky-300" : "")}
                onClick={() => onOpenDetail?.(postId)}
            >
                {title ?? ""}
            </h3>
        </div>
    );
}
