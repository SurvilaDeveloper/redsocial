// src/app/security/devices/disable/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Página de confirmación de revocación de dispositivo.
 *
 * ¿Cómo se llega acá?
 * - El usuario recibe un email luego de solicitar la revocación
 *   desde /editaccount (request-disable).
 * - El link del email apunta a:
 *     /security/devices/disable?token=XXX
 *
 * ¿Qué hace esta página?
 * - Lee el token desde la query (?token=...).
 * - Llama a POST /api/security/devices/disable con { token }.
 * - Muestra feedback visual:
 *     - loading: validando token / procesando
 *     - success: dispositivo revocado correctamente
 *     - error: token inválido, expirado o ya usado
 *
 * Importante:
 * - Esta page NO revoca directamente.
 * - La revocación real ocurre en el backend:
 *     POST /api/security/devices/disable
 */
type Status = "loading" | "success" | "error";

export default function DisableDevicePage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<Status>("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Si no hay token en la URL, no se puede continuar
        if (!token) {
            setStatus("error");
            setError("Token inválido o inexistente.");
            return;
        }

        // Confirma la revocación llamando al backend
        const disableDevice = async () => {
            try {
                const res = await fetch("/api/security/devices/disable", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(
                        data?.error || "Error al deshabilitar el dispositivo"
                    );
                }

                setStatus("success");
            } catch (err: any) {
                setStatus("error");
                setError(err?.message ?? "Ocurrió un error inesperado");
            }
        };

        disableDevice();
    }, [token]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
            <div className="w-full max-w-md rounded-2xl bg-neutral-900 p-6 shadow-lg">
                {status === "loading" && (
                    <>
                        <h1 className="mb-2 text-xl font-semibold text-white">
                            Procesando…
                        </h1>
                        <p className="text-sm text-neutral-400">
                            Estamos verificando el enlace y deshabilitando el dispositivo.
                        </p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <h1 className="mb-2 text-xl font-semibold text-green-400">
                            Dispositivo deshabilitado
                        </h1>
                        <p className="text-sm text-neutral-300">
                            El dispositivo fue revocado correctamente.
                        </p>
                        <p className="mt-2 text-sm text-neutral-400">
                            Si este acceso no fue tuyo, todas tus sesiones activas fueron
                            cerradas.
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <h1 className="mb-2 text-xl font-semibold text-red-400">
                            Error
                        </h1>
                        <p className="text-sm text-neutral-300">
                            {error ?? "No se pudo deshabilitar el dispositivo."}
                        </p>
                        <p className="mt-2 text-sm text-neutral-500">
                            El enlace puede haber expirado o ya fue utilizado.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

