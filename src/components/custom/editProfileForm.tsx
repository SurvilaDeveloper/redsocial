// src/components/custom/editProfileForm.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertTriangle,
    CalendarIcon,
    CheckCircle2,
    EyeIcon,
    Globe,
    Image as ImageIcon,
    MapPin,
    Share2,
    User,
    X,
} from "lucide-react";

import { profileSchema } from "@/lib/zod";
import { cn } from "@/lib/utils";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
    FormTextInput,
    FormTextareaInput,
    FormInput,
    FormSelectNumberField,
} from "@/components/inputs";

import type { ProfileMe } from "@/types/profile";

import countriesData from "@/data/geodata/countries.json";
import statesRaw from "@/data/geodata/states_by_country.json";
import citiesRaw from "@/data/geodata/cities_by_state.json";

import WallHeaderShell from "./WallHeaderShell";

import { useToast } from "@/hooks/use-toast";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type GeoOption = { id: number; name: string };
type StatesByCountry = Record<number, GeoOption[]>;
type CitiesByState = Record<number, GeoOption[]>;

const statesData = statesRaw as StatesByCountry;
const citiesData = citiesRaw as CitiesByState;

type PageId = "personal" | "location" | "socialnets";

/**
 * Extensión local del schema para IDs geográficos (solo frontend).
 * (El backend puede guardar además country/province/city como nombres resueltos.)
 */
type ProfileFormValues = {
    countryId: number | null;
    provinceId: number | null;
    cityId: number | null;
} & Omit<ReturnType<typeof profileSchema.parse>, never>;

type SaveStatus =
    | { type: "idle"; message: null }
    | { type: "success"; message: string }
    | { type: "error"; message: string };

/* -------------------------------------------------------------------------- */
/*                               UI helpers (local)                           */
/* -------------------------------------------------------------------------- */

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
    actions,
    children,
    className,
}: {
    title: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
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
                    {icon ? <span className="text-slate-400">{icon}</span> : null}
                    <h3 className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/90 uppercase">
                        {title}
                    </h3>
                </div>
                {actions ? <div className="shrink-0">{actions}</div> : null}
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
                type === "error" && "bg-red-600/10 border-red-700/60 text-red-200"
            )}
        >
            {type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span className="leading-snug">{message}</span>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function ProfileForm({ user }: { user: ProfileMe }) {
    const { update } = useSession();
    const { toast } = useToast();
    /* ------------------------------ navigation / status ------------------------------ */

    const [page, setPage] = useState<PageId>("personal");
    const [status, setStatus] = useState<SaveStatus>({ type: "idle", message: null });
    const [saving, setSaving] = useState(false);

    // confirmación para descartar cambios
    const [discardAsk, setDiscardAsk] = useState(false);
    const [pendingPage, setPendingPage] = useState<null | PageId>(null);
    const [pendingExit, setPendingExit] = useState(false);

    /* ------------------------------ images state ------------------------------ */

    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [wallFile, setWallFile] = useState<File | null>(null);

    const initialWallType = user.wallHeaderBackgroundType ?? null;
    const initialWallColor = user.wallHeaderBackgroundColor ?? null;

    const [wallColor, setWallColor] = useState<string | null>(initialWallColor);
    const [wallHeaderBackgroundTypeState, setWallHeaderBackgroundTypeState] =
        useState<string | null>(initialWallType);

    const initialProfilePreview = user.imageUrl ?? user.image ?? "/user.jpg";
    const initialWallPreview =
        user.wallHeaderBackgroundType === "color"
            ? user.wallHeaderBackgroundColor
            : user.wallHeaderBackgroundType === "image"
                ? user.imageWallUrl
                : "/wall.jpg";

    const [preview, setPreview] = useState<string | null>(initialProfilePreview);
    const [wallPreview, setWallPreview] = useState<string | null>(initialWallPreview);

    const [uploadingProfile, setUploadingProfile] = useState(false);
    const [uploadingWall, setUploadingWall] = useState(false);

    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(user.imageUrl ?? null);
    const [wallImageUrl, setWallImageUrl] = useState<string | null>(user.imageWallUrl ?? null);

    const [profileImagePublicId, setProfileImagePublicId] = useState<string | null>(
        user.imagePublicId ?? null
    );
    const [wallImagePublicId, setWallImagePublicId] = useState<string | null>(
        user.imageWallPublicId ?? null
    );

    /**
     * 1) previewOpen: colapsa/expande TODO el bloque de vista previa (nuevo).
     * 2) previewExpanded: el estado interno que ya usabas dentro de WallHeaderShell.
     */
    const [previewOpen, setPreviewOpen] = useState(false); // ✅ inicia colapsado
    const [previewExpanded, setPreviewExpanded] = useState(false);

    /* ----------------------------- geo state ------------------------------ */

    const [countries, setCountries] = useState<GeoOption[]>([]);
    const [states, setStates] = useState<GeoOption[]>([]);
    const [cities, setCities] = useState<GeoOption[]>([]);

    const geoLoading = useMemo(
        () => ({ countries: false, states: false, cities: false }),
        []
    );

    useEffect(() => {
        setCountries(countriesData as any);
    }, []);

    /* ---------------------------- FORM SETUP -------------------------------- */

    const defaultValues = useMemo<ProfileFormValues>(
        () => ({
            nick: user.nick ?? null,
            bio: user.bio ?? null,
            phoneNumber: user.phoneNumber ?? null,
            movilNumber: user.movilNumber ?? null,
            birthday: user.birthday ?? null,

            visibility: user.visibility ?? 1,
            darkModeEnabled: user.darkModeEnabled ?? false,
            emailNotifications: user.emailNotifications ?? true,
            pushNotifications: user.pushNotifications ?? true,

            countryId: user.countryId ?? null,
            provinceId: user.provinceId ?? null,
            cityId: user.cityId ?? null,

            country: user.country ?? null,
            province: user.province ?? null,
            city: user.city ?? null,

            street: user.street ?? null,
            number: user.number ?? null,
            department: user.department ?? null,
            mail_code: user.mail_code ?? null,

            website: user.website ?? null,
            language: user.language ?? null,
            occupation: user.occupation ?? null,
            company: user.company ?? null,

            twitterHandle: user.twitterHandle ?? null,
            facebookHandle: user.facebookHandle ?? null,
            instagramHandle: user.instagramHandle ?? null,
            linkedinHandle: user.linkedinHandle ?? null,
            githubHandle: user.githubHandle ?? null,
        }),
        [user]
    );

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues,
        mode: "onChange",
    });

    const countryId = form.watch("countryId");
    const provinceId = form.watch("provinceId");
    const effectiveCountryId = countryId ?? defaultValues.countryId;
    const effectiveProvinceId = provinceId ?? defaultValues.provinceId;

    /* ----------------------------- Preview ------------------------------- */

    // enableToView en preview: todo true para ver el diseño completo
    const previewEnableToView = useMemo(
        () => ({ profileImage: true, coverImage: true, fullProfile: true }),
        []
    );

    const previewFullUser = useMemo(() => {
        const name = user?.name ?? "Usuario";

        const nick = (form.watch("nick") ?? user.nick ?? null) as string | null;

        const occupation = (form.watch("occupation") ?? user.occupation ?? null) as string | null;
        const company = (form.watch("company") ?? user.company ?? null) as string | null;
        const bio = (form.watch("bio") ?? user.bio ?? null) as string | null;
        const website = (form.watch("website") ?? user.website ?? null) as string | null;

        const twitterHandle = (form.watch("twitterHandle") ?? user.twitterHandle ?? null) as string | null;
        const facebookHandle = (form.watch("facebookHandle") ?? user.facebookHandle ?? null) as string | null;
        const instagramHandle = (form.watch("instagramHandle") ?? user.instagramHandle ?? null) as string | null;
        const linkedinHandle = (form.watch("linkedinHandle") ?? user.linkedinHandle ?? null) as string | null;
        const githubHandle = (form.watch("githubHandle") ?? user.githubHandle ?? null) as string | null;

        const city = (form.watch("city") ?? user.city ?? null) as string | null;
        const province = (form.watch("province") ?? user.province ?? null) as string | null;
        const country = (form.watch("country") ?? user.country ?? null) as string | null;

        // avatar + cover
        const avatarSrc = preview ?? user.imageUrl ?? user.image ?? "/user.jpg";

        // cover: si type = image => wallPreview (blob/url), si type = color => wallPreview (#hex)
        const wallType = (wallHeaderBackgroundTypeState ?? null) as "image" | "color" | null;
        const wallBgColor = wallType === "color" ? (wallPreview ?? null) : null;
        const wallImgUrl = wallType === "image" ? (wallPreview ?? null) : null;

        return {
            id: user.id,
            name,
            nick,

            imageUrl: avatarSrc,
            imageWallUrl: wallImgUrl,
            wallHeaderBackgroundType: wallType,
            wallHeaderBackgroundColor: wallBgColor,

            occupation,
            company,
            city,
            province,
            country,
            website,
            bio,

            twitterHandle,
            facebookHandle,
            instagramHandle,
            linkedinHandle,
            githubHandle,

            // para que el botón "Ver CV" aparezca también en preview (match visual)
            meta: { cv: { canView: true } },
        };
    }, [form, preview, wallPreview, wallHeaderBackgroundTypeState, user]);

    const previewDisplayUser = useMemo(() => {
        // en el wall real: colapsado muestra "basicUser".
        // Para match 100% visual, hacemos un "basic" igual al real:
        if (previewExpanded) return previewFullUser;

        return {
            id: previewFullUser.id,
            name: previewFullUser.name,
            nick: previewFullUser.nick,
            imageUrl: previewFullUser.imageUrl,
            imageWallUrl: previewFullUser.imageWallUrl,
            wallHeaderBackgroundType: previewFullUser.wallHeaderBackgroundType,
            wallHeaderBackgroundColor: previewFullUser.wallHeaderBackgroundColor,
        };
    }, [previewExpanded, previewFullUser]);

    /* ------------------------------ GEO effects ------------------------------ */

    useEffect(() => {
        if (effectiveCountryId == null) {
            setStates([]);
            return;
        }
        setStates(statesData[effectiveCountryId] ?? []);
    }, [effectiveCountryId]);

    useEffect(() => {
        if (!effectiveProvinceId) {
            setCities([]);
            return;
        }
        setCities(citiesData[effectiveProvinceId] ?? []);
    }, [effectiveProvinceId]);

    // Si el usuario cambia provincia manualmente, limpiamos cityId
    useEffect(() => {
        if (provinceId !== defaultValues.provinceId) {
            form.setValue("cityId", null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provinceId]);

    // liberar ObjectURLs al cambiar preview/wallPreview
    useEffect(() => {
        return () => {
            if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
            if (wallPreview?.startsWith("blob:")) URL.revokeObjectURL(wallPreview);
        };
    }, [preview, wallPreview]);

    /* ------------------------------ dirty state ------------------------------ */

    const imagesDirty =
        Boolean(profileFile || wallFile) ||
        wallHeaderBackgroundTypeState !== initialWallType ||
        (wallHeaderBackgroundTypeState === "color" &&
            (wallColor ?? null) !== (initialWallColor ?? null));

    const isDirty = form.formState.isDirty || imagesDirty;

    /* ------------------------------ navigation guards ------------------------------ */

    const handleTryExit = useCallback(() => {
        if (isDirty) {
            setPendingExit(true);
            setPendingPage(null);
            setDiscardAsk(true);
            return;
        }
        window.location.href = "/";
    }, [isDirty]);

    const handleTryChangePage = useCallback(
        (next: PageId) => {
            if (next === page) return;
            if (isDirty) {
                setPendingExit(false);
                setPendingPage(next);
                setDiscardAsk(true);
                return;
            }
            setPage(next);
        },
        [isDirty, page]
    );

    const handleConfirmDiscard = useCallback(() => {
        // reset form + reset imágenes a lo inicial
        form.reset(defaultValues);
        setProfileFile(null);
        setWallFile(null);

        setWallHeaderBackgroundTypeState(initialWallType);
        setWallColor(initialWallColor);

        setPreview(initialProfilePreview);
        setWallPreview(initialWallPreview);

        setStatus({ type: "idle", message: null });

        setDiscardAsk(false);

        if (pendingExit) {
            window.location.href = "/";
            return;
        }
        if (pendingPage) {
            setPage(pendingPage);
            setPendingPage(null);
            return;
        }
    }, [
        defaultValues,
        form,
        initialProfilePreview,
        initialWallPreview,
        initialWallType,
        initialWallColor,
        pendingExit,
        pendingPage,
    ]);

    /* ---------------------------- upload helper ---------------------------- */

    async function uploadImage(
        file: File,
        endpoint: "/api/upload-profile-image" | "/api/upload-wall-image"
    ) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(endpoint, { method: "POST", body: formData });
        const json = await res.json();

        if (!res.ok) throw new Error(json?.error ?? "Error subiendo imagen");

        return json as { url: string; publicId: string };
    }

    /* ------------------------------ SUBMIT ---------------------------------- */

    async function onSubmit(values: ProfileFormValues) {
        setStatus({ type: "idle", message: null });
        setSaving(true);

        try {
            // 1) Resolver nombres de país / provincia / ciudad
            const countryName = values.countryId
                ? (countriesData as any as GeoOption[]).find((c) => c.id === values.countryId)?.name ?? null
                : null;

            const provinceName =
                values.countryId && values.provinceId
                    ? statesData[values.countryId]?.find((s) => s.id === values.provinceId)?.name ?? null
                    : null;

            const cityName =
                values.provinceId && values.cityId
                    ? citiesData[values.provinceId]?.find((ci) => ci.id === values.cityId)?.name ?? null
                    : null;

            // 2) Subir imágenes SOLO si el usuario cambió algo
            let uploadedProfileImageUrl = profileImageUrl;
            let uploadedProfileImagePublicId = profileImagePublicId;

            let uploadedWallImageUrl = wallImageUrl;
            let uploadedWallImagePublicId = wallImagePublicId;

            if (profileFile) {
                setUploadingProfile(true);
                const uploaded = await uploadImage(profileFile, "/api/upload-profile-image");
                uploadedProfileImageUrl = uploaded.url;
                uploadedProfileImagePublicId = uploaded.publicId;
                setProfileImageUrl(uploaded.url);
                setProfileImagePublicId(uploaded.publicId);
                setUploadingProfile(false);
            }

            if (wallFile) {
                setUploadingWall(true);
                const uploaded = await uploadImage(wallFile, "/api/upload-wall-image");
                uploadedWallImageUrl = uploaded.url;
                uploadedWallImagePublicId = uploaded.publicId;
                setWallImageUrl(uploaded.url);
                setWallImagePublicId(uploaded.publicId);
                setUploadingWall(false);
            }

            // 3) Payload final
            const valuesToSend = {
                ...values,
                imageUrl: uploadedProfileImageUrl,
                imagePublicId: uploadedProfileImagePublicId,
                imageWallUrl: uploadedWallImageUrl,
                imageWallPublicId: uploadedWallImagePublicId,
                wallHeaderBackgroundType: wallHeaderBackgroundTypeState,
                wallHeaderBackgroundColor: wallColor,
                country: countryName,
                province: provinceName,
                city: cityName,
            };

            // 4) PATCH perfil
            const res = await fetch("/api/profile/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(valuesToSend),
            });

            const json = await res.json().catch(() => null);

            if (!res.ok) {
                setStatus({
                    type: "error",
                    message: json?.error ?? "Error actualizando perfil",
                });
                return;
            }

            await update({
                image: json?.data?.imageUrl ?? uploadedProfileImageUrl ?? null,
            });

            form.reset(values, { keepDirty: false, keepErrors: true });
            setProfileFile(null);
            setWallFile(null);

            setStatus({ type: "success", message: "Perfil actualizado" });
        } catch (err) {
            console.error(err);
            setStatus({ type: "error", message: "Error actualizando perfil" });
        } finally {
            setSaving(false);
            setUploadingProfile(false);
            setUploadingWall(false);
        }
    }

    /* ------------------------------ UI bits ---------------------------------- */

    const tabs: { id: PageId; label: string; icon: React.ReactNode }[] = [
        { id: "personal", label: "Datos personales", icon: <User size={16} /> },
        { id: "location", label: "Ubicación", icon: <MapPin size={16} /> },
        { id: "socialnets", label: "Redes", icon: <Share2 size={16} /> },
    ];

    const geoCountryOptions = useMemo(
        () => (countries as GeoOption[]).map((c) => ({ label: c.name, value: String(c.id) })),
        [countries]
    );
    const geoStateOptions = useMemo(
        () => (states as GeoOption[]).map((s) => ({ label: s.name, value: String(s.id) })),
        [states]
    );
    const geoCityOptions = useMemo(
        () => (cities as GeoOption[]).map((ci) => ({ label: ci.name, value: String(ci.id) })),
        [cities]
    );

    const dateMax = useMemo(() => new Date().toISOString().slice(0, 10), []);

    return (
        <PageShell>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="space-y-1">
                    <h2 className="text-lg lg:text-xl font-semibold text-slate-100">Editar perfil</h2>
                    <p className="text-xs lg:text-sm text-slate-400">
                        Actualizá tu info personal, ubicación y enlaces.
                    </p>
                </div>

                <div className="hidden lg:flex items-center gap-2">
                    <Badge
                        variant="secondary"
                        className="border border-slate-700/60 bg-slate-900/40 text-slate-200"
                    >
                        {page === "personal" ? "Datos" : page === "location" ? "Ubicación" : "Redes"}
                    </Badge>
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

            <div className="mt-4 space-y-4">
                {status.type !== "idle" ? (
                    <InlineNotice
                        type={status.type === "success" ? "success" : "error"}
                        message={status.message}
                    />
                ) : null}

                {(uploadingProfile || uploadingWall) && (
                    <div className="text-xs text-slate-400">
                        {uploadingProfile ? "Subiendo imagen de perfil..." : null}
                        {uploadingProfile && uploadingWall ? " " : null}
                        {uploadingWall ? "Subiendo imagen del muro..." : null}
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* ================== PERSONAL ================== */}
                        {page === "personal" && (
                            <div className="space-y-4">
                                {/* Preview (colapsable completo) */}
                                <SectionCard
                                    title="Vista previa"
                                    icon={<EyeIcon size={16} />}
                                    actions={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setPreviewOpen((v) => !v)}
                                            className="h-8 px-2 text-xs border-slate-700 bg-slate-900/40 text-slate-200 hover:bg-slate-900/70"
                                        >
                                            {previewOpen ? "Ocultar" : "Mostrar"}
                                        </Button>
                                    }
                                >
                                    {!previewOpen ? (
                                        <p className="text-xs text-slate-400">
                                            La vista previa está colapsada para que no ocupe lugar.
                                        </p>
                                    ) : (
                                        <WallHeaderShell
                                            mode="preview"
                                            expanded={previewExpanded}
                                            onToggleExpanded={() => setPreviewExpanded((v) => !v)}
                                            displayUser={previewDisplayUser as any}
                                            fullUser={previewFullUser as any}
                                            enableToView={previewEnableToView as any}
                                            loading={false}
                                            error={null}
                                            canShowCvButton={true}
                                            onOpenCv={() => {
                                                toast({
                                                    title: "CV no disponible",
                                                    description: "Los usuarios podrán ver tu CV cuando hayas creado uno.",
                                                });
                                            }}
                                        />
                                    )}
                                </SectionCard>

                                <SectionCard title="Portada del muro" icon={<ImageIcon size={16} />}>
                                    <p className="text-xs text-slate-400">
                                        Elegí una imagen o un color para la portada del muro.
                                    </p>

                                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                                        <div className="relative min-h-[220px] lg:min-h-[240px]">
                                            {wallHeaderBackgroundTypeState === "image" && wallPreview ? (
                                                <Image src={wallPreview} alt="Vista previa del muro" fill className="object-cover" />
                                            ) : wallHeaderBackgroundTypeState === "color" && wallPreview ? (
                                                <div className="w-full h-[240px]" style={{ backgroundColor: wallPreview }} />
                                            ) : wallPreview ? (
                                                <Image src={wallPreview} alt="Vista previa del muro" fill className="object-cover" />
                                            ) : null}

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

                                            <div className="absolute bottom-3 left-3 right-3 flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-slate-900/60 border border-slate-700/70 text-slate-200">
                                                        {wallHeaderBackgroundTypeState === "color" ? "Color" : "Imagen"}
                                                    </Badge>
                                                    <span className="text-xs text-slate-300/90">Portada del muro</span>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    {/* Upload wall image */}
                                                    <label
                                                        className={cn(
                                                            "inline-flex items-center justify-center",
                                                            "h-9 px-3 rounded-md",
                                                            "border border-emerald-500/60",
                                                            "bg-emerald-600/80 hover:bg-emerald-500",
                                                            "text-xs font-medium text-slate-50 cursor-pointer"
                                                        )}
                                                    >
                                                        Elegir imagen
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;

                                                                setWallFile(file);
                                                                setWallColor(null);
                                                                setWallHeaderBackgroundTypeState("image");

                                                                const url = URL.createObjectURL(file);
                                                                setWallPreview(url);
                                                            }}
                                                        />
                                                    </label>

                                                    {/* Pick wall color */}
                                                    <label
                                                        htmlFor="wallColor"
                                                        className={cn(
                                                            "inline-flex items-center justify-center",
                                                            "h-9 px-3 rounded-md",
                                                            "border border-emerald-500/60",
                                                            "bg-emerald-600/15 hover:bg-emerald-600/20",
                                                            "text-xs font-medium text-emerald-200 cursor-pointer"
                                                        )}
                                                    >
                                                        Elegir color
                                                        <input
                                                            id="wallColor"
                                                            type="color"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                setWallColor(e.target.value);
                                                                setWallFile(null);
                                                                setWallHeaderBackgroundTypeState("color");
                                                                setWallPreview(e.target.value);
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SectionCard>

                                <SectionCard title="Imagen de perfil" icon={<User size={16} />}>
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                {preview ? (
                                                    <Image
                                                        src={preview}
                                                        alt="Vista previa de la imagen de perfil"
                                                        width={104}
                                                        height={104}
                                                        className="object-cover rounded-full border border-slate-700 bg-black"
                                                    />
                                                ) : null}
                                                {profileFile ? (
                                                    <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white shadow">
                                                        <CheckCircle2 size={14} />
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-slate-100">Foto de perfil</p>
                                                <p className="text-xs text-slate-400">Recomendado: cuadrada, buena luz.</p>
                                            </div>
                                        </div>

                                        <div className="lg:ml-auto flex flex-col sm:flex-row gap-2">
                                            <label
                                                className={cn(
                                                    "inline-flex items-center justify-center",
                                                    "h-9 px-3 rounded-md",
                                                    "border border-emerald-500/60",
                                                    "bg-emerald-600/80 hover:bg-emerald-500",
                                                    "text-xs font-medium text-slate-50 cursor-pointer"
                                                )}
                                            >
                                                Cambiar imagen
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        setProfileFile(file);
                                                        const url = URL.createObjectURL(file);
                                                        setPreview(url);
                                                    }}
                                                />
                                            </label>

                                            {profileFile ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProfileFile(null);
                                                        setPreview(initialProfilePreview);
                                                    }}
                                                    className={cn(
                                                        "inline-flex items-center justify-center",
                                                        "h-9 px-3 rounded-md",
                                                        "border border-slate-700",
                                                        "bg-slate-900/40 hover:bg-slate-900/70",
                                                        "text-xs font-medium text-slate-200"
                                                    )}
                                                >
                                                    <X size={14} className="mr-2" />
                                                    Deshacer
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </SectionCard>

                                <SectionCard title="Datos" icon={<User size={16} />}>
                                    <FormTextInput
                                        control={form.control}
                                        name="nick"
                                        label="Pseudónimo"
                                        placeholder="Ingresá tu nick"
                                        height="36px"
                                        width="100%"
                                    />

                                    <FormTextareaInput
                                        control={form.control}
                                        name="bio"
                                        label="Texto de presentación"
                                        placeholder="Contanos algo sobre vos..."
                                        height="96px"
                                        width="100%"
                                    />

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        <FormTextInput
                                            control={form.control}
                                            name="occupation"
                                            label="Ocupación"
                                            placeholder="¿Cuál es tu ocupación?"
                                            height="36px"
                                            width="100%"
                                        />
                                        <FormTextInput
                                            control={form.control}
                                            name="company"
                                            label="Compañía"
                                            placeholder="¿En qué compañía trabajás?"
                                            height="36px"
                                            width="100%"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        <FormInput
                                            control={form.control}
                                            name="phoneNumber"
                                            type="tel"
                                            label="Teléfono fijo"
                                            placeholder="Número de teléfono"
                                            height="36px"
                                            width="100%"
                                        />
                                        <FormInput
                                            control={form.control}
                                            name="movilNumber"
                                            type="tel"
                                            label="Teléfono móvil"
                                            placeholder="Número de celular"
                                            height="36px"
                                            width="100%"
                                            leftSlot={
                                                <Image
                                                    src="/whatsapp.svg"
                                                    alt="WhatsApp"
                                                    width={16}
                                                    height={16}
                                                    className="opacity-80"
                                                />
                                            }
                                        />
                                    </div>

                                    {/* Birthday (guardamos ISO) */}
                                    <div className="space-y-1.5">
                                        <Label className="text-sm text-slate-200">Fecha de nacimiento</Label>

                                        <div className="relative w-full lg:max-w-[280px]">
                                            <input
                                                type="date"
                                                value={
                                                    form.getValues("birthday")
                                                        ? String(form.getValues("birthday")).slice(0, 10)
                                                        : ""
                                                }
                                                min="1900-01-01"
                                                max={dateMax}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    if (!v) {
                                                        form.setValue("birthday", null as any, {
                                                            shouldDirty: true,
                                                            shouldValidate: true,
                                                        });
                                                        return;
                                                    }
                                                    const iso = new Date(v + "T00:00:00.000Z").toISOString();
                                                    form.setValue("birthday", iso as any, {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                    });
                                                }}
                                                className={cn(
                                                    "w-full h-9 rounded-md border px-3 pr-9 text-sm",
                                                    "bg-slate-950 border-slate-700 text-slate-100",
                                                    "focus:outline-none focus:ring-2 focus:ring-slate-700"
                                                )}
                                            />
                                            <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70 text-slate-300" />
                                        </div>

                                        <p className="text-xs text-slate-400">
                                            Sólo se muestra de forma aproximada (edad).
                                        </p>
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* ================== LOCATION ================== */}
                        {page === "location" && (
                            <div className="space-y-4">
                                <SectionCard title="Ubicación" icon={<MapPin size={16} />}>
                                    <p className="text-xs text-slate-400">
                                        Se usa para mostrar tu ubicación de forma aproximada (nunca tu dirección exacta).
                                    </p>

                                    <FormSelectNumberField
                                        control={form.control}
                                        name="countryId"
                                        label="País"
                                        options={geoCountryOptions}
                                        placeholder={geoLoading.countries ? "Cargando..." : "Seleccioná un país"}
                                    />

                                    <FormSelectNumberField
                                        control={form.control}
                                        name="provinceId"
                                        label="Provincia / Estado"
                                        options={geoStateOptions}
                                        placeholder={
                                            !effectiveCountryId ? "Elegí país primero" : "Seleccioná una provincia / estado"
                                        }
                                        // @ts-expect-error passthrough
                                        disabled={!effectiveCountryId}
                                    />

                                    <FormSelectNumberField
                                        control={form.control}
                                        name="cityId"
                                        label="Ciudad"
                                        options={geoCityOptions}
                                        placeholder={!effectiveProvinceId ? "Elegí provincia primero" : "Seleccioná una ciudad"}
                                        // @ts-expect-error passthrough
                                        disabled={!effectiveProvinceId}
                                    />

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        <FormTextInput
                                            control={form.control}
                                            name="street"
                                            label="Calle"
                                            placeholder="Calle"
                                            height="36px"
                                            width="100%"
                                        />
                                        <FormTextInput
                                            control={form.control}
                                            name="number"
                                            label="Número"
                                            placeholder="Número"
                                            height="36px"
                                            width="100%"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        <FormTextInput
                                            control={form.control}
                                            name="department"
                                            label="Departamento / Piso"
                                            placeholder="Ej: 2° B"
                                            height="36px"
                                            width="100%"
                                        />
                                        <FormTextInput
                                            control={form.control}
                                            name="mail_code"
                                            label="Código postal"
                                            placeholder="Tu código postal"
                                            height="36px"
                                            width="100%"
                                        />
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* ================== SOCIALNETS ================== */}
                        {page === "socialnets" && (
                            <div className="space-y-4">
                                <SectionCard title="Redes sociales" icon={<Share2 size={16} />}>
                                    <p className="text-xs text-slate-400">
                                        Agregá links para que la gente te encuentre fuera de la app.
                                    </p>

                                    <div className="grid grid-cols-1 gap-3">
                                        <FormInput
                                            control={form.control}
                                            name="website"
                                            type="url"
                                            label="Sitio web"
                                            placeholder="https://..."
                                            height="36px"
                                            width="100%"
                                            leftSlot={<Globe size={16} />}
                                        />

                                        {[
                                            { name: "twitterHandle" as const, icon: "/x.svg", label: "Twitter" },
                                            { name: "facebookHandle" as const, icon: "/facebook.svg", label: "Facebook" },
                                            { name: "instagramHandle" as const, icon: "/instagram.svg", label: "Instagram" },
                                            { name: "linkedinHandle" as const, icon: "/linkedin.svg", label: "LinkedIn" },
                                            { name: "githubHandle" as const, icon: "/github.svg", label: "GitHub" },
                                        ].map((f) => (
                                            <FormInput
                                                key={f.name}
                                                control={form.control}
                                                name={f.name}
                                                type="text"
                                                label={f.label}
                                                placeholder={`Enlace de ${f.label}`}
                                                height="36px"
                                                width="100%"
                                                leftSlot={
                                                    <Image
                                                        className="invert brightness-0 opacity-90"
                                                        src={f.icon}
                                                        alt={f.label}
                                                        width={16}
                                                        height={16}
                                                    />
                                                }
                                            />
                                        ))}
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* Sticky footer actions */}
                        <div
                            className={cn(
                                "sticky bottom-2 z-10",
                                "rounded-xl border border-slate-800 bg-slate-950/70 backdrop-blur",
                                "p-3 lg:p-4 mt-2"
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
                                        type="submit"
                                        disabled={saving || uploadingProfile || uploadingWall}
                                        className="h-10 bg-emerald-600 hover:bg-emerald-500"
                                    >
                                        {saving ? "Guardando..." : "Guardar cambios"}
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (!isDirty) {
                                                window.location.href = "/";
                                                return;
                                            }
                                            setPendingExit(true);
                                            setPendingPage(null);
                                            setDiscardAsk(true);
                                        }}
                                        variant="outline"
                                        className={cn(
                                            "h-10",
                                            "border-slate-700 bg-slate-900/30 text-slate-200",
                                            "hover:bg-slate-900/60 hover:text-slate-50"
                                        )}
                                    >
                                        {isDirty ? "Salir sin guardar" : "Salir"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Confirm discard */}
                        {discardAsk && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
                                <div className="w-full max-w-sm rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3 text-sm text-slate-100 shadow-xl">
                                    <p className="font-semibold">¿Descartar cambios?</p>
                                    <p className="text-xs text-slate-300 leading-snug">
                                        Si continuás sin guardar, se perderán los cambios.
                                    </p>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setDiscardAsk(false);
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
                    </form>
                </Form>
            </div>

            <div className="mt-1 text-xs text-slate-500">
                ¿Querés volver sin guardar? Usá <span className="text-slate-300">“Salir sin guardar”</span>.
            </div>
        </PageShell>
    );
}

