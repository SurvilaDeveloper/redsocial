import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ProfilePicture from "./profilepicture"
import { useSession } from "next-auth/react"
import { LogoutButton } from "./logoutButton"
import Link from "next/link"
//import { t } from "@/app/text"
import { useGlobalContext } from "@/context/globalcontext"
import { cfg } from "@/config"

const DropDownMenuProfileImage = () => {
    const { l } = useGlobalContext()
    const { data: session } = useSession()

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    {session && <ProfilePicture session={session} />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-blue-100">
                    <DropdownMenuLabel>
                        {session?.user?.name}
                        <br></br>
                        {session?.user?.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-blue-200" />
                    <DropdownMenuItem>
                        <Link href="/editprofile">{cfg.TEXTS.editProfile}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Link href="/login">{cfg.TEXTS.changeAccount}</Link>


                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <LogoutButton />
                    </DropdownMenuItem>
                    {
                        session?.user.role === "admin" &&
                        <DropdownMenuItem>
                            <Link href="/dashboard">
                                {cfg.TEXTS.panel}
                            </Link>
                        </DropdownMenuItem>
                    }
                    {
                        session?.user.role === "admin" &&
                        <DropdownMenuItem>
                            <Link href="/admin">
                                Admin Page
                            </Link>
                        </DropdownMenuItem>
                    }

                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default DropDownMenuProfileImage