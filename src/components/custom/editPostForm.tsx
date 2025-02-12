"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { postSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { createPost, updatePost } from "@/actions/post-action";
import { useRouter } from "next/navigation";
import Link from "next/link";
//import { t } from "@/app/text";
import { useGlobalContext } from "@/context/globalcontext";
import Image from "next/image";
import { cfg } from "@/config";

const EditPostForm = ({
    title,
    imgUrl,
    description,
    postId
}: {
    title: string,
    imgUrl: string | null,
    description: string,
    postId: number
}) => {
    const { l } = useGlobalContext();
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null); // Estado para la vista previa
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof postSchema>>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: title,
            description: description,
        },
        mode: "onChange",
    });

    // Función para manejar la selección de imagen
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImage(file);

        // Generar URL temporal para vista previa
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
        } else {
            setPreview(null);
        }
    };

    async function uploadImage(file: File) {
        const signatureRes = await fetch("/api/cloudinary-sign");
        const { signature, timestamp, apiKey, cloudName, folder } = await signatureRes.json();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        return data.secure_url;
    }

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
            const response = await updatePost(values, imageUrl, postId);

            if (response.error) {
                setError(response.error);
                console.log("Error en la creación del post: ", response.error);
            } else {
                router.push("/");
            }
        });
    }

    return (
        <div className="w-full bg-red-200 left-0 top-20">
            <h2>Editando posteo.</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder={title} type="text" {...field} />
                                </FormControl>
                                <FormDescription>Enter your title</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* Vista previa de la imagen seleccionada */}
                    {/*!preview && (
                        <div className="mt-2">
                            <p>no preview</p>
                            {imgUrl && <Image src={imgUrl} alt="Vista previa actual" width={600} height={600}></Image>}

                        </div>
                    )*/}
                    {/*preview && (

                        <div className="mt-2">
                            <p>preview</p>
                            <Image src={preview} alt="Vista previa editando" width={600} height={600}></Image>
                        </div>
                    )*/}

                    {/* Campo para subir la imagen */}
                    <FormItem>
                        <FormLabel>Imagen</FormLabel>
                        <div className="relative w-full flex items-center justify-center border-2 border-dashed border-gray-400 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {image ? (
                                <span className="text-gray-700">
                                    {!preview && (
                                        <div className="mt-2">
                                            <p>no preview</p>
                                            {imgUrl && <Image src={imgUrl} alt="Vista previa actual" width={600} height={600}></Image>}

                                        </div>
                                    )}
                                    {preview && (

                                        <div className="mt-2">
                                            <p>preview</p>
                                            <Image src={preview} alt="Vista previa editando" width={600} height={600}></Image>
                                        </div>
                                    )}</span>
                            ) : (
                                <span className="text-gray-500">{imgUrl && <Image src={imgUrl} alt="Vista previa actual" width={600} height={600}></Image>}</span>
                            )}
                        </div>
                        <FormMessage />
                    </FormItem>


                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Input placeholder={description} type="text" {...field} />
                                </FormControl>
                                <FormDescription>Enter your description</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {error && <FormMessage>{error}</FormMessage>}
                    {error && <Link href="/login">{cfg.TEXTS.acceder}</Link>}

                    <Button type="submit" disabled={isPending} className="bg-slate-500">
                        Submit
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default EditPostForm;
