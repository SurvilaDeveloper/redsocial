//src/components/custom/editAccountForm.tsx

"use client";

import { changePasswordSchema } from "@/lib/zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Laptop, Smartphone, Tablet } from "lucide-react";

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

type DeviceType = "desktop" | "mobile" | "tablet";

type Device = {
    id: number;
    name: string;
    deviceType: DeviceType; // 👈 NUEVO
    lastUsedAt: string;
    createdAt: string;
    revoked: boolean;
};

function DeviceIcon({ type }: { type: DeviceType }) {
    switch (type) {
        case "mobile":
            return <Smartphone size={14} className="text-slate-400" />;
        case "tablet":
            return <Tablet size={14} className="text-slate-400" />;
        default:
            return <Laptop size={14} className="text-slate-400" />;
    }
}


export default function AccountForm({ config }: { config: Configuration }) {
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState<"privacy" | "password" | "devices">("privacy");

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

    const [devices, setDevices] = useState<Device[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(false);

    const fetchDevices = async () => {
        setLoadingDevices(true);
        try {
            const res = await fetch("/api/security/devices");
            const data = await res.json();
            setDevices(data.devices);
        } catch (err) {
            console.error(err);
            alert("No se pudieron cargar los dispositivos");
        } finally {
            setLoadingDevices(false);
        }
    };

    const handleDisable = async (deviceId: number) => {
        try {
            const res = await fetch("/api/security/devices/request-disable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceId }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error ?? "No se pudo enviar el email");
                return;
            }

            alert("Te enviamos un email para confirmar la revocación del dispositivo");
        } catch (err) {
            console.error(err);
            alert("Error al solicitar la revocación");
        }
    };


    const handleEnable = async (deviceId: number) => {
        try {
            const res = await fetch(`/api/security/devices/${deviceId}/trust`, {
                method: "POST",
            });
            const data = await res.json();
            if (data.success) fetchDevices();
        } catch (err) {
            console.error(err);
            alert("No se pudo habilitar el dispositivo");
        }
    };



    useEffect(() => {
        if (page === "devices") {
            fetchDevices();
        }
    }, [page]);


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
        <div className="
    grid grid-cols-1 md:grid-cols-2 gap-4
    py-2 px-2 rounded-md
    hover:bg-slate-900/40 transition
  ">
            <div className="space-y-0.5">
                <Label className="text-sm text-slate-300">
                    {label}
                </Label>
                <p className="text-xs text-slate-500">
                    Configura quién puede ver esta información
                </p>
            </div>

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

    const tabs: { id: "privacy" | "password" | "devices"; label: string }[] = [
        { id: "privacy", label: "Privacidad" },
        { id: "password", label: "Cambiar contraseña" },
        { id: "devices", label: "Otros dispositivos" },
    ];




    return (
        <div className="flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex flex-col lg:flex-row rounded-lg border border-slate-800 bg-slate-950/80 overflow-hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPage(tab.id)}

                        className={cn(
                            "flex-1 px-3 py-2 text-xs sm:text-sm font-medium border-b sm:border-b-0 sm:border-r border-slate-800/70 focus:outline-none",
                            page === tab.id
                                ? "bg-emerald-500/10 text-emerald-300"
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

                    <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

                    <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                        Perfil
                    </h3>

                    {render("profileImageVisibility", "Imagen de perfil", VISIBILITY_SELECT_1)}
                    {render("coverImageVisibility", "Imagen de portada", VISIBILITY_SELECT_1)}
                    {render("fullProfileVisibility", "Perfil completo", VISIBILITY_SELECT_1)}

                    <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

                    <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                        Muro y contenido
                    </h3>

                    {render("wallVisibility", "Muro", VISIBILITY_SELECT_1)}
                    {render("postsVisibility", "Publicaciones", VISIBILITY_SELECT_1)}
                    {render("postCommentsVisibility", "Comentarios de publicaciones", VISIBILITY_SELECT_1)}
                    {render("postRepliesVisibility", "Respuestas a comentarios de publicaciones", VISIBILITY_SELECT_1)}
                    {render("mediaVisibility", "Medios", VISIBILITY_SELECT_1)}
                    {render("mediaCommentsVisibility", "Comentarios de medios", VISIBILITY_SELECT_1)}
                    {render("mediaRepliesVisibility", "Respuestas a comentarios de medios", VISIBILITY_SELECT_1)}

                    <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

                    <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                        Relaciones
                    </h3>

                    {render("friendsListVisibility", "Lista de amigos", VISIBILITY_SELECT_2)}
                    {render("followersListVisibility", "Lista de seguidores", VISIBILITY_SELECT_1)}
                    {render("followingListVisibility", "Lista de seguidos", VISIBILITY_SELECT_1)}

                    <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

                    <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                        Interacciones
                    </h3>

                    {render("privateMessagesVisibility", "Mensajes privados", VISIBILITY_SELECT_2)}
                    {render("likesVisibility", "Likes", VISIBILITY_SELECT_1)}

                    <Button
                        onClick={saveConfiguration}
                        disabled={saving}
                        className="
    mt-6 w-full h-10
    bg-emerald-600 hover:bg-emerald-500
    text-slate-900 font-medium
    disabled:opacity-60 disabled:cursor-not-allowed
    transition
  "
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
            {/* ================= DEVICES ================= */}
            {page === "devices" && (
                <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-slate-200">
                        Otros dispositivos
                    </h2>

                    {loadingDevices ? (
                        <p className="text-xs text-slate-400">Cargando dispositivos...</p>
                    ) : devices.length === 0 ? (
                        <p className="text-xs text-slate-400">
                            No hay otros dispositivos registrados.
                        </p>
                    ) : (
                        devices.map((device) => (
                            <Card
                                key={device.id}
                                className="py-1 bg-slate-950/60 border-slate-800"
                            >

                                <CardHeader className="flex flex-row items-center justify-between px-3 py-2">
                                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                        <DeviceIcon type={device.deviceType} />
                                        {device.name}
                                    </CardTitle>

                                    <Badge
                                        variant={device.revoked ? "destructive" : "secondary"}
                                        className="text-xs px-2 py-0.5"
                                    >
                                        {device.revoked ? "Revocado" : "Activo"}
                                    </Badge>
                                </CardHeader>

                                <CardContent className="flex items-center justify-between px-3 py-2">
                                    <div className="text-xs text-slate-400 space-y-0.5">
                                        <p>
                                            Último uso:{" "}
                                            {new Date(device.lastUsedAt).toLocaleString()}
                                        </p>
                                        <p>
                                            Creado:{" "}
                                            {new Date(device.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex gap-1">
                                        {device.revoked ? (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleEnable(device.id)}
                                            >
                                                Confiar
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDisable(device.id)}
                                            >
                                                Revocar
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}