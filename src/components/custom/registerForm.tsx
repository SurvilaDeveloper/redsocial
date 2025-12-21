// src/components/custom/registerForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "@/lib/zod";
import { registerAction } from "@/actions/auth-action";

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
import { uploadProfileImage } from "@/lib/cloudinary-functions";

const RegisterForm = () => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>("/user.jpg");
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImage(file);

        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
        } else {
            setPreview("/user.jpg");
        }
    };

    async function onSubmit(values: z.infer<typeof signUpSchema>) {
        setError(null);

        startTransition(async () => {
            let uploadedImage: { url: string; publicId: string } | null = null;

            if (image) {
                try {
                    uploadedImage = await uploadProfileImage(image);
                } catch (err) {
                    setError("Error al subir la imagen");
                    return;
                }
            }

            const response = await registerAction(values, uploadedImage);

            if (response.error) {
                setError(response.error);
                return;
            }

            router.push("/login?emailsend=true");
            router.refresh();
        });
    }

    return (
        <div className="w-full">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    {/* Email */}
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

                    {/* Password */}
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

                    {/* Name */}
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

                    {/* Imagen de perfil */}
                    <div className="flex flex-col md:flex-row md:items-center w-full gap-4 md:gap-6 mt-2">
                        <FormItem className="md:flex-1">
                            <FormLabel
                                className="
                                    flex justify-center items-center 
                                    rounded-md w-full md:w-60 h-10 
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
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </FormControl>
                            <FormDescription className="text-[11px] text-slate-400 mt-1">
                                Opcional, puedes cambiarla más tarde.
                            </FormDescription>
                            <FormMessage className="text-[11px]" />
                        </FormItem>

                        {preview && (
                            <div className="mt-1 md:mt-0 flex flex-col items-center gap-1">
                                <p className="text-[11px] text-slate-400">
                                    Vista previa:
                                </p>
                                <div className="w-[80px] md:w-[96px] aspect-square relative overflow-hidden rounded-full border border-slate-600 bg-slate-950">
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

                    {/* Error general */}
                    {error && (
                        <FormMessage className="text-[11px] text-red-300 bg-red-950/40 border border-red-700 px-3 py-2 rounded-md">
                            {error}
                        </FormMessage>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full rounded-md bg-sky-600 hover:bg-sky-500 text-sm font-semibold mt-2"
                    >
                        Crear cuenta
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default RegisterForm;


