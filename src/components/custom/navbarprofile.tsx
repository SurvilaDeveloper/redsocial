"use client"

import { useSession } from "next-auth/react"
import Link from "next/link";
import DropDownMenuProfileImage from "./dropdownmenuprofileimage";
//import { t } from "../../app/text"
import { useGlobalContext } from "@/context/globalcontext";
import { cfg } from "@/config";

const NavbarProfile = () => {
    const { l } = useGlobalContext()
    const { data: session, status } = useSession();

    return (
        <div className="flex gap-3">

            {session?.user ?
                (
                    <div>
                        <DropDownMenuProfileImage />
                    </div>
                ) : <>
                    <Link href={"/login"}>{cfg.TEXTS.acceder}</Link>
                </>}

        </div>
    )
}

export default NavbarProfile