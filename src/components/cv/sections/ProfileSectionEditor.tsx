// src/components/cv/sections/ProfileSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
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

import { cvEditorStyles, normalizeOptional } from "@/components/cv/styles/editorStyles";

import { Textarea } from "@/components/ui/textarea";
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

    curriculumId?: number | null;
};

export function ProfileSectionEditor({
    curriculumId,
    value,
    onChange,
    birthDate,
    onBirthDateChange,
    summary,
    onSummaryChange,

    // ✅ IMPORTANTÍSIMO: faltaban estos
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

    // Sync externo → form
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

    // Sync form → externo (preview reactivo)
    useEffect(() => {
        const subscription = watch((data) => {
            if (isResettingRef.current) return;

            const next: ProfileData = {
                // Identidad
                fullName: data.fullName ?? "",
                headline: normalizeOptional((data as any)?.headline ?? ""),

                // Ubicación
                address: normalizeOptional((data as any)?.address ?? ""),
                postalCode: normalizeOptional((data as any)?.postalCode ?? ""),
                city: normalizeOptional((data as any)?.city ?? ""),

                // Datos personales
                birthPlace: normalizeOptional((data as any)?.birthPlace ?? ""),
                nationality: normalizeOptional((data as any)?.nationality ?? ""),
                gender: (data as any)?.gender ?? undefined,
                maritalStatus: (data as any)?.maritalStatus ?? undefined,
                drivingLicense: normalizeOptional((data as any)?.drivingLicense ?? ""),

                // Visibilidad
                showBirthDate: Boolean((data as any)?.showBirthDate),
                showAddress: Boolean((data as any)?.showAddress),
                showGender: Boolean((data as any)?.showGender),

                // Contacto
                email: normalizeOptional((data as any)?.email ?? ""),
                phone: normalizeOptional((data as any)?.phone ?? ""),
                website: normalizeOptional((data as any)?.website ?? ""),

                // Profesional
                linkedin: normalizeOptional((data as any)?.linkedin ?? ""),
                github: normalizeOptional((data as any)?.github ?? ""),

                // Redes
                facebook: normalizeOptional((data as any)?.facebook ?? ""),
                instagram: normalizeOptional((data as any)?.instagram ?? ""),
                youtube: normalizeOptional((data as any)?.youtube ?? ""),
                x: normalizeOptional((data as any)?.x ?? ""),
                discord: normalizeOptional((data as any)?.discord ?? ""),

                // Contenido
                medium: normalizeOptional((data as any)?.medium ?? ""),
                devto: normalizeOptional((data as any)?.devto ?? ""),
            };

            onChange(next);
        });

        return () => subscription.unsubscribe();
    }, [watch, onChange]);

    // ✅ setValueAs reusable (mantiene opcionales como undefined)
    const optionalField = { setValueAs: normalizeOptional };

    const hasErrors = Object.keys(formState.errors ?? {}).length > 0;

    // ✅ Birthdate (root) validation (sin tocar el schema de profile)
    const birthDateError = useMemo(() => {
        const parsed = optionalBirthDateSchema.safeParse(birthDate ?? "");
        return parsed.success ? null : parsed.error.issues?.[0]?.message ?? "Fecha inválida";
    }, [birthDate]);

    return (
        <div className="space-y-6">
            {/* Header general */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-2">
                <h3 className="text-sm font-semibold text-slate-100">Perfil</h3>
                <p className="text-xs text-slate-400">
                    Completá tu información base. Lo ideal: nombre + headline + ubicación + links clave.
                </p>

                {hasErrors && (
                    <div className="mt-2 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                        Hay errores en la sección de perfil.
                    </div>
                )}
            </div>

            {/* Identidad */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">Identidad</h4>
                    <p className="text-xs text-slate-400">Esto suele ser lo primero que se lee en el CV.</p>
                </div>

                {/* ✅ Picker de imagen: global + cv + upload */}
                <CVImageSourcePicker
                    curriculumId={curriculumId ?? null}
                    valueUrl={profileImageUrl ?? null}
                    disabled={false}
                    onSelect={(img) => onProfileImageChange(img.url)}
                />

                {/* ✅ Toggle root */}
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                    <div className="text-sm text-slate-200">Mostrar foto en el header</div>
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
                            className={cvEditorStyles.input}
                            placeholder="Ej: José Alberto Gomez"
                            {...register("fullName")}
                        />
                        {formState.errors.fullName?.message && (
                            <p className="text-xs text-red-400">{formState.errors.fullName.message}</p>
                        )}
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Headline</Label>
                        <Input
                            className={cvEditorStyles.input}
                            placeholder="Ej: Full Stack Developer · React · Next.js · Python"
                            {...register("headline", optionalField)}
                        />
                        {formState.errors.headline?.message && (
                            <p className="text-xs text-red-400">{formState.errors.headline.message}</p>
                        )}
                    </div>
                </div>

                {/* ✅ SUMMARY (root) */}
                <div className={cvEditorStyles.block}>
                    <Label className={cvEditorStyles.label}>Resumen (summary)</Label>

                    <Textarea
                        className={cvEditorStyles.textarea}
                        placeholder="Escribí 2–5 líneas sobre vos: foco, tecnologías, objetivos, impacto…"
                        value={summary ?? ""}
                        onChange={(e) => onSummaryChange(e.target.value)}
                    />

                    <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-500">
                            Se muestra en el header del CV (nombre + headline + resumen).
                        </p>
                        <p className="text-[11px] text-slate-500">{(summary ?? "").length}/400</p>
                    </div>

                    {(summary ?? "").length > 400 && (
                        <p className="text-xs text-red-400">Máximo 400 caracteres.</p>
                    )}
                </div>
            </div>

            {/* Ubicación */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">Ubicación</h4>
                    <p className="text-xs text-slate-400">Podés mostrarla u ocultarla desde “Visibilidad”.</p>
                </div>

                <div className={cvEditorStyles.grid2}>
                    <div className={cvEditorStyles.block + " md:col-span-2"}>
                        <Label className={cvEditorStyles.label}>Dirección</Label>
                        <Input
                            className={cvEditorStyles.input}
                            placeholder="Ej: Av. Corrientes 1234"
                            {...register("address", optionalField)}
                        />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Código postal</Label>
                        <Input
                            className={cvEditorStyles.input}
                            placeholder="Ej: C1043"
                            {...register("postalCode", optionalField)}
                        />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Ciudad</Label>
                        <Input
                            className={cvEditorStyles.input}
                            placeholder="Ej: Buenos Aires"
                            {...register("city", optionalField)}
                        />
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
                            className={cvEditorStyles.input}
                            type="date"
                            style={{ colorScheme: "dark" }}
                            value={birthDate ?? ""}
                            onChange={(e) => onBirthDateChange(normalizeOptional(e.target.value))}
                        />
                        <p className="text-[11px] text-slate-500">Formato: YYYY-MM-DD</p>
                        {birthDateError && <p className="text-xs text-red-400">{birthDateError}</p>}
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Nacionalidad</Label>
                        <Input
                            className={cvEditorStyles.input}
                            placeholder="Ej: Argentina"
                            {...register("nationality", optionalField)}
                        />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Lugar de nacimiento</Label>
                        <Input
                            className={cvEditorStyles.input}
                            placeholder="Ej: CABA"
                            {...register("birthPlace", optionalField)}
                        />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Género</Label>
                        <Select
                            value={(watch("gender") as any) ?? ""}
                            onValueChange={(v) =>
                                setValue("gender", (v || undefined) as any, { shouldDirty: true, shouldTouch: true })
                            }
                        >
                            <SelectTrigger className={cvEditorStyles.input}>
                                <SelectValue placeholder="(opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Masculino</SelectItem>
                                <SelectItem value="female">Femenino</SelectItem>
                                <SelectItem value="other">Otro</SelectItem>
                                <SelectItem value="prefer_not_to_say">Prefiero no decir</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Estado civil</Label>
                        <Select
                            value={(watch("maritalStatus") as any) ?? ""}
                            onValueChange={(v) =>
                                setValue("maritalStatus", (v || undefined) as any, {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                })
                            }
                        >
                            <SelectTrigger className={cvEditorStyles.input}>
                                <SelectValue placeholder="(opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Soltero/a</SelectItem>
                                <SelectItem value="married">Casado/a</SelectItem>
                                <SelectItem value="divorced">Divorciado/a</SelectItem>
                                <SelectItem value="widowed">Viudo/a</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Licencia de conducir</Label>
                        <Input
                            className={cvEditorStyles.input}
                            placeholder="Ej: B1"
                            {...register("drivingLicense", optionalField)}
                        />
                    </div>
                </div>
            </div>

            {/* Visibilidad */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">Visibilidad</h4>
                    <p className="text-xs text-slate-400">
                        Elegí qué datos se muestran en el preview / CV público.
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                        <div className="text-sm text-slate-200">Mostrar nacimiento</div>
                        <Switch
                            checked={Boolean(watch("showBirthDate"))}
                            onCheckedChange={(v) =>
                                setValue("showBirthDate", v, { shouldDirty: true, shouldTouch: true })
                            }
                            className="data-[state=unchecked]:bg-red-900 data-[state=checked]:bg-emerald-600"
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                        <div className="text-sm text-slate-200">Mostrar ubicación</div>
                        <Switch
                            checked={Boolean(watch("showAddress"))}
                            onCheckedChange={(v) =>
                                setValue("showAddress", v, { shouldDirty: true, shouldTouch: true })
                            }
                            className="data-[state=unchecked]:bg-red-900 data-[state=checked]:bg-emerald-600"
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                        <div className="text-sm text-slate-200">Mostrar género</div>
                        <Switch
                            checked={Boolean(watch("showGender"))}
                            onCheckedChange={(v) =>
                                setValue("showGender", v, { shouldDirty: true, shouldTouch: true })
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
                            className={cvEditorStyles.input}
                            type="email"
                            placeholder="ej: nombre@correo.com"
                            {...register("email", optionalField)}
                        />
                        {formState.errors.email?.message && (
                            <p className="text-xs text-red-400">{formState.errors.email.message}</p>
                        )}
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Teléfono</Label>
                        <Input
                            className={cvEditorStyles.input}
                            placeholder="Ej: +54 11 1234-5678"
                            {...register("phone", optionalField)}
                        />
                    </div>

                    <div className={cvEditorStyles.block + " md:col-span-2"}>
                        <Label className={cvEditorStyles.label}>Website</Label>
                        <Input
                            className={cvEditorStyles.input}
                            placeholder="https://tu-sitio.com (opcional)"
                            {...register("website", optionalField)}
                        />
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
                            className={cvEditorStyles.input}
                            placeholder="https://linkedin.com/in/..."
                            {...register("linkedin", optionalField)}
                        />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>GitHub</Label>
                        <Input
                            className={cvEditorStyles.input}
                            placeholder="https://github.com/..."
                            {...register("github", optionalField)}
                        />
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
                        <Input className={cvEditorStyles.input} placeholder="https://facebook.com/..." {...register("facebook", optionalField)} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>Instagram</Label>
                        <Input className={cvEditorStyles.input} placeholder="https://instagram.com/..." {...register("instagram", optionalField)} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>YouTube</Label>
                        <Input className={cvEditorStyles.input} placeholder="https://youtube.com/..." {...register("youtube", optionalField)} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>X (Twitter)</Label>
                        <Input className={cvEditorStyles.input} placeholder="https://x.com/..." {...register("x", optionalField)} />
                    </div>

                    <div className={cvEditorStyles.block + " md:col-span-2"}>
                        <Label className={cvEditorStyles.label}>Discord</Label>
                        <Input className={cvEditorStyles.input} placeholder="Usuario#0000 (opcional)" {...register("discord", optionalField)} />
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
                        <Input className={cvEditorStyles.input} placeholder="https://medium.com/@..." {...register("medium", optionalField)} />
                    </div>

                    <div className={cvEditorStyles.block}>
                        <Label className={cvEditorStyles.label}>DEV.to</Label>
                        <Input className={cvEditorStyles.input} placeholder="https://dev.to/..." {...register("devto", optionalField)} />
                    </div>
                </div>
            </div>

            {/* (debug opcional) */}
            {curriculumId ? (
                <div className="text-[10px] text-slate-600">CV ID: {curriculumId}</div>
            ) : null}
        </div>
    );
}




