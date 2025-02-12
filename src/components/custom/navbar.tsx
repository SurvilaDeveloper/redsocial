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

const Navbar = () => {
    const { l } = useGlobalContext()
    const { data: session } = useSession();
    //console.log("session en navbar:", session);

    return (
        <div>
            <nav className="bg-blue-200 flex row p-2 w-full justify-between fixed">
                <div className="flex row gap-4">
                    <span className="text-2xl pl-2">Auth</span>
                    <Link
                        href="/"
                        className="px-2 flex items-center"
                        title={cfg.TEXTS.inicio}
                    >
                        <House className="w-6 h-6 text-gray-700 hover:text-black" />

                    </Link>
                    {session &&
                        <>
                            <Link
                                href="/newpost"
                                className="px-2 flex items-center"
                                title={cfg.TEXTS.newPost}
                            >
                                <Plus className="w-6 h-6 text-gray-700 hover:text-black" />
                            </Link>
                            <Link
                                href="/mywall"
                                className="px-2 flex items-center"
                                title={cfg.TEXTS.myWall}
                            >
                                <BrickWall className="w-6 h-6 text-gray-700 hover:text-black" />
                            </Link>
                        </>

                    }


                    <Link
                        href="/search"
                        className="px-2 flex items-center"
                        title={cfg.TEXTS.search}
                    >
                        <Search className="w-6 h-6 text-gray-700 hover:text-black" />
                    </Link>

                </div>
                <div className="flex row justify-between">
                    <div className="flex gap-8 px-6">
                        <LanguageSwitcher />
                        <NavbarProfile />
                    </div>
                </div>
            </ nav>
        </div>
    )
}

export default Navbar

