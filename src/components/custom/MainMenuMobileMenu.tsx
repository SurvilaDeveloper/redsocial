// src/components/custom/MainMenuMobileMenu.tsx
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MAIN_MENU_ITEMS } from "./mainMenuConfig";
import { MoreVertical, X } from "lucide-react";
import { cfg } from "@/config";

export function MainMenuMobileMenu() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const toggleMenu = () => setOpen((v) => !v);

    const handleNavigate = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    return (
        <div className="lg:hidden relative">
            {/* Botón tres puntitos */}
            <button
                type="button"
                onClick={toggleMenu}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
                aria-label="Abrir menú"
            >
                {open ? (
                    <X className="w-5 h-5" />
                ) : (
                    <MoreVertical className="w-5 h-5" />
                )}
            </button>

            {/* Menú desplegable */}
            {open && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-950 border border-slate-700 rounded-md shadow-lg z-50">
                    <div className="py-1">
                        <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-slate-400">
                            Menú
                        </div>

                        {MAIN_MENU_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/" && pathname?.startsWith(item.href));

                            return (
                                <button
                                    key={item.href}
                                    type="button"
                                    onClick={() => handleNavigate(item.href)}
                                    className={[
                                        "w-full flex flex-row items-center gap-2 px-3 py-2 text-sm text-left",
                                        isActive
                                            ? "bg-slate-800 text-sky-200"
                                            : "text-slate-200 hover:bg-slate-800/80 hover:text-sky-100",
                                    ].join(" ")}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MainMenuMobileMenu;
