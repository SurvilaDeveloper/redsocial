// src/components/custom/createPostForm.tsx
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
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { cfg } from "@/config";
import { uploadPostImage } from "@/lib/cloudinary-functions";
import { createPost } from "@/actions/post-action";

// 🆕 Prop para recibir la session desde la page
type CreatePostFormProps = {
    session: any | null;
};

const CreatePostForm = ({ session }: CreatePostFormProps) => {
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainPreview, setMainPreview] = useState<string | null>(null);

    const [imageSet, setImageSet] = useState<(File | null)[]>([]);
    const [previewSet, setPreviewSet] = useState<(string | null)[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Por si más adelante querés condicionar algo dentro del form
    const isLogged = Boolean(session?.user?.id);

    const form = useForm<z.infer<typeof postSchema>>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: "",
            description: "",
        },
        mode: "onChange",
    });

    // ───────────────── Imagen principal ─────────────────
    const handleMainImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0] || null;
        setMainImage(file);

        if (mainPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(mainPreview);
        }

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setMainPreview(objectUrl);
        } else {
            setMainPreview(null);
        }
    };

    // ──────────────── Añadir nueva imagen accesoria ────────────────
    const handleAddedImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setImageSet((prev) => [...prev, file]);
            setPreviewSet((prev) => [...prev, objectUrl]);
        }
    };

    // ──────────────── Cambiar una imagen accesoria existente ────────────────
    function changeImageAdded(
        e: React.ChangeEvent<HTMLInputElement>,
        index: number
    ) {
        if (previewSet[index]) {
            URL.revokeObjectURL(previewSet[index] as string);
        }

        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setImageSet((prev) => {
                const newImages = [...prev];
                newImages[index] = file;
                return newImages;
            });
            setPreviewSet((prev) => {
                const newPreviews = [...prev];
                newPreviews[index] = objectUrl;
                return newPreviews;
            });
        }
    }

    // ──────────────── Eliminar una imagen accesoria ────────────────
    function removeImageAdded(index: number) {
        if (previewSet[index]) {
            URL.revokeObjectURL(previewSet[index] as string);
        }
        setImageSet((prev) => {
            const newImages = [...prev];
            newImages.splice(index, 1);
            return newImages;
        });
        setPreviewSet((prev) => {
            const newPreviews = [...prev];
            newPreviews.splice(index, 1);
            return newPreviews;
        });
    }

    const accessoryCount = previewSet.filter(Boolean).length;

    // ──────────────── Submit ────────────────
    async function onSubmit(values: z.infer<typeof postSchema>) {
        setError(null);

        startTransition(async () => {
            let mainImageUrl: { url: string; publicId: string } | null = null;
            const accessoryImageUrls: ({ url: string; publicId: string } | null)[] =
                [];

            // Subir imagen principal (si hay)
            if (mainImage) {
                try {
                    mainImageUrl = await uploadPostImage(mainImage);
                } catch (err) {
                    console.error(err);
                    setError("Error al subir la imagen principal");
                    return;
                }
            }

            // Subir imágenes accesorias
            if (imageSet.length > 0) {
                try {
                    for (let i = 0; i < imageSet.length; i++) {
                        if (imageSet[i] != null) {
                            const uploaded = await uploadPostImage(
                                imageSet[i] as File
                            );
                            accessoryImageUrls.push(uploaded);
                        } else {
                            accessoryImageUrls.push(null);
                        }
                    }
                } catch (err) {
                    console.error(err);
                    setError("Error al subir las imágenes accesorias");
                    return;
                }
            }

            // Crear post en la DB con imagen principal + accesorias
            const response = await createPost(
                values,
                mainImageUrl,
                accessoryImageUrls
            );

            if (response?.error) {
                console.error("Error al crear el post:", response.error);
                setError(response.error);
            } else {
                router.push("/");
            }
        });
    }

    return (
        <div className="w-full text-slate-100">
            {/* Si quisieras, podrías avisar acá si no hay sesión */}
            {!isLogged && (
                <p className="mb-2 text-xs text-amber-300">
                    No se detecta sesión. Es posible que el envío falle.
                </p>
            )}

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    {/* Título */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-semibold text-sm">
                                    Título
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Título del post"
                                        type="text"
                                        {...field}
                                        className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
                                    />
                                </FormControl>
                                <div className="flex flex-row justify-between gap-8">
                                    <FormDescription className="text-xs text-slate-400">
                                        Escribe el título de tu nuevo post.
                                    </FormDescription>
                                    <FormMessage className="bg-red-900/60 text-red-200 font-bold px-2 rounded" />
                                </div>
                            </FormItem>
                        )}
                    />

                    {/* Imagen principal */}
                    <FormItem>
                        <FormLabel className="font-semibold text-sm mb-1 block">
                            Imagen principal
                        </FormLabel>
                        <div className="flex flex-row items-center gap-2 mb-2">
                            <FormControl>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleMainImageChange}
                                    className="text-xs file:text-xs file:px-2 file:py-1 file:rounded file:border-0 file:bg-slate-700 file:text-slate-100 bg-slate-900 border-slate-700 text-slate-200"
                                />
                            </FormControl>
                            <FormMessage />
                        </div>

                        <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-600/80 bg-slate-900/50 p-4 rounded-xl">
                            {mainPreview ? (
                                <Image
                                    src={mainPreview}
                                    alt="Vista previa actual"
                                    width={512}
                                    height={512}
                                    className="rounded-lg max-h-[360px] w-auto object-contain"
                                />
                            ) : (
                                <Image
                                    src="/imageneutral.jpg"
                                    alt="Imagen neutral"
                                    width={512}
                                    height={512}
                                    className="rounded-lg max-h-[360px] w-auto object-contain"
                                />
                            )}
                        </div>
                    </FormItem>

                    {/* Descripción */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-semibold text-sm">
                                    Descripción
                                </FormLabel>
                                <FormControl>
                                    <textarea
                                        {...field}
                                        placeholder="Describe tu post..."
                                        className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-slate-100 placeholder:text-slate-500"
                                    />
                                </FormControl>
                                <div className="flex flex-row justify-between gap-8">
                                    <FormDescription className="text-xs text-slate-400">
                                        Escribe el texto de tu post.
                                    </FormDescription>
                                    <FormMessage className="bg-red-900/60 text-red-200 font-bold px-2 rounded" />
                                </div>
                            </FormItem>
                        )}
                    />

                    {/* Imágenes accesorias (previews) */}
                    {previewSet.map((val, index) =>
                        val ? (
                            <div key={val} className="flex flex-col gap-2">
                                <hr className="border-slate-700" />
                                <div className="flex flex-row flex-wrap gap-2 items-center">
                                    <FormItem>
                                        <FormLabel className="flex items-center px-4 bg-emerald-700/80 h-8 w-fit rounded-[6px] hover:bg-emerald-600 text-xs cursor-pointer">
                                            Cambiar imagen
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) =>
                                                    changeImageAdded(e, index)
                                                }
                                                className="hidden"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    <Button
                                        type="button"
                                        className="flex items-center px-4 bg-red-700/80 h-8 w-fit rounded-[6px] hover:bg-red-600 text-xs"
                                        onClick={() => removeImageAdded(index)}
                                    >
                                        Eliminar esta imagen
                                    </Button>
                                </div>
                                <Image
                                    src={val}
                                    alt="Imagen accesoria"
                                    width={512}
                                    height={512}
                                    className="rounded-lg max-h-[320px] w-auto object-contain"
                                />
                            </div>
                        ) : null
                    )}

                    {/* Agregar nuevas imágenes accesorias (máx 6) */}
                    {accessoryCount < 6 ? (
                        <FormItem>
                            <FormLabel className="flex items-center px-4 bg-emerald-700/80 h-10 w-fit rounded-[6px] hover:bg-emerald-600 text-xs cursor-pointer">
                                Agrega una imagen más al post:{" "}
                                {accessoryCount}
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAddedImageChange}
                                    className="hidden"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    ) : (
                        <div className="text-xs text-amber-300">
                            El límite para la cantidad de imágenes accesorias es de 6.
                        </div>
                    )}

                    {/* Errores y submit */}
                    {error && (
                        <>
                            <FormMessage className="mt-2 bg-red-900/60 text-red-200 px-3 py-2 rounded">
                                {error}
                            </FormMessage>
                            {error === "No logged user." && (
                                <Link
                                    href="/login"
                                    className="inline-block mt-1 text-xs text-sky-300 hover:text-sky-200 underline"
                                >
                                    {cfg.TEXTS.acceder}
                                </Link>
                            )}
                        </>
                    )}

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="mt-3 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
                    >
                        Crear post y salir
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default CreatePostForm;


