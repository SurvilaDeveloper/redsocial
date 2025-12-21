// src/components/custom/navbarprofile.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import DropDownMenuProfileImage from "./dropdownmenuprofileimage";
import { useGlobalContext } from "@/context/globalcontext";
import { cfg } from "@/config";

const NavbarProfile = () => {
    const { l } = useGlobalContext();
    const { data: session, status } = useSession();

    return (
        <div className="flex items-center gap-3">
            {session?.user ? (
                <DropDownMenuProfileImage />
            ) : (
                <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-sky-500/90 text-slate-950 hover:bg-sky-400 transition-colors shadow-sm border border-sky-400/60"
                >
                    {cfg.TEXTS.acceder}
                </Link>
            )}
        </div>
    );
};

export default NavbarProfile;
