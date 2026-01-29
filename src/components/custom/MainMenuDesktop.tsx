// src/components/custom/MainMenuDesktop.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_MENU_ITEMS } from "./mainMenuConfig";
import { UserCog } from "lucide-react";

export function MainMenuDesktop(session: any) {
    const pathname = usePathname();
    if (session.session.user.role === "admin") {
        console.log("ES ADMINISTRADOR");
    } else {
        console.log("NO ES ADMINISTRADOR");
    }


    return (
        <nav className="hidden lg:flex lg:flex-col gap-1 w-full text-sm">
            <h2 className="text-xs uppercase tracking-wide text-slate-400 mb-1 px-2">
                Menú
            </h2>
            {/* si es admin */}
            {session.session.user.role === "admin" &&
                <Link
                    href={"/admin"}
                    className="text-slate-200 hover:bg-slate-800/70 hover:text-sky-100 flex flex-row items-center gap-2 rounded-md px-3 py-2 transition-colors"
                >
                    <UserCog className="w-4 h-4 shrink-0" />
                    Página de Administrador
                </Link>
            }

            {MAIN_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={[
                            "flex flex-row items-center gap-2 rounded-md px-3 py-2 transition-colors",
                            isActive
                                ? "bg-slate-800 text-sky-200"
                                : "text-slate-200 hover:bg-slate-800/70 hover:text-sky-100",
                        ].join(" ")}
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default MainMenuDesktop;
