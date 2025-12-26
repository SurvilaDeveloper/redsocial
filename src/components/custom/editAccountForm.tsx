//src/components/custom/editAccountForm.tsx

"use client";

import { changePasswordSchema } from "@/lib/zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import VisibilitySelect from "./VisibilitySelect";
import {
    VISIBILITY_SELECT_1,
    VISIBILITY_SELECT_2,
} from "@/lib/visibility-options";

import { Configuration } from "@/types/configuration";

interface VisibilityOption {
    label: string;
    value: number;
}

type PasswordStatus = {
    type: "idle" | "success";
    message: string | null;
};

export default function AccountForm({ config }: { config: Configuration }) {
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState<"privacy" | "password">("privacy");

    const [status, setStatus] = useState<{
        type: "idle" | "success" | "error";
        message: string | null;
    }>({ type: "idle", message: null });

    const [errors, setErrors] = useState<{
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({});
    ;



    const [configuration, setConfiguration] = useState({
        profileImageVisibility: config?.profileImageVisibility ?? 1,
        coverImageVisibility: config?.coverImageVisibility ?? 1,
        fullProfileVisibility: config?.fullProfileVisibility ?? 1,

        wallVisibility: config?.wallVisibility ?? 1,
        postsVisibility: config?.postsVisibility ?? 1,
        postCommentsVisibility: config?.postCommentsVisibility ?? 1,
        postRepliesVisibility: config?.postRepliesVisibility ?? 1,

        mediaVisibility: config?.mediaVisibility ?? 1,
        mediaCommentsVisibility: config?.mediaCommentsVisibility ?? 1,
        mediaRepliesVisibility: config?.mediaRepliesVisibility ?? 1,

        friendsListVisibility: config?.friendsListVisibility ?? 2,
        followersListVisibility: config?.followersListVisibility ?? 1,
        followingListVisibility: config?.followingListVisibility ?? 1,

        likesVisibility: config?.likesVisibility ?? 1,
        privateMessagesVisibility: config?.privateMessagesVisibility ?? 2,
    });

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const canSubmit =
        Boolean(passwords.currentPassword) &&
        Boolean(passwords.newPassword) &&
        Boolean(passwords.confirmPassword);

    async function changePassword() {
        // 🔹 Validación frontend
        const parsed = changePasswordSchema.safeParse(passwords);

        if (!parsed.success) {
            const fieldErrors: typeof errors = {};

            parsed.error.issues.forEach((issue) => {
                const field = issue.path[0] as keyof typeof fieldErrors;
                fieldErrors[field] = issue.message;
            });

            setErrors(fieldErrors);
            setStatus({ type: "idle", message: null });
            return;
        }

        try {
            setSaving(true);
            setErrors({});
            setStatus({ type: "idle", message: null });

            const res = await fetch("/api/account/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });

            const data = await res.json();

            // 🔴 Error desde backend
            if (!res.ok) {
                // Errores por campo
                if (data.errors) {
                    setErrors(data.errors);
                    return;
                }

                // Error general
                setStatus({
                    type: "error",
                    message: data.error ?? "Error al cambiar contraseña",
                });
                return;
            }

            // ✅ Éxito
            setPasswords({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            setStatus({
                type: "success",
                message: "Te enviamos un email para confirmar el cambio de contraseña",
            });

        } finally {
            setSaving(false);
        }
    }






    const render = (
        key: keyof typeof configuration,
        label: string,
        options: VisibilityOption[]
    ) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <Label className="text-sm">{label}</Label>
            <VisibilitySelect
                value={configuration[key]}
                options={options}
                onChange={(value) =>
                    setConfiguration((prev) => ({ ...prev, [key]: value }))
                }
            />
        </div>
    );

    async function saveConfiguration() {
        try {
            setSaving(true);

            const res = await fetch("/api/configuration", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(configuration),
            });

            if (!res.ok) {
                throw new Error("Error al guardar configuración");
            }
        } catch (err) {
            console.error(err);
            alert("No se pudo guardar la configuración");
        } finally {
            setSaving(false);
        }
    }

    const tabs = [
        { id: "privacy", label: "Privacidad" },
        { id: "password", label: "Cambiar contraseña" },
    ];


    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6 space-y-4">
            {/* Tabs */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row rounded-lg border border-slate-800 bg-slate-950/80 overflow-hidden">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setPage(tab.id as "privacy" | "password")}
                            className={cn(
                                "flex-1 px-3 py-2 text-xs sm:text-sm font-medium border-b sm:border-b-0 sm:border-r border-slate-800/70 focus:outline-none",
                                page === tab.id
                                    ? "bg-emerald-900/40 text-emerald-200"
                                    : "bg-slate-950/0 text-slate-300 hover:bg-slate-900/70"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ================= PRIVACIDAD ================= */}
                {page === "privacy" && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-100">
                            Privacidad y cuenta
                        </h2>

                        <hr className="border-slate-800/70" />
                        <h3 className="text-md font-light text-slate-200">
                            Perfil
                        </h3>

                        {render("profileImageVisibility", "Imagen de perfil", VISIBILITY_SELECT_1)}
                        {render("coverImageVisibility", "Imagen de portada", VISIBILITY_SELECT_1)}
                        {render("fullProfileVisibility", "Perfil completo", VISIBILITY_SELECT_1)}

                        <hr className="border-slate-800/70" />
                        <h3 className="text-md font-light text-slate-200">
                            Muro y contenido
                        </h3>

                        {render("wallVisibility", "Muro", VISIBILITY_SELECT_1)}
                        {render("postsVisibility", "Publicaciones", VISIBILITY_SELECT_1)}
                        {render("postCommentsVisibility", "Comentarios de publicaciones", VISIBILITY_SELECT_1)}
                        {render("postRepliesVisibility", "Respuestas a comentarios de publicaciones", VISIBILITY_SELECT_1)}
                        {render("mediaVisibility", "Medios", VISIBILITY_SELECT_1)}
                        {render("mediaCommentsVisibility", "Comentarios de medios", VISIBILITY_SELECT_1)}
                        {render("mediaRepliesVisibility", "Respuestas a comentarios de medios", VISIBILITY_SELECT_1)}

                        <hr className="border-slate-800/70" />
                        <h3 className="text-md font-light text-slate-200">
                            Relaciones
                        </h3>

                        {render("friendsListVisibility", "Lista de amigos", VISIBILITY_SELECT_2)}
                        {render("followersListVisibility", "Lista de seguidores", VISIBILITY_SELECT_1)}
                        {render("followingListVisibility", "Lista de seguidos", VISIBILITY_SELECT_1)}

                        <hr className="border-slate-800/70" />
                        <h3 className="text-md font-light text-slate-200">
                            Interacciones
                        </h3>

                        {render("privateMessagesVisibility", "Mensajes privados", VISIBILITY_SELECT_2)}
                        {render("likesVisibility", "Likes", VISIBILITY_SELECT_1)}

                        <Button
                            onClick={saveConfiguration}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-500 mt-4"
                        >
                            {saving ? "Guardando..." : "Guardar configuración"}
                        </Button>
                    </div>
                )}

                {/* ================= PASSWORD ================= */}
                {page === "password" && (
                    <div className="space-y-4 max-w-md">
                        <h2 className="text-lg font-semibold text-slate-100">
                            Cambiar contraseña
                        </h2>
                        {status.message && (
                            <div
                                className={cn(
                                    "rounded-lg border px-4 py-3 text-sm",
                                    status.type === "success" &&
                                    "bg-emerald-600/20 border-emerald-700 text-emerald-200",
                                    status.type === "error" &&
                                    "bg-red-600/20 border-red-700 text-red-200"
                                )}
                            >
                                {status.message}
                            </div>
                        )}



                        <div>
                            <Label>Contraseña actual</Label>
                            <Input
                                type="password"
                                value={passwords.currentPassword}
                                onChange={(e) => {
                                    setPasswords((p) => ({ ...p, currentPassword: e.target.value }));
                                    setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                                }}
                            />
                            {errors.currentPassword && (
                                <p className="text-sm text-red-400 mt-1">
                                    {errors.currentPassword}
                                </p>
                            )}
                        </div>


                        <div>
                            <Label>Nueva contraseña</Label>
                            <Input
                                type="password"
                                value={passwords.newPassword}
                                onChange={(e) => {
                                    setPasswords((p) => ({ ...p, newPassword: e.target.value }));
                                    setErrors((prev) => ({ ...prev, newPassword: undefined }));
                                }}
                            />
                            {errors.newPassword && (
                                <p className="text-sm text-red-400 mt-1">
                                    {errors.newPassword}
                                </p>
                            )}
                        </div>


                        <div>
                            <Label>Confirmar contraseña</Label>
                            <Input
                                type="password"
                                value={passwords.confirmPassword}
                                onChange={(e) => {
                                    setPasswords((p) => ({ ...p, confirmPassword: e.target.value }));
                                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                                }}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-400 mt-1">
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>


                        <Button
                            onClick={changePassword}
                            disabled={!canSubmit || saving}
                            className="bg-emerald-600 hover:bg-emerald-500"
                        >
                            {saving ? "Actualizando..." : "Cambiar contraseña"}
                        </Button>

                    </div>
                )}
            </div>
        </div>
    );
}