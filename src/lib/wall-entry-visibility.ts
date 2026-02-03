// src/lib/wall-entry-visibility.ts
import { RelationshipState } from "@/lib/relationship-state";
import { canViewPost } from "@/lib/post-visibility";

export type Visibility = 1 | 2 | 3 | 4;

export function normalizeVisibility(v: unknown): Visibility {
    const n = Number(v);
    if (n === 1 || n === 2 || n === 3 || n === 4) return n;
    return 1;
}

/**
 * Usa la misma semántica que Post.visibility, pero aplicado a “visibilidad en el muro”.
 * - isOwner: viewer es el dueño del muro (wallUserId)
 * - isLogged: viewer está logueado
 * - isFriend/following: relación viewer ↔ dueño del muro
 */
export function canViewWallEntry(visibility: Visibility, ctx: {
    isOwner: boolean;
    isLogged: boolean;
    isFriend: boolean;
    following: boolean;
}) {
    // Reutilizamos canViewPost porque coincide la semántica 1..4
    return canViewPost(visibility, ctx);
}

export function isFriends(relState: number) {
    return relState === RelationshipState.FRIENDS;
}
