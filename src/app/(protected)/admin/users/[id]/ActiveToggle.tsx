// src/app/(protected)/admin/users/[id]/ActiveToggle.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { setUserActiveAction } from "./actions";

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
    currentActive: number | null; // en tu schema es Int?
    isAdminTarget: boolean;
};

export default function ActiveToggle({
    userId,
    currentActive,
    isAdminTarget,
}: Props) {
    const active = (currentActive ?? 1) === 1;

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    // ✅ (5) disabled contempla pending + adminTarget
    const disabled = isAdminTarget || isPending;

    const nextActive: 0 | 1 = active ? 0 : 1;

    const statusPillClass = useMemo(() => {
        return `rounded-full border px-2 py-0.5 text-xs ${active
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            : "border-red-500/40 bg-red-500/10 text-red-200"
            }`;
    }, [active]);

    const buttonClass = useMemo(() => {
        return `rounded-md px-4 py-2 text-sm font-medium disabled:pointer-events-none disabled:opacity-40 ${active
            ? "border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
            : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
            }`;
    }, [active]);

    function clearMessages() {
        setError(null);
        setOk(null);
    }

    function handleConfirm() {
        clearMessages();

        startTransition(async () => {
            try {
                // ✅ (3) usamos el retorno real de la action
                const res = await setUserActiveAction(userId, nextActive);
                setOk(res.active === 1 ? "Usuario activado." : "Usuario desactivado.");
            } catch (e: any) {
                setError(e?.message ?? "No se pudo cambiar el estado.");
            }
        });
    }

    return (
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-slate-200">Estado</h2>
                    <p className="mt-1 text-xs text-slate-400">
                        Activar o desactivar la cuenta del usuario.
                    </p>
                </div>

                <span className={statusPillClass}>{active ? "Activo" : "Inactivo"}</span>
            </div>

            {isAdminTarget ? (
                <p className="mt-3 text-xs text-slate-400">
                    Este usuario es <span className="text-slate-200">admin</span>. Para
                    evitar errores, no se permite cambiar su estado.
                </p>
            ) : (
                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-sm text-slate-300">
                        {active
                            ? "Si lo desactivás, no debería poder iniciar sesión ni usar funcionalidades privadas."
                            : "Si lo activás, recupera el acceso normal."}
                    </div>

                    {/* ✅ (4) Confirm con AlertDialog */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                className={buttonClass}
                                disabled={disabled}
                                variant="outline"
                            >
                                {isPending ? "Guardando..." : active ? "Desactivar" : "Activar"}
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent className="border border-slate-800 bg-slate-950 text-slate-100">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-100">
                                    Confirmar acción
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-300">
                                    {active
                                        ? "¿Seguro que querés desactivar este usuario? No podrá iniciar sesión ni usar funcionalidades privadas."
                                        : "¿Seguro que querés activar este usuario? Recuperará el acceso normal."}
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    className="border border-slate-800 bg-slate-900/30 text-slate-100 hover:bg-slate-900/60"
                                    disabled={isPending}
                                    onClick={() => {
                                        // opcional: limpiar mensajes al cancelar
                                        // clearMessages();
                                    }}
                                >
                                    Cancelar
                                </AlertDialogCancel>

                                <AlertDialogAction
                                    onClick={handleConfirm}
                                    disabled={isPending}
                                    className={
                                        active
                                            ? "bg-red-600 text-white hover:bg-red-600/90"
                                            : "bg-emerald-600 text-white hover:bg-emerald-600/90"
                                    }
                                >
                                    {isPending ? "Guardando..." : active ? "Desactivar" : "Activar"}
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