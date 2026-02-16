// src/app/b/[slug]/[tab]/layout.tsx
import type { ReactNode } from "react";

/**
 * Passthrough.
 * El layout raíz /b/[slug]/layout.tsx ya se encarga de:
 * - permisos (active/draft/suspended)
 * - theme vars (css variables)
 * - wrapper (BusinessPortal)
 */
export default async function PublicBusinessTabLayout({
    children,
}: {
    children: ReactNode;
}) {
    return children;
}

