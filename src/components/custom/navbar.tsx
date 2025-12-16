"use client"

import Link from "next/link"
import NavbarProfile from "./navbarprofile"
//import { t } from "@/app/text"
import { useGlobalContext } from "@/context/globalcontext"
import LanguageSwitcher from "./languageswitcher"
import Image from "next/image"
import { Plus, BrickWall, House, Search } from "lucide-react";
import { useSession } from "next-auth/react"
import { cfg } from "@/config"
import ChangeAccount from "../dev/changeAccount"

const Navbar = () => {
    const { l } = useGlobalContext()
    const { data: session } = useSession();
    //console.log("session en navbar:", session);

    return (
        <nav className="navbar">
            <ChangeAccount />
            <div className="flex row gap-4">
                <span className="text-base pl-2">Red Social</span>
                <Link
                    href="/"
                    className="px-2 flex items-center"
                    title={cfg.TEXTS.inicio}
                >
                    <House className="w-6 h-6 text-gray-400 hover:text-gray-100" />

                </Link>
                {session &&
                    <>
                        <Link
                            href="/newpost"
                            className="px-2 flex items-center"
                            title={cfg.TEXTS.newPost}
                        >
                            <Plus className="w-6 h-6 text-gray-400 hover:text-gray-100" />
                        </Link>
                        <Link
                            href="/mywall"
                            className="px-2 flex items-center"
                            title={cfg.TEXTS.myWall}
                        >
                            <BrickWall className="w-6 h-6 text-gray-400 hover:text-gray-100" />
                        </Link>
                    </>

                }


                <Link
                    href="/search"
                    className="px-2 flex items-center"
                    title={cfg.TEXTS.search}
                >
                    <Search className="w-6 h-6 text-gray-400 hover:text-gray-100" />
                </Link>

            </div>
            <div className="flex row justify-between">
                <div className="flex gap-8 px-6">
                    <LanguageSwitcher />
                    <NavbarProfile />
                </div>
            </div>
        </ nav>
    )
}

export default Navbar

