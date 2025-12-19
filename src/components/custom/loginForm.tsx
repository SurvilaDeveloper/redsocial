// src/components/custom/loginForm.tsx
"use client";

import { z } from "zod";
import { loginSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/actions/auth-action";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import GoogleSigninButton from "./googleSigninButton";
import { LogoutButton } from "./logoutButton";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react"; // 👈 IMPORTANTE: signIn del cliente
import { useGlobalContext } from "@/context/globalcontext";
import Link from "next/link";
import { cfg } from "@/config";

const LoginForm = ({
    isVerified,
    message,
    emailsend,
    tokenExpired,
}: {
    isVerified: boolean;
    message?: string;
    emailsend?: string;
    tokenExpired?: string;
}) => {
    const { l } = useGlobalContext();
    const { update } = useSession();
    const [error, setError] = useState<string | null>(null); // usar string minúscula
    const [email, setEmail] = useState<string | undefined>(undefined);
    const [isPending, startTransition] = useTransition();
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

    // 2. Submit handler.
    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setError(null);
        setEmail(undefined);

        startTransition(async () => {
            // Primero: validamos credenciales y estado con la server action
            const response = await loginAction(values);

            if (response.error) {
                setError("ERROR en loginForm que viene de loginAction: " + response.error);
                if (response.email) {
                    setEmail(response.email);
                }
                return;
            }

            // Si loginAction dice que está todo bien, ahora sí hacemos signIn en el cliente
            const result = await signIn("credentials", {
                email: values.email,
                password: values.password,
                redirect: false, // manejamos la redirección a mano
            });

            // Por si algo falla en signIn (credenciales, provider, etc.)
            if (result?.error) {
                setError("Error al iniciar sesión: " + result.error);
                return;
            }

            // Actualizar sesión y redirigir
            await update();
            router.push("/");
            router.refresh();
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
                setError("Error al reenviar el email: " + data.error);
            } else {
                // Podés mostrar un mensaje de éxito si querés
                // setError("Email de verificación reenviado correctamente.");
            }
        } catch (error) {
            setError("Error al conectar con el servidor para reenviar el email.");
        }
    }

    return (
        <div className="w-full">
            {isVerified && <p>Email verificado, ahora te puedes loguear</p>}

            {emailsend && (
                <p className="flex justify-center text-ms text-green-800 border-green-800 border-solid border rounded">
                    Email de verificacion enviado
                </p>
            )}

            {message === "hastobeadmin" && (
                <p className="flex justify-center text-ms text-green-800 border-green-800 border-solid border rounded">
                    {cfg.TEXTS.adminmessage}
                </p>
            )}

            {message === "hastologtopost" && (
                <p className="flex justify-center text-ms text-green-800 border-green-800 border-solid border rounded">
                    {cfg.TEXTS.tologmessage}
                </p>
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
                                <FormDescription>Enter your email</FormDescription>
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
                                <FormDescription>Enter your password</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {error && <FormMessage>{error}</FormMessage>}

                    {tokenExpired === "true" && (
                        <FormMessage>{cfg.TEXTS.tokenExpired}</FormMessage>
                    )}

                    {(email || tokenExpired) && (
                        <Button
                            type="button" // 👈 para que NO envíe el formulario
                            className="bg-blue-300 w-full rounded"
                            onClick={resendEmail}
                        >
                            Enviar nuevamente el email con el enlace de verificación
                        </Button>
                    )}

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

            <Link
                href="/register"
                className="flex justify-center items-center bg-green-300 w-full h-12 rounded hover:bg-green-400"
            >
                {cfg.TEXTS.createNewAccount}
            </Link>
        </div>
    );
};

export default LoginForm;
