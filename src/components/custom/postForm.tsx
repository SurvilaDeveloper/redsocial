"use client"

import { z } from "zod"
import { postSchema } from "@/lib/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createPost } from "@/actions/post-action"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
//import { t } from "@/app/text"
import { useGlobalContext } from "@/context/globalcontext"
import { cfg } from "@/config"

const PostForm = () => {

    const { l } = useGlobalContext()
    const [image, setImage] = useState<File | null>(null) // Estado para la imagen
    const [error, setError] = useState<String | null>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter();

    // 1. Define your form.
    const form = useForm<z.infer<typeof postSchema>>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: "",
            description: "",
        },
        mode: "onChange",
    });

    // 2. Función para subir la imagen a Cloudinary
    async function uploadImage(file: File) {
        // 1. Obtener la firma desde el backend
        const signatureRes = await fetch("/api/cloudinary-sign");
        const { signature, timestamp, apiKey, cloudName, folder } = await signatureRes.json();

        // 2. Crear el FormData con los datos necesarios
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder); // Agregar la carpeta donde se guardará la imagen

        // 3. Subir la imagen a Cloudinary
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        return data.secure_url; // Devuelve la URL de la imagen subida
    }


    // 3. Define a submit handler.
    async function onSubmit(values: z.infer<typeof postSchema>) {

        setError(null);
        startTransition(async () => {
            let imageUrl = null;

            if (image) {
                try {
                    imageUrl = await uploadImage(image);
                } catch (error) {
                    setError("Error al subir la imagen");
                    return;
                }
            }
            const response = await createPost(values, imageUrl);

            if (response.error) {
                setError(response.error)
            } else {
                router.push("/")
            }
        });
    }

    return (
        <div className="w-full">
            <h2>Post Form</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="title"
                                        type="text"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Enter your title
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="description"
                                        type="text"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Enter your password
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Nuevo campo para subir la imagen */}
                    <FormItem>
                        <FormLabel>Profile Picture</FormLabel>
                        <FormControl>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImage(e.target.files?.[0] || null)}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    {error && <FormMessage>{error}</FormMessage>}
                    {error && <Link href="/login">{cfg.TEXTS.acceder}</Link>}
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
    )
}

export default PostForm

