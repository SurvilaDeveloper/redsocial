// src/app/(protected)/admin/users/[id]/RoleEditor.tsx

"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@prisma/client";
import { updateUserRoleAction } from "./actions";

type Props = {
    userId: number;
    currentRole: UserRole | null;
    isAdminTarget: boolean;
};

const ROLES: UserRole[] = [
    "novice",
    "user",
    "premium",
    "server",
    "shop",
    "moderator",
    "admin",
];

export default function RoleEditor({ userId, currentRole, isAdminTarget }: Props) {
    const [value, setValue] = useState<UserRole>((currentRole ?? "user") as UserRole);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    const disabled = isAdminTarget;

    return (
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-slate-200">Rol</h2>
                    <p className="mt-1 text-xs text-slate-400">
                        Cambiar permisos del usuario.
                    </p>
                </div>

                {disabled ? (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                        Protegido
                    </span>
                ) : null}
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1">
                    <label className="mb-1 block text-xs text-slate-400">Rol actual</label>
                    <select
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value as UserRole);
                            setError(null);
                            setOk(null);
                        }}
                        disabled={disabled || isPending}
                        className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600 disabled:opacity-50"
                    >
                        {ROLES.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>

                    {disabled ? (
                        <p className="mt-2 text-xs text-slate-400">
                            Este usuario es <span className="text-slate-200">admin</span>. Para evitar errores, el cambio de rol está deshabilitado.
                        </p>
                    ) : null}

                    {error ? (
                        <p className="mt-2 text-xs text-red-300">{error}</p>
                    ) : null}

                    {ok ? (
                        <p className="mt-2 text-xs text-emerald-300">{ok}</p>
                    ) : null}
                </div>

                <button
                    type="button"
                    disabled={disabled || isPending || value === (currentRole ?? "user")}
                    onClick={() => {
                        setError(null);
                        setOk(null);

                        startTransition(async () => {
                            try {
                                await updateUserRoleAction(userId, value);
                                setOk("Rol actualizado.");
                            } catch (e: any) {
                                setError(e?.message ?? "No se pudo actualizar el rol.");
                            }
                        });
                    }}
                    className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-white disabled:pointer-events-none disabled:opacity-40"
                >
                    {isPending ? "Guardando..." : "Guardar"}
                </button>
            </div>
        </div>
    );
}
