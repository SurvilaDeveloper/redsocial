// src/types/cvTheme.ts
//
// Compatibility shim.
// CV theme types/runtime helpers were consolidated into src/types/cv.ts.
// Keeping these re-exports prevents legacy imports from breaking the build.

export type {
    CVThemeColor,
    Tone,
} from "./cv";

export {
    TONES,
    coerceThemeColor,
} from "./cv";
