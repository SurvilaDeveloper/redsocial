// src/components/custom/editAccountForm.tsx
"use client";

import { changePasswordSchema } from "@/lib/zod";
import { useState, useEffect, useMemo, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Laptop,
    Smartphone,
    Tablet,
    Pencil,
    EyeIcon,
    Share2,
    Shield,
    Lock,
    MonitorSmartphone,
    Users,
    MessageCircle,
    Image as ImageIcon,
    ThumbsUp,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { FormPasswordInput } from "@/components/inputs";
import ConfigurationSelect from "./ConfigurationSelect";

import {
    VISIBILITY_SELECT_1,
    VISIBILITY_SELECT_2,
} from "@/lib/visibility-options";

import {
    WHO_CAN_WRITE_SELECT_1,
    WHO_CAN_WRITE_SELECT_2,
    WHO_CAN_SHARE_SELECT_2,
} from "@/lib/who-can";

import { Configuration } from "@/types/configuration";

interface VisibilityOption {
    label: string;
    value: number;
}

type PasswordFormValues = z.infer<typeof changePasswordSchema>;

type DeviceType = "desktop" | "mobile" | "tablet";

type Device = {
    id: number;
    name: string;
    deviceType: DeviceType;
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

function isSameConfig(a: any, b: any) {
    return JSON.stringify(a) === JSON.stringify(b);
}

/* =========================
   UI helpers (solo layout)
========================= */

function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-4 lg:w-[720px] w-full p-2">
            <div className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/50 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                <div className="p-4 lg:p-6">{children}</div>
            </div>
        </div>
    );
}

function SectionCard({
    title,
    icon,
    children,
    className,
}: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                "rounded-xl border border-slate-800/80 bg-slate-900/25",
                "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
                "p-4 lg:p-5 space-y-4",
                className
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {icon ? (
                        <span className="text-slate-400">{icon}</span>
                    ) : null}
                    <h3 className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/90 uppercase">
                        {title}
                    </h3>
                </div>
            </div>
            <div className="space-y-2">{children}</div>
        </section>
    );
}

function InlineNotice({
    type,
    message,
}: {
    type: "success" | "error";
    message: string;
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                type === "success" &&
                "bg-emerald-600/10 border-emerald-700/60 text-emerald-200",
                type === "error" &&
                "bg-red-600/10 border-red-700/60 text-red-200"
            )}
        >
            {type === "success" ? (
                <CheckCircle2 size={16} />
            ) : (
                <AlertTriangle size={16} />
            )}
            <span className="leading-snug">{message}</span>
        </div>
    );
}

export default function AccountForm({ config }: { config: Configuration }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState<"privacy" | "password" | "devices">("privacy");

    const [status, setStatus] = useState<{
        type: "idle" | "success" | "error";
        message: string | null;
    }>({ type: "idle", message: null });

    const [defaultConfiguration, setDefaultConfiguration] = useState(() => ({
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

        postsWhoCanShare: config?.postsWhoCanShare ?? 2,

        postCommentsWhoCanWrite: config?.postCommentsWhoCanWrite ?? 2,
        postRepliesWhoCanWrite: config?.postRepliesWhoCanWrite ?? 2,

        mediaCommentsWhoCanWrite: config?.mediaCommentsWhoCanWrite ?? 2,
        mediaRepliesWhoCanWrite: config?.mediaRepliesWhoCanWrite ?? 2,
    }));

    const [configuration, setConfiguration] = useState(defaultConfiguration);

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        mode: "onChange",
    });

    useEffect(() => {
        setConfiguration(defaultConfiguration);
    }, [defaultConfiguration]);

    const isDirty = useMemo(() => {
        return !isSameConfig(configuration, defaultConfiguration);
    }, [configuration, defaultConfiguration]);

    const [discardAsk, setDiscardAsk] = useState(false);
    const [pendingPage, setPendingPage] = useState<
        null | "privacy" | "password" | "devices"
    >(null);
    const [pendingExit, setPendingExit] = useState(false);

    const toggleDiscardAsk = () => {
        setDiscardAsk((prev) => !prev);
    };

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    async function changePassword(values: PasswordFormValues) {
        try {
            setSaving(true);
            setStatus({ type: "idle", message: null });

            const res = await fetch("/api/account/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    Object.entries(data.errors as Record<string, string>).forEach(
                        ([k, msg]) => {
                            if (
                                k === "currentPassword" ||
                                k === "newPassword" ||
                                k === "confirmPassword"
                            ) {
                                passwordForm.setError(k as keyof PasswordFormValues, {
                                    type: "server",
                                    message: msg,
                                });
                            }
                        }
                    );
                    return;
                }

                setStatus({
                    type: "error",
                    message: data.error ?? "Error al cambiar contraseña",
                });
                return;
            }

            passwordForm.reset(
                { currentPassword: "", newPassword: "", confirmPassword: "" },
                { keepErrors: false, keepDirty: false, keepTouched: false }
            );

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
        options: VisibilityOption[],
        intent?: "view" | "share" | "write"
    ) => {
        const meta =
            intent === "share"
                ? {
                    icon: <Share2 size={16} />,
                    desc: "Configura quién puede compartir esto",
                }
                : intent === "write"
                    ? {
                        icon: <Pencil size={16} />,
                        desc: "Configura quién puede escribir",
                    }
                    : {
                        icon: <EyeIcon size={16} />,
                        desc: "Configura quién puede ver esta información",
                    };

        return (
            <div
                className={cn(
                    "grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4",
                    "p-3 lg:p-3.5 rounded-lg",
                    "border border-transparent",
                    "hover:border-slate-800/70 hover:bg-slate-950/20 transition"
                )}
            >
                <div className="space-y-1">
                    <Label className="flex flex-row gap-1.5 items-center text-sm text-slate-200">
                        <span className="text-slate-400">{meta.icon}</span>
                        {label}
                    </Label>
                    <p className="text-xs text-slate-500 leading-snug">{meta.desc}</p>
                </div>

                <div className="lg:flex lg:justify-end">
                    <div className="w-full lg:max-w-[320px]">
                        <ConfigurationSelect
                            value={configuration[key]}
                            options={options}
                            onChange={(value) =>
                                setConfiguration((prev) => ({ ...prev, [key]: value }))
                            }
                        />
                    </div>
                </div>
            </div>
        );
    };

    async function saveConfiguration() {
        try {
            setSaving(true);
            setStatus({ type: "idle", message: null });

            const res = await fetch("/api/configuration", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(configuration),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setStatus({
                    type: "error",
                    message: data?.error ?? "No se pudo guardar la configuración",
                });
                return;
            }

            setDefaultConfiguration(configuration);
            setStatus({ type: "success", message: "Configuración guardada" });
        } catch (err) {
            console.error(err);
            setStatus({ type: "error", message: "No se pudo guardar la configuración" });
        } finally {
            setSaving(false);
        }
    }

    const handleTryExit = useCallback(() => {
        if (page === "privacy" && isDirty) {
            setPendingExit(true);
            setPendingPage(null);
            setDiscardAsk(true);
            return;
        }
        router.push("/");
    }, [page, isDirty, router]);

    const handleTryChangePage = useCallback(
        (next: "privacy" | "password" | "devices") => {
            if (next === page) return;
            if (page === "privacy" && isDirty) {
                setPendingExit(false);
                setPendingPage(next);
                setDiscardAsk(true);
                return;
            }
            setPage(next);
        },
        [page, isDirty]
    );

    const handleConfirmDiscard = useCallback(() => {
        setConfiguration(defaultConfiguration);
        setDiscardAsk(false);

        if (pendingExit) {
            router.push("/");
            return;
        }

        if (pendingPage) {
            setPage(pendingPage);
            setPendingPage(null);
            return;
        }
    }, [defaultConfiguration, pendingExit, pendingPage, router]);

    const tabs: { id: "privacy" | "password" | "devices"; label: string; icon: React.ReactNode }[] =
        [
            { id: "privacy", label: "Privacidad", icon: <Shield size={16} /> },
            { id: "password", label: "Cambiar contraseña", icon: <Lock size={16} /> },
            { id: "devices", label: "Otros dispositivos", icon: <MonitorSmartphone size={16} /> },
        ];

    return (
        <PageShell>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="space-y-1">
                    <h2 className="text-lg lg:text-xl font-semibold text-slate-100">
                        Editar cuenta
                    </h2>
                    <p className="text-xs lg:text-sm text-slate-400">
                        Ajustá tu privacidad, seguridad y dispositivos conectados.
                    </p>
                </div>

                <div className="hidden lg:flex items-center gap-2">
                    {page === "privacy" ? (
                        <Badge
                            variant="secondary"
                            className={cn(
                                "border border-slate-700/60 bg-slate-900/40 text-slate-200"
                            )}
                        >
                            Privacidad
                        </Badge>
                    ) : page === "password" ? (
                        <Badge
                            variant="secondary"
                            className={cn(
                                "border border-slate-700/60 bg-slate-900/40 text-slate-200"
                            )}
                        >
                            Seguridad
                        </Badge>
                    ) : (
                        <Badge
                            variant="secondary"
                            className={cn(
                                "border border-slate-700/60 bg-slate-900/40 text-slate-200"
                            )}
                        >
                            Dispositivos
                        </Badge>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="w-full rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3">
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTryChangePage(tab.id)}
                            className={cn(
                                "relative px-3 py-3 text-xs lg:text-sm font-medium",
                                "text-left lg:text-center",
                                "border-b lg:border-b-0 lg:border-r border-slate-800/70",
                                idx === 2 && "lg:border-r-0",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                                page === tab.id
                                    ? "bg-emerald-500/10 text-emerald-200"
                                    : "bg-transparent text-slate-300 hover:bg-slate-900/50"
                            )}
                        >
                            <span className="inline-flex items-center gap-2 justify-start lg:justify-center">
                                <span className={cn(page === tab.id ? "text-emerald-300" : "text-slate-400")}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </span>

                            {/* indicator */}
                            <span
                                className={cn(
                                    "absolute left-0 right-0 bottom-0 h-[2px] transition",
                                    page === tab.id ? "bg-emerald-500/70" : "bg-transparent"
                                )}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* ================= PRIVACIDAD ================= */}
            {page === "privacy" && (
                <div className="space-y-4 mt-4">
                    {/* Top notice */}
                    {status.message && status.type !== "idle" ? (
                        <InlineNotice
                            type={status.type === "success" ? "success" : "error"}
                            message={status.message}
                        />
                    ) : null}

                    <SectionCard title="Perfil" icon={<Users size={16} />}>
                        {render("profileImageVisibility", "Imagen de perfil", VISIBILITY_SELECT_1, "view")}
                        {render("coverImageVisibility", "Imagen de portada", VISIBILITY_SELECT_1, "view")}
                        {render("fullProfileVisibility", "Perfil completo", VISIBILITY_SELECT_1, "view")}
                    </SectionCard>

                    <SectionCard title="Muro y contenido" icon={<MessageCircle size={16} />}>
                        {render("wallVisibility", "Muro", VISIBILITY_SELECT_1, "view")}
                        {render("postsVisibility", "Publicaciones", VISIBILITY_SELECT_1, "view")}
                        {render("postsWhoCanShare", "Publicaciones", WHO_CAN_SHARE_SELECT_2, "share")}

                        {render(
                            "postCommentsVisibility",
                            "Comentarios de publicaciones",
                            VISIBILITY_SELECT_1,
                            "view"
                        )}
                        {render(
                            "postCommentsWhoCanWrite",
                            "Comentarios de publicaciones",
                            WHO_CAN_WRITE_SELECT_2,
                            "write"
                        )}

                        {render(
                            "postRepliesVisibility",
                            "Respuestas a comentarios de publicaciones",
                            VISIBILITY_SELECT_1,
                            "view"
                        )}
                        {render(
                            "postRepliesWhoCanWrite",
                            "Respuestas a comentarios de publicaciones",
                            WHO_CAN_WRITE_SELECT_2,
                            "write"
                        )}
                    </SectionCard>

                    <SectionCard title="Medios" icon={<ImageIcon size={16} />}>
                        {render("mediaVisibility", "Medios", VISIBILITY_SELECT_1, "view")}

                        {render(
                            "mediaCommentsVisibility",
                            "Comentarios de medios",
                            VISIBILITY_SELECT_1,
                            "view"
                        )}
                        {render(
                            "mediaCommentsWhoCanWrite",
                            "Comentarios de medios",
                            WHO_CAN_WRITE_SELECT_2,
                            "write"
                        )}

                        {render(
                            "mediaRepliesVisibility",
                            "Respuestas a comentarios de medios",
                            VISIBILITY_SELECT_1,
                            "view"
                        )}
                        {render(
                            "mediaRepliesWhoCanWrite",
                            "Respuestas a comentarios de medios",
                            WHO_CAN_WRITE_SELECT_2,
                            "write"
                        )}
                    </SectionCard>

                    <SectionCard title="Relaciones" icon={<Users size={16} />}>
                        {render("friendsListVisibility", "Lista de amigos", VISIBILITY_SELECT_2, "view")}
                        {render(
                            "followersListVisibility",
                            "Lista de seguidores",
                            VISIBILITY_SELECT_1,
                            "view"
                        )}
                        {render(
                            "followingListVisibility",
                            "Lista de seguidos",
                            VISIBILITY_SELECT_1,
                            "view"
                        )}
                    </SectionCard>

                    <SectionCard title="Interacciones" icon={<ThumbsUp size={16} />}>
                        {render("likesVisibility", "Likes", VISIBILITY_SELECT_1, "view")}
                    </SectionCard>

                    {/* Footer actions */}
                    <div
                        className={cn(
                            "sticky bottom-2 z-10",
                            "rounded-xl border border-slate-800 bg-slate-950/70 backdrop-blur",
                            "p-3 lg:p-4"
                        )}
                    >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="text-xs text-slate-400">
                                {isDirty ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-amber-400/90" />
                                        Tenés cambios sin guardar
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                                        Todo guardado
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                                <Button
                                    onClick={saveConfiguration}
                                    disabled={saving || !isDirty}
                                    className={cn(
                                        "h-10 rounded-md",
                                        "bg-emerald-600 hover:bg-emerald-500",
                                        "text-sm font-medium"
                                    )}
                                >
                                    {saving ? "Guardando..." : "Guardar cambios"}
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleTryExit}
                                    variant="outline"
                                    className={cn(
                                        "h-10 rounded-md",
                                        "border-slate-700 bg-slate-900/30 text-slate-200",
                                        "hover:bg-slate-900/60 hover:text-slate-50"
                                    )}
                                >
                                    {isDirty ? "Salir sin guardar" : "Salir"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm discard */}
            {discardAsk && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
                    <div className="w-full max-w-sm rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3 text-sm text-slate-100 shadow-xl">
                        <p className="font-semibold">¿Descartar cambios?</p>
                        <p className="text-xs text-slate-300 leading-snug">
                            Si continuás sin guardar, se perderán los cambios realizados en privacidad.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    toggleDiscardAsk();
                                    setPendingPage(null);
                                    setPendingExit(false);
                                }}
                                className="h-9 px-3 text-xs border-slate-700 bg-slate-900/50 hover:bg-slate-900"
                            >
                                Volver
                            </Button>
                            <button
                                type="button"
                                onClick={handleConfirmDiscard}
                                className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-red-600 hover:bg-red-500 text-xs font-medium text-slate-50"
                            >
                                Descartar y continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= PASSWORD ================= */}
            {page === "password" && (
                <div className="space-y-4 mt-4">
                    <SectionCard title="Seguridad" icon={<Lock size={16} />}>
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-slate-100">
                                Cambiar contraseña
                            </h3>
                            <p className="text-xs text-slate-400 leading-snug">
                                Elegí una contraseña segura. Te pediremos confirmación por email.
                            </p>
                        </div>

                        {status.message && status.type !== "idle" ? (
                            <InlineNotice
                                type={status.type === "success" ? "success" : "error"}
                                message={status.message}
                            />
                        ) : null}

                        <Form {...passwordForm}>
                            <form
                                onSubmit={passwordForm.handleSubmit(changePassword)}
                                className="space-y-4 w-full"
                            >
                                <div className="grid grid-cols-1 gap-4">
                                    <FormPasswordInput
                                        control={passwordForm.control}
                                        name="currentPassword"
                                        label="Contraseña actual"
                                        placeholder="••••••••"
                                        height="36px"
                                        width="100%"
                                        loading={saving}
                                    />

                                    <FormPasswordInput
                                        control={passwordForm.control}
                                        name="newPassword"
                                        label="Nueva contraseña"
                                        placeholder="••••••••"
                                        height="36px"
                                        width="100%"
                                        loading={saving}
                                    />

                                    <FormPasswordInput
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        label="Confirmar contraseña"
                                        placeholder="••••••••"
                                        height="36px"
                                        width="100%"
                                        loading={saving}
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-1">
                                    <Button
                                        type="submit"
                                        disabled={!passwordForm.formState.isValid || saving}
                                        className="h-10 bg-emerald-600 hover:bg-emerald-500"
                                    >
                                        {saving ? "Actualizando..." : "Cambiar contraseña"}
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={handleTryExit}
                                        variant="outline"
                                        className={cn(
                                            "h-10",
                                            "border-slate-700 bg-slate-900/30 text-slate-200",
                                            "hover:bg-slate-900/60 hover:text-slate-50"
                                        )}
                                    >
                                        Salir
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </SectionCard>
                </div>
            )}

            {/* ================= DEVICES ================= */}
            {page === "devices" && (
                <div className="space-y-4 mt-4">
                    <SectionCard title="Dispositivos" icon={<MonitorSmartphone size={16} />}>
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-slate-100">
                                Otros dispositivos
                            </h3>
                            <p className="text-xs text-slate-400 leading-snug">
                                Administrá los dispositivos que tienen acceso a tu cuenta.
                            </p>
                        </div>

                        {loadingDevices ? (
                            <p className="text-xs text-slate-400">Cargando dispositivos...</p>
                        ) : devices.length === 0 ? (
                            <p className="text-xs text-slate-400">
                                No hay otros dispositivos registrados.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {devices.map((device) => (
                                    <Card
                                        key={device.id}
                                        className={cn(
                                            "bg-slate-950/50 border-slate-800/90",
                                            "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                                        )}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between px-3 py-2">
                                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-100">
                                                <DeviceIcon type={device.deviceType} />
                                                {device.name}
                                            </CardTitle>

                                            <Badge
                                                variant={device.revoked ? "destructive" : "secondary"}
                                                className={cn(
                                                    "text-xs px-2 py-0.5",
                                                    !device.revoked &&
                                                    "border border-slate-700/60 bg-slate-900/40 text-slate-200"
                                                )}
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
                                                        className="h-8"
                                                    >
                                                        Confiar
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDisable(device.id)}
                                                        className="h-8"
                                                    >
                                                        Revocar
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end pt-1">
                            <Button
                                type="button"
                                onClick={handleTryExit}
                                variant="outline"
                                className={cn(
                                    "h-10 w-full sm:w-auto",
                                    "border-slate-700 bg-slate-900/30 text-slate-200",
                                    "hover:bg-slate-900/60 hover:text-slate-50"
                                )}
                            >
                                Salir
                            </Button>
                        </div>
                    </SectionCard>
                </div>
            )}
        </PageShell>
    );
}
