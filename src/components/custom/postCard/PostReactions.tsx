"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";

type Props = {
    canReact: boolean;
    postReaction: Reaction;
    likesCount: number;
    unlikesCount: number;
    onLike: () => void;
    onUnlike: () => void;
};

export function PostReactions({
    canReact,
    postReaction,
    likesCount,
    unlikesCount,
    onLike,
    onUnlike,
}: Props) {
    return (
        <div className="mt-2 flex flex-row items-center gap-3">
            <button
                type="button"
                onClick={onLike}
                disabled={!canReact}
                className={`flex flex-row items-center gap-1 text-xs px-2 py-1 rounded border ${postReaction === "LIKE"
                        ? "bg-green-700 border-green-400 text-white"
                        : "bg-transparent border-gray-500 text-gray-300"
                    } ${!canReact ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
                <ThumbsUp className="w-4 h-4" />
                <span>{likesCount}</span>
            </button>

            <button
                type="button"
                onClick={onUnlike}
                disabled={!canReact}
                className={`flex flex-row items-center gap-1 text-xs px-2 py-1 rounded border ${postReaction === "UNLIKE"
                        ? "bg-red-700 border-red-400 text-white"
                        : "bg-transparent border-gray-500 text-gray-300"
                    } ${!canReact ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
                <ThumbsDown className="w-4 h-4" />
                <span>{unlikesCount}</span>
            </button>
        </div>
    );
}
