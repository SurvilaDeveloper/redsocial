// src/types/cvStyle.ts
//
// Compatibility shim.
// CV style types were consolidated into src/types/cv.ts.
// Keeping these re-exports prevents legacy imports from breaking the build.

export type {
    CVTextStyle,
    CVStyleElement,
    CVStyleConfig,
} from "./cv";
