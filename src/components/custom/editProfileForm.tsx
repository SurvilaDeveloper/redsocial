// src/components/custom/editProfileForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Earth, Phone } from "lucide-react";

import { profileSchema } from "@/lib/zod";
import { cn } from "@/lib/utils";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { ProfileMe } from "@/types/profile";

import countriesData from "@/data/geodata/countries.json";
import statesRaw from "@/data/geodata/states_by_country.json"
import citiesRaw from "@/data/geodata/cities_by_state.json"

import VisibilitySelect from "./VisibilitySelect";
import {
    VISIBILITY_SELECT_1,
    VISIBILITY_SELECT_2,
} from "@/lib/visibility-options";



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
 * Extensión local del schema para IDs geográficos (solo frontend)
 */
type ProfileFormValues = {
    countryId: number | null;
    provinceId: number | null;
    cityId: number | null;
} & Omit<
    ReturnType<typeof profileSchema.parse>,
    never
>;

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function ProfileForm({ user }: { user: ProfileMe }) {

    console.log("user:", user);

    const [preview] = useState<string | null>(user.imageUrl ?? "/user.jpg");
    const [wallPreview] = useState<string | null>(user.imageWallUrl ?? "/wall.jpg");

    const [discardAsk, setDiscardAsk] = useState(false);

    const [page, setPage] = useState<PageId>("personal");

    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveOk, setSaveOk] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [configuration, setConfiguration] = useState({
        profileImageVisibility: user.configuration?.profileImageVisibility ?? 1,
        coverImageVisibility: user.configuration?.coverImageVisibility ?? 1,
        fullProfileVisibility: user.configuration?.fullProfileVisibility ?? 1,

        wallVisibility: user.configuration?.wallVisibility ?? 1,
        postsVisibility: user.configuration?.postsVisibility ?? 1,
        postCommentsVisibility: user.configuration?.postCommentsVisibility ?? 1,
        postRepliesVisibility: user.configuration?.postRepliesVisibility ?? 1,

        mediaVisibility: user.configuration?.mediaVisibility ?? 1,
        mediaCommentsVisibility: user.configuration?.mediaCommentsVisibility ?? 1,
        mediaRepliesVisibility: user.configuration?.mediaRepliesVisibility ?? 1,

        friendsListVisibility: user.configuration?.friendsListVisibility ?? 2,
        followersListVisibility: user.configuration?.followersListVisibility ?? 1,
        followingListVisibility: user.configuration?.followingListVisibility ?? 1,

        likesVisibility: user.configuration?.likesVisibility ?? 1,
        privateMessagesVisibility: user.configuration?.privateMessagesVisibility ?? 2,
    });


    /* ----------------------------- GEO DATA -------------------------------- */

    const [countries, setCountries] = useState<GeoOption[]>([]);
    const [states, setStates] = useState<GeoOption[]>([]);
    const [cities, setCities] = useState<GeoOption[]>([]);



    const [geoLoading, setGeoLoading] = useState({
        countries: false,
        states: false,
        cities: false,
    });

    const toggleDiscardAsk = () => {
        setDiscardAsk((prev) => !prev);
    };

    const renderVisibilitySelect = (
        key: keyof typeof configuration,
        label: string,
        options: typeof VISIBILITY_SELECT_1
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

    // Habilitar el select de ciudad si hay provinceId seleccionado o valor por defecto cargado
    const provinceAvailable = provinceId ?? defaultValues.provinceId;
    const effectiveProvinceId = provinceId ?? defaultValues.provinceId;


    /* ------------------------------ GEO API --------------------------------- */

    useEffect(() => {
        setCountries(countriesData);
    }, []);


    useEffect(() => {
        setCities([]);
        // Solo limpiar cityId si el usuario cambió la provincia manualmente
        if (provinceId !== defaultValues.provinceId) {
            form.setValue("cityId", null);
        }

        if (!provinceId && !defaultValues.provinceId) return;

        const effectiveProvinceId = provinceId ?? defaultValues.provinceId;

        // Para cargar ciudades
        const newCities = effectiveProvinceId !== null
            ? citiesData[effectiveProvinceId] ?? []
            : [];
        setCities(newCities);

    }, [provinceId, form]);


    useEffect(() => {
        const effectiveCountryId = countryId ?? defaultValues.countryId;

        if (effectiveCountryId == null) {
            setStates([]);
            return;
        }

        const newStates = statesData[effectiveCountryId] ?? [];
        setStates(newStates);
    }, [countryId, defaultValues.countryId]);


    useEffect(() => {
        const effectiveProvinceId = provinceId ?? defaultValues.provinceId;
        if (!effectiveProvinceId) {
            setCities([]);
            return;
        }
        const newCities = citiesData[effectiveProvinceId] ?? [];
        setCities(newCities);
    }, [provinceId, defaultValues.provinceId]);


    /* ------------------------------ SUBMIT ---------------------------------- */

    async function onSubmit(values: ProfileFormValues) {
        setSaveError(null);
        setSaveOk(null);
        setSaving(true);

        try {
            // Obtener nombres de país, provincia y ciudad según los IDs
            const countryName = values.countryId
                ? countriesData.find(c => c.id === values.countryId)?.name ?? null
                : null;

            const provinceName = (values.countryId && values.provinceId)
                ? statesData[values.countryId]?.find(s => s.id === values.provinceId)?.name ?? null
                : null;

            const cityName = (values.provinceId && values.cityId)
                ? citiesData[values.provinceId]?.find(ci => ci.id === values.cityId)?.name ?? null
                : null;

            // Valores a enviar al backend
            const valuesToSend = {
                ...values,
                country: countryName,
                province: provinceName,
                city: cityName,
            };

            const res = await fetch("/api/profile/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(valuesToSend),
            });

            const json = await res.json().catch(() => null);

            if (!res.ok) {
                setSaveError(json?.error ?? "Error actualizando perfil");
                return;
            }

            setSaveOk("Perfil actualizado ✅");
        } catch (err) {
            console.error(err);
            setSaveError("Error actualizando perfil");
        } finally {
            setSaving(false);
        }
    }



    /* ------------------------------- UI ------------------------------------- */

    const tabs: { id: PageId; label: string }[] = [
        { id: "personal", label: "Datos personales" },
        { id: "location", label: "Ubicación" },
        { id: "socialnets", label: "Redes sociales" }

    ];

    return (
        <div className="flex flex-col gap-4 w-full">
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
                                ? "bg-emerald-900/40 text-emerald-200"
                                : "bg-slate-950/0 text-slate-300 hover:bg-slate-900/70"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* ================== PESTAÑA PERSONAL ================== */}
                    {page === "personal" && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-6">
                            {/* Imagen de muro */}
                            <div className="flex flex-col gap-3">
                                <p className="text-xs text-slate-400">Imagen de portada de tu muro</p>
                                <div className="relative w-full aspect-[3/1] max-h-64 border-2 border-dashed border-slate-700 rounded-xl overflow-hidden bg-black/60 flex items-center justify-center">
                                    {wallPreview && (
                                        <Image
                                            src={wallPreview}
                                            alt="Vista previa de la imagen del muro"
                                            fill
                                            className="object-cover"
                                        />
                                    )}

                                    <FormItem>
                                        <FormLabel className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center justify-center px-4 py-2 rounded-full border border-emerald-500 bg-emerald-600/90 hover:bg-emerald-500 text-xs font-medium text-slate-50 cursor-pointer">
                                            Elegir imagen del muro
                                        </FormLabel>
                                        <FormControl>
                                            <input type="file" accept="image/*" className="hidden" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                </div>
                            </div>

                            {/* Imagen de perfil */}
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8">
                                <FormItem className="flex flex-col items-center gap-2">
                                    <FormLabel className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-emerald-500 bg-emerald-600/90 hover:bg-emerald-500 text-xs font-medium text-slate-50 cursor-pointer">
                                        Cambiar imagen de perfil
                                    </FormLabel>
                                    <FormControl>
                                        <input type="file" accept="image/*" className="hidden" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>

                                {preview && (
                                    <div className="flex items-center justify-center">
                                        <Image
                                            src={preview}
                                            alt="Vista previa de la imagen de perfil"
                                            width={112}
                                            height={112}
                                            className="object-cover rounded-full border-2 border-dashed border-slate-500 bg-black"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-800/70 pt-4 space-y-4">
                                {/* Nick */}
                                <FormField
                                    control={form.control}
                                    name="nick"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <Label htmlFor="nick" className="sm:w-40 text-sm">
                                                    Pseudónimo
                                                </Label>
                                                <FormControl>
                                                    <Input
                                                        id="nick"
                                                        placeholder="Ingresa tu nick"
                                                        className="bg-slate-950 border-slate-700 text-slate-100"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage className="text-xs text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                {/* Bio */}
                                <FormField
                                    control={form.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <Label htmlFor="bio" className="text-sm">
                                                Texto de presentación
                                            </Label>
                                            <FormControl>
                                                <Textarea
                                                    id="bio"
                                                    placeholder="Contanos algo sobre vos..."
                                                    className="bg-slate-950 border-slate-700 text-slate-100 min-h-[80px]"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                {/* Ocupación */}
                                <FormField
                                    control={form.control}
                                    name="occupation"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <Label htmlFor="occupation" className="sm:w-40 text-sm">
                                                    Ocupación
                                                </Label>
                                                <FormControl>
                                                    <Input
                                                        id="occupation"
                                                        placeholder="¿Cuál es tu ocupación?"
                                                        className="bg-slate-950 border-slate-700 text-slate-100"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage className="text-xs text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                {/* Compañía */}
                                <FormField
                                    control={form.control}
                                    name="company"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <Label htmlFor="company" className="sm:w-40 text-sm">
                                                    Compañía
                                                </Label>
                                                <FormControl>
                                                    <Input
                                                        id="company"
                                                        placeholder="¿En qué compañía trabajás?"
                                                        className="bg-slate-950 border-slate-700 text-slate-100"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage className="text-xs text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                {/* Teléfonos */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="phoneNumber" className="text-sm">
                                                        Teléfono fijo
                                                    </Label>
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <FormControl>
                                                    <Input
                                                        id="phoneNumber"
                                                        placeholder="Número de teléfono"
                                                        className="bg-slate-950 border-slate-700 text-slate-100"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="movilNumber"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="movilNumber" className="text-sm">
                                                        Teléfono móvil
                                                    </Label>
                                                    <Image
                                                        src="/whatsapp.svg"
                                                        alt="WhatsApp"
                                                        width={20}
                                                        height={20}
                                                        className="opacity-80"
                                                    />
                                                </div>
                                                <FormControl>
                                                    <Input
                                                        id="movilNumber"
                                                        placeholder="Número de celular"
                                                        className="bg-slate-950 border-slate-700 text-slate-100"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Fecha de nacimiento (ISO string en schema) */}
                                <FormField
                                    control={form.control}
                                    name="birthday"
                                    render={({ field }) => {
                                        const max = new Date().toISOString().slice(0, 10);
                                        const dateValue = field.value ? String(field.value).slice(0, 10) : "";

                                        return (
                                            <FormItem className="flex flex-col gap-1">
                                                <FormLabel className="text-sm">Fecha de nacimiento</FormLabel>

                                                <FormControl>
                                                    <div className="relative w-full sm:w-[260px]">
                                                        {dateValue === "" && (
                                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                                                Seleccioná una fecha
                                                            </span>
                                                        )}

                                                        <input
                                                            type="date"
                                                            value={dateValue}
                                                            min="1900-01-01"
                                                            max={max}
                                                            onChange={(e) => {
                                                                const v = e.target.value;
                                                                if (!v) return field.onChange(null);
                                                                field.onChange(
                                                                    new Date(v + "T00:00:00.000Z").toISOString()
                                                                );
                                                            }}
                                                            className={cn(
                                                                "w-full h-9 rounded-md border bg-slate-950 border-slate-700 px-3 pr-9 text-sm",
                                                                "text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700",
                                                                dateValue === "" && "text-transparent"
                                                            )}
                                                        />

                                                        <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70 text-slate-300" />
                                                    </div>
                                                </FormControl>

                                                <FormDescription className="text-xs text-slate-400">
                                                    Sólo se muestra de forma aproximada (edad).
                                                </FormDescription>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        );
                                    }}
                                />

                                <hr className="border-slate-800/70" />


                            </div>
                        </div>
                    )}

                    {/* ================== PESTAÑA UBICACIÓN ================== */}
                    {page === "location" && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                            <p className="text-xs text-slate-400 mb-2">
                                Estos datos se usan para mostrar aproximadamente tu ubicación
                                (nunca se muestra tu dirección exacta).
                            </p>

                            {/* País (countryId) */}
                            <FormField
                                control={form.control}
                                name="countryId"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Earth className="w-4 h-4 text-slate-400" />
                                            <FormLabel className="text-sm">País</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Select
                                                value={field.value != null ? String(field.value) : ""}
                                                onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                                            >
                                                <SelectTrigger className="w-full sm:w-[260px] bg-slate-950 border-slate-700 text-slate-100 h-9">
                                                    <SelectValue
                                                        placeholder={geoLoading.countries ? "Cargando..." : "Seleccioná un país"}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-64">
                                                    {countries.map((c) => (
                                                        <SelectItem key={c.id} value={String(c.id)}>
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-400" />
                                    </FormItem>
                                )}
                            />

                            {/* Provincia/Estado (provinceId) */}
                            <FormField
                                control={form.control}
                                name="provinceId"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <Label className="text-sm">Provincia / Estado</Label>
                                        <FormControl>
                                            <Select
                                                disabled={!countryId}
                                                value={field.value != null ? String(field.value) : ""}
                                                onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                                            >
                                                <SelectTrigger className="w-full sm:w-[260px] bg-slate-950 border-slate-700 text-slate-100 h-9">
                                                    <SelectValue
                                                        placeholder={
                                                            !countryId
                                                                ? "Elegí país primero"
                                                                : field.value
                                                                    ? states.find(s => s.id === field.value)?.name ?? "Seleccioná una provincia / estado"
                                                                    : "Seleccioná una provincia / estado"
                                                        }

                                                    />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-64">
                                                    {states.map((s) => (
                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                            {s.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-400" />
                                    </FormItem>
                                )}
                            />

                            {/* Ciudad (cityId) */}
                            <FormField
                                control={form.control}
                                name="cityId"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <Label className="text-sm">Ciudad</Label>
                                        <FormControl>
                                            <Select
                                                disabled={effectiveProvinceId === null}
                                                value={field.value != null ? String(field.value) : ""}
                                                onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                                            >



                                                <SelectTrigger className="w-full sm:w-[260px] bg-slate-950 border-slate-700 text-slate-100 h-9">
                                                    <SelectValue
                                                        placeholder={
                                                            !effectiveProvinceId
                                                                ? "Elegí provincia primero"
                                                                : field.value
                                                                    ? cities.find(ci => ci.id === field.value)?.name ?? "Seleccioná una ciudad"
                                                                    : defaultValues.city ?? "Seleccioná una ciudad"
                                                        }

                                                    />

                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-64">
                                                    {cities.map((ci) => (
                                                        <SelectItem key={ci.id} value={String(ci.id)}>
                                                            {ci.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-400" />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="street"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <Label htmlFor="street" className="text-sm">
                                                Calle
                                            </Label>
                                            <FormControl>
                                                <Input
                                                    id="street"
                                                    placeholder="Calle"
                                                    className="bg-slate-950 border-slate-700 text-slate-100"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="number"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <Label htmlFor="number" className="text-sm">
                                                Número
                                            </Label>
                                            <FormControl>
                                                <Input
                                                    id="number"
                                                    placeholder="Número"
                                                    className="bg-slate-950 border-slate-700 text-slate-100"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs text-red-400" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <Label htmlFor="department" className="text-sm">
                                            Departamento / Piso
                                        </Label>
                                        <FormControl>
                                            <Input
                                                id="department"
                                                placeholder="Ej: 2° B"
                                                className="bg-slate-950 border-slate-700 text-slate-100"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-400" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="mail_code"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <Label htmlFor="mail_code" className="text-sm">
                                            Código postal
                                        </Label>
                                        <FormControl>
                                            <Input
                                                id="mail_code"
                                                placeholder="Tu código postal"
                                                className="bg-slate-950 border-slate-700 text-slate-100 max-w-xs"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-400" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                    {/* ================== PESTAÑA UBICACIÓN ================== */}
                    {page === "socialnets" && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                            <p className="text-xs text-slate-400 mb-2">
                                Estos datos se usan para mostrar aproximadamente tu ubicación
                                (nunca se muestra tu dirección exacta).
                            </p>
                            {/* Redes sociales */}
                            <div className="space-y-4">
                                {[
                                    { name: "twitterHandle" as const, icon: "/x.svg", label: "Twitter" },
                                    { name: "facebookHandle" as const, icon: "/facebook.svg", label: "Facebook" },
                                    { name: "instagramHandle" as const, icon: "/instagram.svg", label: "Instagram" },
                                    { name: "linkedinHandle" as const, icon: "/linkedin.svg", label: "LinkedIn" },
                                    { name: "githubHandle" as const, icon: "/github.svg", label: "GitHub" },
                                ].map((f) => (
                                    <FormField
                                        key={f.name}
                                        control={form.control}
                                        name={f.name}
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Image className="invert brightness-0 opacity-90" src={f.icon} alt={f.label} width={20} height={20} />
                                                    <Label className="w-20 text-sm">{f.label}</Label>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={`Enlace de ${f.label}`}
                                                            className="bg-slate-950 border-slate-700 text-slate-100"
                                                            {...field}
                                                            value={field.value ?? ""}
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ================== PESTAÑAS PENDIENTES ================== */}


                    {/* Feedback de guardado */}
                    {saveError && (
                        <div className="rounded-lg border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                            {saveError}
                        </div>
                    )}
                    {saveOk && (
                        <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
                            {saveOk}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 pt-2">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="flex-1 sm:flex-none sm:w-60 h-10 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
                        >
                            {saving ? "Guardando..." : "Guardar cambios y salir"}
                        </Button>

                        <Button
                            type="button"
                            onClick={toggleDiscardAsk}
                            variant="outline"
                            className="flex-1 sm:flex-none sm:w-60 h-10 rounded-md border-amber-500/60 text-amber-100 bg-amber-900/40 hover:bg-amber-800/70 hover:text-amber-50 text-sm font-medium"
                        >
                            Descartar cambios y salir
                        </Button>
                    </div>

                    {/* Confirm discard */}
                    {discardAsk && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                            <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700 p-4 space-y-3 text-sm text-slate-100">
                                <p className="font-semibold">¿Descartar cambios?</p>
                                <p className="text-xs text-slate-300">
                                    Si salís sin guardar, se perderán los cambios.
                                </p>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={toggleDiscardAsk}
                                        className="h-8 px-3 text-xs border-slate-600 bg-slate-800/60 hover:bg-slate-700"
                                    >
                                        Volver
                                    </Button>
                                    <Link
                                        href="/"
                                        className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-red-600 hover:bg-red-500 text-xs font-medium text-slate-50"
                                    >
                                        Descartar y salir
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}





