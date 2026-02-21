// src/components/site-templates/TemplatePortal.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const PORTAL_ID = "template-portal-root";

function ensurePortalRoot(): HTMLElement {
    let el = document.getElementById(PORTAL_ID) as HTMLElement | null;
    if (el) return el;

    el = document.createElement("div");
    el.id = PORTAL_ID;
    document.body.appendChild(el);
    return el;
}

export function TemplatePortal({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const [root, setRoot] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setMounted(true);
        setRoot(ensurePortalRoot());
    }, []);

    if (!mounted || !root) return null;

    return createPortal(children, root);
}

