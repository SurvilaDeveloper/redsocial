// src/components/custom/mainMenuConfig.ts

import { Home, Trash2 } from "lucide-react";

export type MainMenuItem = {
    href: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export const MAIN_MENU_ITEMS: MainMenuItem[] = [
    {
        href: "/mywall",
        label: "Mi muro",
        icon: Home,
    },
    {
        href: "/trash",
        label: "Papelera de reciclaje",
        icon: Trash2,
    },
    // Más adelante podés agregar:
    // { href: "/explore", label: "Explorar", icon: Compass },
];
