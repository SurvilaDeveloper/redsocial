// src/components/custom/dropdownmenuprofileimage.tsx
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfilePicture from "./profilepicture";
import { useSession } from "next-auth/react";
import { LogoutButton } from "./logoutButton";
import Link from "next/link";
import { useGlobalContext } from "@/context/globalcontext";
import { cfg } from "@/config";

const DropDownMenuProfileImage = () => {
    const { l } = useGlobalContext();
    const { data: session } = useSession();

    if (!session) return null;

    return (
        <div className="flex items-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-colors"
                    >
                        <ProfilePicture session={session} />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="z-50 mt-1 min-w-[240px] rounded-xl border border-slate-700/80 bg-slate-950/95 px-2 py-2 text-slate-100 shadow-xl backdrop-blur-sm"
                >
                    <DropdownMenuLabel className="text-xs leading-tight px-2 pb-2">
                        <span className="block text-[13px] font-semibold truncate">
                            {session.user?.name}
                        </span>
                        <span className="block text-[11px] text-slate-400 truncate">
                            {session.user?.email}
                        </span>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="my-1 bg-slate-700/60" />

                    <DropdownMenuItem className="text-sm px-2 py-1.5 cursor-pointer rounded-md focus:bg-slate-800 focus:text-slate-50 hover:bg-slate-800/80">
                        <Link href="/editprofile" className="w-full">
                            {cfg.TEXTS.editProfile}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-sm px-2 py-1.5 cursor-pointer rounded-md focus:bg-slate-800 focus:text-slate-50 hover:bg-slate-800/80">
                        <Link href="/editaccount" className="w-full">
                            {cfg.TEXTS.editAccount}
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="text-sm px-2 py-1.5 cursor-pointer rounded-md focus:bg-slate-800 focus:text-slate-50 hover:bg-slate-800/80">
                        <Link href="/login" className="w-full">
                            {cfg.TEXTS.changeAccount}
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="text-sm px-2 py-1.5 cursor-pointer rounded-md focus:bg-slate-800 focus:text-slate-50 hover:bg-slate-800/80">
                        <LogoutButton />
                    </DropdownMenuItem>

                    {session.user.role === "admin" && (
                        <>
                            <DropdownMenuSeparator className="my-1 bg-slate-700/60" />

                            <DropdownMenuItem className="text-sm px-2 py-1.5 cursor-pointer rounded-md focus:bg-slate-800 focus:text-slate-50 hover:bg-slate-800/80">
                                <Link href="/dashboard" className="w-full">
                                    {cfg.TEXTS.panel}
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-sm px-2 py-1.5 cursor-pointer rounded-md focus:bg-slate-800 focus:text-slate-50 hover:bg-slate-800/80">
                                <Link href="/admin" className="w-full">
                                    Admin Page
                                </Link>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default DropDownMenuProfileImage;
