// src/lib/wall-entry-rules.ts

export type WallEntryRuleInput = {
    type?: string | null;
    wallUserId?: number | null;
    actorUserId?: number | null;
    postAuthorId?: number | null;
};

/**
 * Entrada estructural del post original en el muro de su propio autor.
 *
 * En este caso:
 * - Post.active controla si el contenido está activo.
 * - Post.visibility controla quién puede verlo.
 * - WallEntry.active / visibility / showInFeed NO deben convertirse
 *   en una segunda capa de publicación.
 */
export function isOwnOriginalPublishedWallEntry(
    entry: WallEntryRuleInput
): boolean {
    return (
        entry.type === "PUBLISHED" &&
        entry.wallUserId != null &&
        entry.actorUserId != null &&
        entry.postAuthorId != null &&
        entry.wallUserId === entry.actorUserId &&
        entry.actorUserId === entry.postAuthorId
    );
}

export const OWN_PUBLISHED_WALL_ENTRY_STATE = {
    active: 1,
    visibility: 1,
    showInFeed: true,
} as const;
