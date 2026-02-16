//src/lib/productive/keyword-types.ts

export type ProductiveKeywordKind =
    | "skill"
    | "degree"
    | "role"
    | "company"
    | "project"
    | "institution"
    | "text"
    | "tag"; // ✅ nuevo

export type ProductiveKeywordItem = {
    /** keyword normalizada (lowercase, sin tildes, sin basura) */
    t: string;
    /** de dónde sale dentro del CV (kind) */
    k: ProductiveKeywordKind;

    /** ✅ opcional: original (para UI/UX) */
    o?: string;
};

