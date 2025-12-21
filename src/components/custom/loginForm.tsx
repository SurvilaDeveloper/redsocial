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
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
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
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState<string | undefined>(undefined);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "onChange",
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setError(null);
        setEmail(undefined);

        startTransition(async () => {
            const response = await loginAction(values);

            if (response.error) {
                setError(
                    "ERROR en loginForm que viene de loginAction: " +
                    response.error
                );
                if (response.email) {
                    setEmail(response.email);
                }
                return;
            }

            const result = await signIn("credentials", {
                email: values.email,
                password: values.password,
                redirect: false,
            });

            if (result?.error) {
                setError("Error al iniciar sesión: " + result.error);
                return;
            }

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
            }
        } catch (error) {
            setError(
                "Error al conectar con el servidor para reenviar el email."
            );
        }
    }

    return (
        <div className="w-full space-y-4">
            {/* Mensajes superiores */}
            {isVerified && (
                <p className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-700 px-3 py-2 rounded-md text-center">
                    Email verificado, ahora te puedes loguear.
                </p>
            )}

            {emailsend && (
                <p className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-700 px-3 py-2 rounded-md text-center">
                    Email de verificación enviado.
                </p>
            )}

            {message === "hastobeadmin" && (
                <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-700 px-3 py-2 rounded-md text-center">
                    {cfg.TEXTS.adminmessage}
                </p>
            )}

            {message === "hastologtopost" && (
                <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-700 px-3 py-2 rounded-md text-center">
                    {cfg.TEXTS.tologmessage}
                </p>
            )}

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-xs text-slate-200">
                                    Email
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        className="rounded-md bg-slate-900/40 border-slate-600 text-slate-100 placeholder:text-slate-500"
                                        placeholder="email"
                                        type="email"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-[11px] text-slate-400">
                                    Enter your email
                                </FormDescription>
                                <FormMessage className="text-[11px]" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-xs text-slate-200">
                                    Password
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        className="rounded-md bg-slate-900/40 border-slate-600 text-slate-100 placeholder:text-slate-500"
                                        placeholder="password"
                                        type="password"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-[11px] text-slate-400">
                                    Enter your password
                                </FormDescription>
                                <FormMessage className="text-[11px]" />
                            </FormItem>
                        )}
                    />

                    {/* Errores generales */}
                    {error && (
                        <FormMessage className="text-[11px] text-red-300 bg-red-950/40 border border-red-700 px-3 py-2 rounded-md">
                            {error}
                        </FormMessage>
                    )}

                    {tokenExpired === "true" && (
                        <FormMessage className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-700 px-3 py-2 rounded-md">
                            {cfg.TEXTS.tokenExpired}
                        </FormMessage>
                    )}

                    {/* Reenviar email de verificación */}
                    {(email || tokenExpired) && (
                        <Button
                            type="button"
                            className="w-full rounded-md bg-blue-600 hover:bg-blue-500 text-xs font-medium"
                            onClick={resendEmail}
                        >
                            Enviar nuevamente el email con el enlace de
                            verificación
                        </Button>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full rounded-md bg-sky-600 hover:bg-sky-500 text-sm font-semibold"
                    >
                        Ingresar
                    </Button>
                </form>
            </Form>

            <div className="mt-4 space-y-3">
                <GoogleSigninButton />

                <Link
                    href="/register"
                    className="flex justify-center items-center bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold w-full h-10 rounded-md text-sm"
                >
                    {cfg.TEXTS.createNewAccount}
                </Link>
            </div>
        </div>
    );
};

export default LoginForm;

