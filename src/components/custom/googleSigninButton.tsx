"use client"

import { googleSigninAction } from "@/actions/auth-action"
import { useGlobalContext } from "@/context/globalcontext"
import { cfg } from "@/config";
import { FcGoogle } from "react-icons/fc";

export default function GoogleSigninButton() {

    const { l } = useGlobalContext()

    return (
        <form
            action={googleSigninAction}
        >
            <button type="submit"
                className=" bg-slate-300 w-full rounded my-4 flex justify-center items-center hover:bg-slate-400 text-black"
            >
                <FcGoogle size={24} className="m-2" />{cfg.TEXTS.initWithGoogle}
            </button>
        </form>
    )
}
