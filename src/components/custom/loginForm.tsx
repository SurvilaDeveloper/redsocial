"use client"

import { z } from "zod"
import { loginSchema } from "@/lib/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { loginAction } from "@/actions/auth-action"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import GoogleSigninButton from "./googleSigninButton"
import { LogoutButton } from "./logoutButton"
import { useSession } from "next-auth/react"
import { useGlobalContext } from "@/context/globalcontext"
//import { t } from "@/app/text"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"
import { sendEmailVerification } from "@/lib/email"
import { cfg } from "@/config"

const LoginForm = ({
    isVerified,
    message,
    emailsend,
    tokenExpired,
}: {
    isVerified: boolean,
    message?: string,
    emailsend?: string
    tokenExpired?: string
}) => {
    const { l } = useGlobalContext()
    const { update } = useSession();
    const [error, setError] = useState<String | null>(null)
    const [email, setEmail] = useState<string | undefined>(undefined)
    const [isPending, startTransition] = useTransition()
    const router = useRouter();

    // 1. Define your form.
    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "onChange",
    });

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setError(null);
        setEmail(undefined);
        startTransition(async () => {
            const response = await loginAction(values);
            //console.log("response: ", response);

            if ("error" in response && response.error) {
                setError("ERROR en loginForm que viene de loginAction: " + response.error)
                if (response.email) {
                    setEmail(response.email)
                }
            } else {
                await update(); // Actualizar sesión
                router.push("/");
                router.refresh();
            }
        });
    }

    async function resendEmail() {
        if (!email) return;

        try {
            const res = await fetch("/api/resend-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) {
                //console.error("Error al reenviar email:", data.error);
                setError("Error al reenviar el email: " + data.error);
            } else {
                //console.log("Email de verificación reenviado:", data);
                // Puedes mostrar un mensaje de éxito o actualizar el estado según lo necesites.
            }
        } catch (error) {
            //console.error("Error en la petición para reenviar el email:", error);
            setError("Error al conectar con el servidor para reenviar el email.");
        }
    }


    return (
        <div className="w-full">

            {isVerified && (
                <p>Email verificado, ahora te puedes loguear</p>
            )}
            {emailsend && (
                <p className="flex justify-center text-ms text-green-800 border-green-800 border-solid border rounded">Email de verificacion enviado</p>
            )}
            {message === "hastobeadmin" && (
                <p className="flex justify-center text-ms text-green-800 border-green-800 border-solid border rounded">{cfg.TEXTS.adminmessage}</p>
            )}
            {message === "hastologtopost" && (
                <p className="flex justify-center text-ms text-green-800 border-green-800 border-solid border rounded">{cfg.TEXTS.tologmessage}</p>
            )}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        className="rounded"
                                        placeholder="email"
                                        type="email"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Enter your email
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input
                                        className="rounded"
                                        placeholder="password"
                                        type="password"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Enter your password
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {error && <FormMessage>{error}</FormMessage>}
                    {tokenExpired === "true" && <FormMessage>{cfg.TEXTS.tokenExpired}</FormMessage>}
                    {(email || tokenExpired) && <Button
                        className="bg-blue-300 w-full rounded"
                        onClick={resendEmail}>
                        Enviar nuevamente el email con el enlace de verificación</Button>}
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-blue-300 w-full rounded text-xl hover:bg-blue-400"
                    >
                        Submit
                    </Button>
                </form>
            </Form>
            <GoogleSigninButton />
            <Link href="/register"
                className="flex justify-center items-center bg-green-300 w-full h-12 rounded hover:bg-green-400"
            >
                {cfg.TEXTS.createNewAccount}
            </Link>
        </div>
    )
}

export default LoginForm