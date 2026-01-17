// src/app/(protected)/admin/users/[id]/ForceLogoutButton.tsx
"use client";

import { useState, useTransition } from "react";
import { forceLogoutAction } from "./actions";

import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
    userId: number;
    isAdminTarget: boolean;
};

export default function ForceLogoutButton({ userId, isAdminTarget }: Props) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    const disabled = isAdminTarget || isPending;

    function clearMessages() {
        setError(null);
        setOk(null);
    }

    function handleConfirm() {
        clearMessages();

        startTransition(async () => {
            try {
                await forceLogoutAction(userId);
                setOk("Logout forzado. El usuario deberá iniciar sesión nuevamente.");
            } catch (e: any) {
                setError(e?.message ?? "No se pudo forzar el logout.");
            }
        });
    }

    return (
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-slate-200">Sesión</h2>
                    <p className="mt-1 text-xs text-slate-400">
                        Forzar cierre de sesión invalidando tokens activos.
                    </p>
                </div>

                {isAdminTarget ? (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                        Protegido
                    </span>
                ) : null}
            </div>

            {isAdminTarget ? (
                <p className="mt-3 text-xs text-slate-400">
                    Este usuario es <span className="text-slate-200">admin</span>. Para evitar errores,
                    no se permite forzar logout.
                </p>
            ) : (
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-slate-300">
                        Esto cerrará cualquier sesión activa. El usuario podrá volver a entrar iniciando sesión.
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={disabled}
                                className="border border-slate-700 bg-slate-900/30 text-slate-100 hover:bg-slate-900/60 disabled:pointer-events-none disabled:opacity-40"
                            >
                                {isPending ? "Forzando..." : "Forzar logout"}
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent className="border border-slate-800 bg-slate-950 text-slate-100">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-100">
                                    Confirmar logout forzado
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-300">
                                    ¿Seguro que querés invalidar la sesión activa de este usuario?
                                    Tendrá que iniciar sesión nuevamente.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    className="border border-slate-800 bg-slate-900/30 text-slate-100 hover:bg-slate-900/60"
                                    disabled={isPending}
                                >
                                    Cancelar
                                </AlertDialogCancel>

                                <AlertDialogAction
                                    onClick={handleConfirm}
                                    disabled={isPending}
                                    className="bg-slate-200 text-slate-950 hover:bg-white"
                                >
                                    {isPending ? "Forzando..." : "Confirmar"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

            {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
            {ok ? <p className="mt-3 text-xs text-emerald-300">{ok}</p> : null}
        </div>
    );
}
