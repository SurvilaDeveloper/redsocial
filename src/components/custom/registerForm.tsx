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
    const [image, setImage] = useState<File | null>(null); // Estado para la imagen
    const [preview, setPreview] = useState<string | null>("/user.jpg"); // Vista previa
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const inputsCss = "flex items-center rounded h-6";

    const form = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
        },
        mode: "onChange",
    });

    // Manejar selección de imagen
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

            // 1) Si hay imagen, la subimos a Cloudinary
            if (image) {
                try {
                    uploadedImage = await uploadProfileImage(image);
                } catch (err) {
                    setError("Error al subir la imagen");
                    return;
                }
            }

            // 2) Llamamos a la server action SIEMPRE (con o sin imagen)
            const response = await registerAction(values, uploadedImage);

            if (response.error) {
                setError(response.error);
                return;
            }

            // 3) Si todo salió bien:
            //    - De momento lo mandamos a login,
            //    - y usamos el query `emailsend=true` como ya hacías.
            router.push("/login?emailsend=true");
            router.refresh();
        });
    }

    return (
        <div className="w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        className={inputsCss}
                                        placeholder="email"
                                        type="email"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>Enter your email</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input
                                        className={inputsCss}
                                        placeholder="password"
                                        type="password"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>Enter your password</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input
                                        className={inputsCss}
                                        placeholder="name"
                                        type="text"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>Enter your name</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex flex-row items-center w-full gap-10">
                        {/* Campo para subir la imagen */}
                        <FormItem>
                            <FormLabel
                                className={
                                    "flex justify-center items-center rounded w-60 h-12 border-solid border border-green-500 bg-green-200 hover:bg-green-300 cursor-pointer"
                                }
                                htmlFor="profileImage"
                            >
                                Subir una imagen de perfil
                            </FormLabel>
                            <FormControl className={"flex rounded items-center h-6"}>
                                <input
                                    id="profileImage"
                                    placeholder="Profile Picture"
                                    className={"hidden"}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>

                        {/* Vista previa de la imagen */}
                        {preview && (
                            <div className="mt-2">
                                <p>Vista previa:</p>
                                <div className="w-[96px] aspect-square relative overflow-hidden rounded-full">
                                    <Image
                                        src={preview}
                                        alt="Vista previa de la imagen de perfil"
                                        width={100}
                                        height={100}
                                        className="object-cover rounded-full border-dotted border-2 border-gray-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {error && <FormMessage>{error}</FormMessage>}

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-slate-500"
                    >
                        Submit
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default RegisterForm;

