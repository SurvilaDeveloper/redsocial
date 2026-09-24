// src/components/custom/registerForm.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "@/lib/zod";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const PROFILE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

const PROFILE_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

function validateProfileFile(file: File) {
    if (!PROFILE_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
        return "Formato no permitido. Usa JPEG, PNG o WebP.";
    }

    if (file.size <= 0) {
        return "El archivo está vacío.";
    }

    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
        return "La imagen supera el límite de 8 MB.";
    }

    return null;
}

const RegisterForm = () => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(
        "/user.jpg"
    );
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const router = useRouter();

    const form = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
        },
        mode: "onChange",
    });

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0] ?? null;

        if (!file) return;

        const validationError = validateProfileFile(file);

        if (validationError) {
            setError(validationError);
            e.target.value = "";
            return;
        }

        setError(null);

        if (preview?.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }

        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    useEffect(() => {
        return () => {
            if (preview?.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    async function onSubmit(
        values: z.infer<typeof signUpSchema>
    ) {
        setError(null);

        startTransition(async () => {
            try {
                const formData = new FormData();

                formData.append("email", values.email);
                formData.append("password", values.password);
                formData.append("name", values.name);

                if (image) {
                    formData.append("file", image);
                }

                const res = await fetch("/api/register", {
                    method: "POST",
                    body: formData,
                });

                const data = await res
                    .json()
                    .catch(() => null);

                if (!res.ok) {
                    setError(
                        data?.error ??
                            "No se pudo crear la cuenta."
                    );
                    return;
                }

                router.push("/login?emailsend=true");
                router.refresh();
            } catch (err) {
                console.error("registerForm error:", err);

                setError(
                    "No se pudo completar el registro. Intenta nuevamente."
                );
            }
        });
    }

    return (
        <div className="w-full">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-xs text-slate-200">
                                    Email
                                </FormLabel>

                                <FormControl>
                                    <Input
                                        className="rounded-md bg-slate-900/40 border-slate-600 text-slate-100 placeholder:text-slate-500 h-9"
                                        placeholder="email"
                                        type="email"
                                        {...field}
                                    />
                                </FormControl>

                                <FormDescription className="text-[11px] text-slate-400">
                                    Enter your email
                                </FormDescription>

                                <FormMessage className="text-[11px]" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-xs text-slate-200">
                                    Password
                                </FormLabel>

                                <FormControl>
                                    <Input
                                        className="rounded-md bg-slate-900/40 border-slate-600 text-slate-100 placeholder:text-slate-500 h-9"
                                        placeholder="password"
                                        type="password"
                                        {...field}
                                    />
                                </FormControl>

                                <FormDescription className="text-[11px] text-slate-400">
                                    Enter your password
                                </FormDescription>

                                <FormMessage className="text-[11px]" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-xs text-slate-200">
                                    Name
                                </FormLabel>

                                <FormControl>
                                    <Input
                                        className="rounded-md bg-slate-900/40 border-slate-600 text-slate-100 placeholder:text-slate-500 h-9"
                                        placeholder="name"
                                        type="text"
                                        {...field}
                                    />
                                </FormControl>

                                <FormDescription className="text-[11px] text-slate-400">
                                    Enter your name
                                </FormDescription>

                                <FormMessage className="text-[11px]" />
                            </FormItem>
                        )}
                    />

                    <div className="flex flex-col lg:flex-row lg:items-center w-full gap-4 lg:gap-6 mt-2">
                        <FormItem className="lg:flex-1">
                            <FormLabel
                                className="
                                    flex justify-center items-center
                                    rounded-md w-full lg:w-60 h-10
                                    border border-emerald-500
                                    bg-emerald-900/40
                                    hover:bg-emerald-800/60
                                    text-emerald-100 text-xs font-medium
                                    cursor-pointer
                                    transition-colors
                                "
                                htmlFor="profileImage"
                            >
                                Subir una imagen de perfil
                            </FormLabel>

                            <FormControl>
                                <input
                                    id="profileImage"
                                    className="hidden"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                />
                            </FormControl>

                            <FormDescription className="text-[11px] text-slate-400 mt-1">
                                Opcional. JPEG, PNG o WebP, máximo 8 MB.
                            </FormDescription>

                            <FormMessage className="text-[11px]" />
                        </FormItem>

                        {preview && (
                            <div className="mt-1 lg:mt-0 flex flex-col items-center gap-1">
                                <p className="text-[11px] text-slate-400">
                                    Vista previa:
                                </p>

                                <div className="w-[80px] lg:w-[96px] aspect-square relative overflow-hidden rounded-full border border-slate-600 bg-slate-950">
                                    <Image
                                        src={preview}
                                        alt="Vista previa de la imagen de perfil"
                                        fill
                                        sizes="96px"
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="text-[11px] text-red-300 bg-red-950/40 border border-red-700 px-3 py-2 rounded-md"
                        >
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full rounded-md bg-sky-600 hover:bg-sky-500 text-sm font-semibold mt-2"
                    >
                        {isPending
                            ? "Creando cuenta..."
                            : "Crear cuenta"}
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default RegisterForm;
