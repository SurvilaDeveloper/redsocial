// src/lib/relationship-state.ts
export enum RelationshipState {
    NONE = 0,
    NO_RELATION = 1,
    A_REQUESTED = 2,
    B_REQUESTED = 3,
    B_ACCEPTED_A_PENDING = 4,
    A_ACCEPTED_B_PENDING = 5,
    A_ACCEPTED = 6,
    B_ACCEPTED = 7,
    FRIENDS = 8,
}
