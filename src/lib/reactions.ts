// src/lib/reactions.ts

export function buildReaction(
    likesCount: number,
    unlikesCount: number,
    likedByViewer?: any[],
    unlikedByViewer?: any[]
): {
    likesCount: number;
    unlikesCount: number;
    userReaction: Reaction;
} {
    let userReaction: Reaction = null;

    if (Array.isArray(likedByViewer) && likedByViewer.length > 0) {
        userReaction = "LIKE";
    } else if (Array.isArray(unlikedByViewer) && unlikedByViewer.length > 0) {
        userReaction = "UNLIKE";
    }

    return { likesCount, unlikesCount, userReaction };
}
