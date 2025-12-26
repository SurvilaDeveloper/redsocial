// src/app/account/confirm-password/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Status = "loading" | "success" | "error";

export default function ConfirmPasswordPage() {
    const params = useSearchParams();
    const router = useRouter();
    const token = params.get("token");

    const ran = useRef(false);

    const [status, setStatus] = useState<Status>("loading");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        if (!token) {
            setStatus("error");
            setMessage("El enlace es inválido o incompleto.");
            return;
        }

        fetch("/api/account/confirm-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        })
            .then(async (res) => {
                const data = await res.json();

                if (!res.ok) {
                    switch (res.status) {
                        case 404:
                            throw new Error("Este enlace no es válido.");
                        case 409:
                            throw new Error("Este enlace ya fue utilizado.");
                        case 410:
                            throw new Error("Este enlace ha expirado.");
                        default:
                            throw new Error(
                                data.error ?? "Ocurrió un error inesperado."
                            );
                    }
                }

                setStatus("success");
                setMessage(
                    "Tu contraseña fue actualizada correctamente."
                );
            })
            .catch((err: Error) => {
                setStatus("error");
                setMessage(err.message);
            });
    }, [token]);

    return (
        <div className="max-w-md mx-auto mt-20 p-6 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 space-y-4">
            {status === "loading" && (
                <p className="text-slate-300">
                    Confirmando cambio de contraseña…
                </p>
            )}

            {status === "success" && (
                <>
                    <p className="text-emerald-400">{message}</p>
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-500"
                        onClick={() => router.push("/login")}
                    >
                        Ir a iniciar sesión
                    </Button>
                </>
            )}

            {status === "error" && (
                <>
                    <p className="text-red-400">{message}</p>
                    <Button
                        variant="outline"
                        className="w-full border-slate-700"
                        onClick={() => router.push("/account")}
                    >
                        Solicitar nuevo cambio
                    </Button>
                </>
            )}
        </div>
    );
}

