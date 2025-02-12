"use client"

import { signOut } from "next-auth/react";
import { Button } from "../ui/button";
//import { t } from "@/app/text";
import { useGlobalContext } from "@/context/globalcontext";
import { cfg } from "@/config";

export const LogoutButton = () => {
    const { l } = useGlobalContext()
    const handleClick = async () => {
        await signOut(
            {
                callbackUrl: "/login"
            }
        )
    };

    return (
        <Button onClick={handleClick} className="bg-slate-100 rounded-md w-20">
            {cfg.TEXTS.salir}
        </ Button>
    );
};