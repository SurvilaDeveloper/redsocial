// src/components/custom/navbar.tsx
"use client";

import Link from "next/link";
import NavbarProfile from "./navbarprofile";
import { useGlobalContext } from "@/context/globalcontext";
import LanguageSwitcher from "./languageswitcher";
import { Plus, BrickWall, House, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { cfg } from "@/config";
import ChangeAccount from "../dev/changeAccount";
import { useRouter, usePathname } from "next/navigation";
import MainMenuMobileMenu from "./MainMenuMobileMenu";

const Navbar = () => {
    const { l } = useGlobalContext();
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();

        if (pathname === "/") {
            window.location.reload();
        } else {
            router.push("/");
        }
    };

    return (
        <nav
            className="
        fixed top-0 left-0 right-0 z-50
        flex items-center justify-between
        h-10 md:h-12
        px-3 md:px-6
        bg-slate-950/95
        border-b border-slate-800
        backdrop-blur
      "
        >
            {/* Bloque izquierdo: título + iconos */}
            <div className="flex items-center gap-3 md:gap-4">
                {/*<ChangeAccount />*/}

                <span className="text-sm md:text-base font-semibold text-slate-100">
                    Red Social
                </span>

                <Link
                    href="/"
                    className="px-1 md:px-2 flex items-center"
                    title={cfg.TEXTS.inicio}
                    onClick={handleHomeClick}
                >
                    <House className="w-5 h-5 md:w-6 md:h-6 text-gray-400 hover:text-gray-100" />
                </Link>

                {session && (
                    <>
                        <Link
                            href="/newpost"
                            className="px-1 md:px-2 flex items-center"
                            title={cfg.TEXTS.newPost}
                        >
                            <Plus className="w-5 h-5 md:w-6 md:h-6 text-gray-400 hover:text-gray-100" />
                        </Link>

                        <Link
                            href="/mywall"
                            className="px-1 md:px-2 flex items-center"
                            title={cfg.TEXTS.myWall}
                        >
                            <BrickWall className="w-5 h-5 md:w-6 md:h-6 text-gray-400 hover:text-gray-100" />
                        </Link>
                    </>
                )}

                <Link
                    href="/search"
                    className="px-1 md:px-2 flex items-center"
                    title={cfg.TEXTS.search}
                >
                    <Search className="w-5 h-5 md:w-6 md:h-6 text-gray-400 hover:text-gray-100" />
                </Link>
            </div>

            {/* Bloque derecho: idioma + perfil */}
            <div className="flex items-center gap-4 md:gap-6">
                <LanguageSwitcher />
                <MainMenuMobileMenu />
                <NavbarProfile />
            </div>
        </nav>
    );
};

export default Navbar;





