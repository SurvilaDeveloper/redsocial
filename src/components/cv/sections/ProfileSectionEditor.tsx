// src/components/cv/sections/ProfileSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { ProfileData } from "@/types/cv";
import { profileSectionSchema } from "@/lib/zod/cv";
import { optionalBirthDateSchema } from "@/lib/zod/dates";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
    cvEditorStyles,
    normalizeOptional,
    normalizeOptionalSoft,
} from "@/components/cv/styles/editorStyles";

import { cn } from "@/lib/utils";
import { CVImageSourcePicker } from "../media/CVImageSourcePicker";

export type ProfileSectionEditorProps = {
    value: ProfileData;
    onChange: (value: ProfileData) => void;

    birthDate?: string | null;
    onBirthDateChange: (next?: string) => void;

    summary?: string | null;
    onSummaryChange: (next: string) => void;

    /** ✅ Root: foto + flag */
    profileImageUrl?: string | null;
    onProfileImageChange: (url: string | null) => void;

    showProfileImage?: boolean;
    onShowProfileImageChange: (next: boolean) => void;

    userId?: number | null;
    curriculumId?: number | null;
};

// UI helper: texto de error consistente
function ErrorText({ error }: { error?: FieldError | null }) {
    if (!error?.message) return null;
    return <p className="mt-1 text-[11px] text-red-300">{String(error.message)}</p>;
}

export function ProfileSectionEditor({
    curriculumId,
    userId,
    value,
    onChange,
    birthDate,
    onBirthDateChange,
    summary,
    onSummaryChange,
    profileImageUrl,
    onProfileImageChange,
    showProfileImage,
    onShowProfileImageChange,
}: ProfileSectionEditorProps) {
    const defaultValues = useMemo<ProfileData>(() => {
        return {
            // Identidad
            fullName: value?.fullName ?? "",
            headline: value?.headline ?? undefined,

            // Ubicación
            address: value?.address ?? undefined,
            postalCode: value?.postalCode ?? undefined,
            city: value?.city ?? undefined,

            // Datos personales
            birthPlace: value?.birthPlace ?? undefined,
            nationality: value?.nationality ?? undefined,
            gender: value?.gender ?? undefined,
            maritalStatus: value?.maritalStatus ?? undefined,
            drivingLicense: value?.drivingLicense ?? undefined,

            // Visibilidad
            showBirthDate: value?.showBirthDate ?? false,
            showAddress: value?.showAddress ?? true,
            showGender: value?.showGender ?? false,

            // Contacto
            email: value?.email ?? undefined,
            phone: value?.phone ?? undefined,
            website: value?.website ?? undefined,

            // Profesional
            linkedin: value?.linkedin ?? undefined,
            github: value?.github ?? undefined,

            // Redes
            facebook: value?.facebook ?? undefined,
            instagram: value?.instagram ?? undefined,
            youtube: value?.youtube ?? undefined,
            x: value?.x ?? undefined,
            discord: value?.discord ?? undefined,

            // Contenido
            medium: value?.medium ?? undefined,
            devto: value?.devto ?? undefined,
        };
    }, [value]);

    const form = useForm<ProfileData>({
        resolver: zodResolver(profileSectionSchema),
        defaultValues,
        mode: "onChange",
        shouldUnregister: false,
    });

    const { register, watch, reset, formState, setValue } = form;

    // ✅ Flag anti-loop: cuando hacemos reset, no propagamos watch->onChange
    const isResettingRef = useRef(false);

    // externo → form
    useEffect(() => {
        isResettingRef.current = true;

        reset(defaultValues, {
            keepDirty: false,
            keepTouched: false,
        });

        queueMicrotask(() => {
            isResettingRef.current = false;
        });
    }, [defaultValues, reset]);

    // form → externo (preview reactivo, SIN romper tipeo por trims agresivos)
    useEffect(() => {
        const sub = watch((data) => {
            if (isResettingRef.current) return;

            const next: ProfileData = {
                // Identidad
                fullName: data.fullName ?? "",
                headline: normalizeOptionalSoft((data as any)?.headline ?? ""),

                // Ubicación (soft: permite espacios normales)
                address: normalizeOptionalSoft((data as any)?.address ?? ""),
                postalCode: normalizeOptional((data as any)?.postalCode ?? ""),
                city: normalizeOptionalSoft((data as any)?.city ?? ""),

                // Datos personales
                birthPlace: normalizeOptionalSoft((data as any)?.birthPlace ?? ""),
                nationality: normalizeOptionalSoft((data as any)?.nationality ?? ""),
                gender: (data as any)?.gender ?? undefined,
                maritalStatus: (data as any)?.maritalStatus ?? undefined,
                drivingLicense: normalizeOptionalSoft((data as any)?.drivingLicense ?? ""),

                // Visibilidad
                showBirthDate: Boolean((data as any)?.showBirthDate),
                showAddress: Boolean((data as any)?.showAddress),
                showGender: Boolean((data as any)?.showGender),

                // Contacto
                email: normalizeOptional((data as any)?.email ?? ""),
                phone: normalizeOptionalSoft((data as any)?.phone ?? ""),
                website: normalizeOptional((data as any)?.website ?? ""),

                // Profesional (urls/email: trim ok)
                linkedin: normalizeOptional((data as any)?.linkedin ?? ""),
                github: normalizeOptional((data as any)?.github ?? ""),

                // Redes
                facebook: normalizeOptional((data as any)?.facebook ?? ""),
                instagram: normalizeOptional((data as any)?.instagram ?? ""),
                youtube: normalizeOptional((data as any)?.youtube ?? ""),
                x: normalizeOptional((data as any)?.x ?? ""),
                discord: normalizeOptionalSoft((data as any)?.discord ?? ""),

                // Contenido
                medium: normalizeOptional((data as any)?.medium ?? ""),
                devto: normalizeOptional((data as any)?.devto ?? ""),
            };

            onChange(next);
        });

        return () => sub.unsubscribe();
    }, [watch, onChange]);

    const inputErrorClass = "border-red-500/60 focus-visible:ring-red-500/30";

    const hasErrors = Object.keys(formState.errors ?? {}).length > 0;

    // Root birthdate validation (sin tocar schema de profile)
    const birthDateError = useMemo(() => {
        const parsed = optionalBirthDateSchema.safeParse(birthDate ?? "");
        return parsed.success ? null : parsed.error.issues?.[0]?.message ?? "Fecha inválida";
    }, [birthDate]);

    // helpers setValueAs (según tipo de input)
    const optionalSoft = { setValueAs: (v: any) => normalizeOptionalSoft(typeof v === "string" ? v : "") };
    const optionalHard = { setValueAs: (v: any) => normalizeOptional(typeof v === "string" ? v : "") };

    return (
        <div className="space-y-6">
            {/* Header general */}

            {hasErrors && (
                <div className="mt-2 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                    Hay errores en la sección de perfil.
                </div>
            )}


            {/* Identidad */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">Identidad</h4>
                    <p className="text-xs text-slate-400">Esto suele ser lo primero que se lee en el CV.</p>
                </div>

                {/* Picker de imagen */}
                <CVImageSourcePicker
                    curriculumId={curriculumId ?? null}
                    valueUrl={profileImageUrl ?? null}
                    disabled={false}
                    onSelect={(img) => onProfileImageChange(img.url)}
                />

                {/* Toggle root */}
                <div className="flex items-center justify-end rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 gap-2">
                    <div className="text-sm text-slate-200">Mostrar foto en Perfil</div>
                    <Switch
                        checked={Boolean(showProfileImage)}
                        onCheckedChange={(v) => onShowProfileImageChange(Boolean(v))}
                        className="data-[state=unchecked]:bg-red-900 data-[state=checked]:bg-emerald-600"
                    />
                </div>

                <div className={cvEditorStyles.grid2}>
                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Nombre completo</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.fullName && inputErrorClass)}
                            placeholder="Ej: José Alberto Gomez"
                            {...register("fullName")}
                        />
                        <ErrorText error={formState.errors.fullName as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Headline</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.headline && inputErrorClass)}
                            placeholder="Ej: Full Stack Developer · React · Next.js · Python"
                            {...register("headline", optionalSoft)}
                        />
                        <ErrorText error={formState.errors.headline as FieldError | undefined} />
                    </div>
                </div>

                {/* SUMMARY (root) */}
                <div className={cvEditorStyles.block}>
                    <Label className={cvEditorStyles.label}>Resumen (summary)</Label>

                    <Textarea
                        className={cn(cvEditorStyles.textarea, (summary ?? "").length > 400 && inputErrorClass)}
                        placeholder="Escribí 2–5 líneas sobre vos: foco, tecnologías, objetivos, impacto…"
                        value={summary ?? ""}
                        onChange={(e) => onSummaryChange(e.target.value)}
                    />

                    <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-500">Se muestra en el header del CV.</p>
                        <p className="text-[11px] text-slate-500">{(summary ?? "").length}/400</p>
                    </div>

                    {(summary ?? "").length > 400 && <p className="text-xs text-red-300">Máximo 400 caracteres.</p>}
                </div>
            </div>

            {/* Ubicación */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">Ubicación</h4>
                    <p className="text-xs text-slate-400">Podés mostrarla u ocultarla desde “Visibilidad”.</p>
                </div>

                <div className={cvEditorStyles.grid2}>
                    <div className={cn(cvEditorStyles.block, "md:col-span-2")}>
                        <Label className={cvEditorStyles.label}>Dirección</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.address && inputErrorClass)}
                            placeholder="Ej: Av. Corrientes 1234"
                            {...register("address", optionalSoft)}
                        />
                        <ErrorText error={formState.errors.address as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Código postal</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.postalCode && inputErrorClass)}
                            placeholder="Ej: C1043"
                            {...register("postalCode", optionalHard)}
                        />
                        <ErrorText error={formState.errors.postalCode as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Ciudad</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.city && inputErrorClass)}
                            placeholder="Ej: Buenos Aires"
                            {...register("city", optionalSoft)}
                        />
                        <ErrorText error={formState.errors.city as FieldError | undefined} />
                    </div>
                </div>
            </div>

            {/* Datos personales */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">Datos personales</h4>
                    <p className="text-xs text-slate-400">
                        La fecha de nacimiento se guarda fuera del JSON (root). El resto vive en Profile.
                    </p>
                </div>

                <div className={cvEditorStyles.grid2}>
                    {/* Birthdate root */}
                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Fecha de nacimiento</Label>
                        <Input
                            className={cn(cvEditorStyles.input, birthDateError && inputErrorClass)}
                            type="date"
                            style={{ colorScheme: "dark" }}
                            value={birthDate ?? ""}
                            onChange={(e) => onBirthDateChange(normalizeOptional(e.target.value))}
                        />
                        <p className="text-[11px] text-slate-500">Formato: YYYY-MM-DD</p>
                        {birthDateError && <p className="text-xs text-red-300">{birthDateError}</p>}
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Nacionalidad</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.nationality && inputErrorClass)}
                            placeholder="Ej: Argentina"
                            {...register("nationality", optionalSoft)}
                        />
                        <ErrorText error={formState.errors.nationality as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Lugar de nacimiento</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.birthPlace && inputErrorClass)}
                            placeholder="Ej: CABA"
                            {...register("birthPlace", optionalSoft)}
                        />
                        <ErrorText error={formState.errors.birthPlace as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Género</Label>
                        <Select
                            value={String((watch("gender") as any) ?? "")}
                            onValueChange={(v) =>
                                setValue("gender", (v || undefined) as any, {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                })
                            }
                        >
                            <SelectTrigger className={cn(cvEditorStyles.input, formState.errors.gender && inputErrorClass)}>
                                <SelectValue placeholder="(opcional)" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                                <SelectItem value="male">Masculino</SelectItem>
                                <SelectItem value="female">Femenino</SelectItem>
                                <SelectItem value="other">Otro</SelectItem>
                                <SelectItem value="prefer_not_to_say">Prefiero no decir</SelectItem>
                            </SelectContent>
                        </Select>
                        <ErrorText error={formState.errors.gender as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Estado civil</Label>
                        <Select
                            value={String((watch("maritalStatus") as any) ?? "")}
                            onValueChange={(v) =>
                                setValue("maritalStatus", (v || undefined) as any, {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                })
                            }
                        >
                            <SelectTrigger className={cn(cvEditorStyles.input, formState.errors.maritalStatus && inputErrorClass)}>
                                <SelectValue placeholder="(opcional)" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                                <SelectItem value="single">Soltero/a</SelectItem>
                                <SelectItem value="married">Casado/a</SelectItem>
                                <SelectItem value="divorced">Divorciado/a</SelectItem>
                                <SelectItem value="widowed">Viudo/a</SelectItem>
                            </SelectContent>
                        </Select>
                        <ErrorText error={formState.errors.maritalStatus as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Licencia de conducir</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.drivingLicense && inputErrorClass)}
                            placeholder="Ej: B1"
                            {...register("drivingLicense", optionalSoft)}
                        />
                        <ErrorText error={formState.errors.drivingLicense as FieldError | undefined} />
                    </div>
                </div>
            </div>

            {/* Visibilidad */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">Visibilidad</h4>
                    <p className="text-xs text-slate-400">Elegí qué datos se muestran en el preview / CV público.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                        <div className="text-sm text-slate-200">Mostrar nacimiento</div>
                        <Switch
                            checked={Boolean(watch("showBirthDate"))}
                            onCheckedChange={(v) =>
                                setValue("showBirthDate", Boolean(v), {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                })
                            }
                            className="data-[state=unchecked]:bg-red-900 data-[state=checked]:bg-emerald-600"
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                        <div className="text-sm text-slate-200">Mostrar ubicación</div>
                        <Switch
                            checked={Boolean(watch("showAddress"))}
                            onCheckedChange={(v) =>
                                setValue("showAddress", Boolean(v), {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                })
                            }
                            className="data-[state=unchecked]:bg-red-900 data-[state=checked]:bg-emerald-600"
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                        <div className="text-sm text-slate-200">Mostrar género</div>
                        <Switch
                            checked={Boolean(watch("showGender"))}
                            onCheckedChange={(v) =>
                                setValue("showGender", Boolean(v), {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                })
                            }
                            className="data-[state=unchecked]:bg-red-900 data-[state=checked]:bg-emerald-600"
                        />
                    </div>
                </div>
            </div>

            {/* Contacto */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">Contacto</h4>
                    <p className="text-xs text-slate-400">Incluí sólo lo que querés mostrar públicamente.</p>
                </div>

                <div className={cvEditorStyles.grid2}>
                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Email</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.email && inputErrorClass)}
                            type="email"
                            placeholder="ej: nombre@correo.com"
                            {...register("email", optionalHard)}
                        />
                        <ErrorText error={formState.errors.email as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Teléfono</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.phone && inputErrorClass)}
                            placeholder="Ej: +54 11 1234-5678"
                            {...register("phone", optionalSoft)}
                        />
                        <ErrorText error={formState.errors.phone as FieldError | undefined} />
                    </div>

                    <div className={cn(cvEditorStyles.block, "md:col-span-2")}>
                        <Label className={cvEditorStyles.label}>Website</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.website && inputErrorClass)}
                            placeholder="https://tu-sitio.com (opcional)"
                            {...register("website", optionalHard)}
                        />
                        <ErrorText error={formState.errors.website as FieldError | undefined} />
                    </div>
                </div>
            </div>

            {/* Profesional */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">Profesional</h4>
                    <p className="text-xs text-slate-400">Links clave que suelen sumar más.</p>
                </div>

                <div className={cvEditorStyles.grid2}>
                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>LinkedIn</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.linkedin && inputErrorClass)}
                            placeholder="https://linkedin.com/in/..."
                            {...register("linkedin", optionalHard)}
                        />
                        <ErrorText error={formState.errors.linkedin as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>GitHub</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.github && inputErrorClass)}
                            placeholder="https://github.com/..."
                            {...register("github", optionalHard)}
                        />
                        <ErrorText error={formState.errors.github as FieldError | undefined} />
                    </div>
                </div>
            </div>

            {/* Redes */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">Redes</h4>
                    <p className="text-xs text-slate-400">Opcional. Mostrá solo las que aporten.</p>
                </div>

                <div className={cvEditorStyles.grid2}>
                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Facebook</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.facebook && inputErrorClass)}
                            placeholder="https://facebook.com/..."
                            {...register("facebook", optionalHard)}
                        />
                        <ErrorText error={formState.errors.facebook as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Instagram</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.instagram && inputErrorClass)}
                            placeholder="https://instagram.com/..."
                            {...register("instagram", optionalHard)}
                        />
                        <ErrorText error={formState.errors.instagram as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>YouTube</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.youtube && inputErrorClass)}
                            placeholder="https://youtube.com/..."
                            {...register("youtube", optionalHard)}
                        />
                        <ErrorText error={formState.errors.youtube as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>X (Twitter)</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.x && inputErrorClass)}
                            placeholder="https://x.com/..."
                            {...register("x", optionalHard)}
                        />
                        <ErrorText error={formState.errors.x as FieldError | undefined} />
                    </div>

                    <div className={cn(cvEditorStyles.block, "md:col-span-2")}>
                        <Label className={cvEditorStyles.label}>Discord</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.discord && inputErrorClass)}
                            placeholder="Usuario#0000 (opcional)"
                            {...register("discord", optionalSoft)}
                        />
                        <ErrorText error={formState.errors.discord as FieldError | undefined} />
                    </div>
                </div>
            </div>

            {/* Contenido técnico */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">Contenido técnico</h4>
                    <p className="text-xs text-slate-400">Si escribís o publicás, esto suma mucho.</p>
                </div>

                <div className={cvEditorStyles.grid2}>
                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Medium</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.medium && inputErrorClass)}
                            placeholder="https://medium.com/@..."
                            {...register("medium", optionalHard)}
                        />
                        <ErrorText error={formState.errors.medium as FieldError | undefined} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>DEV.to</Label>
                        <Input
                            className={cn(cvEditorStyles.input, formState.errors.devto && inputErrorClass)}
                            placeholder="https://dev.to/..."
                            {...register("devto", optionalHard)}
                        />
                        <ErrorText error={formState.errors.devto as FieldError | undefined} />
                    </div>
                </div>
            </div>

            {/* debug opcional */}
            {curriculumId ? <div className="text-[10px] text-slate-600">CV ID: {curriculumId}</div> : null}
        </div>
    );
}