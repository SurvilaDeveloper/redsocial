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
                className=" bg-slate-300 w-full rounded my-4 flex justify-center items-center hover:bg-slate-400"
            >
                <FcGoogle size={24} className="m-2" />{cfg.TEXTS.initWithGoogle}
            </button>
        </form>
    )
}


/*
import { signIn } from "next-auth/react";

const GoogleSigninButton = () => {
    return (
        <button
            onClick={() => signIn("google")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
        >
            Iniciar sesión con Google
        </button>
    );
};

export default GoogleSigninButton;

*/