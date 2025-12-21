// src/components/custom/logoutButton.tsx
"use client";

import { signOut } from "next-auth/react";
import { Button } from "../ui/button";
import { useGlobalContext } from "@/context/globalcontext";
import { cfg } from "@/config";

export const LogoutButton = () => {
    const { l } = useGlobalContext();

    const handleClick = async () => {
        await signOut({
            callbackUrl: "/login",
        });
    };

    return (
        <Button
            onClick={handleClick}
            className="
                w-full
                justify-center
                px-3 py-1.5
                rounded-md
                text-xs font-medium
                bg-red-500/90
                text-slate-50
                hover:bg-red-500
                border border-red-400/70
                shadow-sm
            "
        >
            {cfg.TEXTS.salir}
        </Button>
    );
};
