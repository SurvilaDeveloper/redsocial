// src/components/custom/editPostForm.tsx
"use client";

import { useRef, useState, useTransition } from "react";
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
import { updatePost } from "@/actions/post-action";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Image from "next/image";
import { cfg } from "@/config";
import {
    deletePostImage,
    uploadPostImage,
} from "@/lib/cloudinary-functions";


// Usa el tipo de la imagen que ya está definido en Post (global.d.ts)
type ImageProps = NonNullable<Post["images"]>[number];


type EditPostFormProps = {
    title: string | null;
    images: ImageProps[] | null;
    description: string | null;
    postId: number;
};

const EditPostForm = ({
    title,
    images,
    description,
    postId,
}: EditPostFormProps) => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [imageSet, setImageSet] = useState<(File | null)[]>(() => {
        const files: (File | null)[] = [];
        if (images) {
            for (let i = 0; i < images.length; i++) {
                if (i !== 0) {
                    files.push(null);
                }
            }
        }
        return files;
    });

    const [previewSet, setPreviewSet] = useState<(string | null)[]>(() => {
        const urls: (string | null)[] = [];
        if (images) {
            for (let i = 0; i < images.length; i++) {
                if (i !== 0) {
                    urls.push(null);
                }
            }
        }
        return urls;
    });

    const [imageToDelete, setImageToDelete] = useState<
        { url: string; publicId: string }[]
    >([]);
    const [error, setError] = useState<string | null>(null);
    const imagesAumountRef = useRef<number>(0);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof postSchema>>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: title ?? "",
            description: description ?? "",
        },
        mode: "onChange",
    });

    // Imagen principal
    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0] || null;
        setImage(file);

        if (preview?.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
        } else {
            setPreview(null);
        }
    };

    // Imagen accesoria nueva
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

    async function onSubmit(values: z.infer<typeof postSchema>) {
        setError(null);
        startTransition(async () => {
            let imageUrl: { url: string; publicId: string } | null = null;
            const imageAddedUrls: ({ url: string; publicId: string } | null)[] =
                [];

            // Imagen principal
            if (image) {
                try {
                    imageUrl = await uploadPostImage(image);
                } catch (err) {
                    console.error(err);
                    setError("Error al subir la imagen principal");
                    return;
                }
            }

            // Imágenes accesorias nuevas o reemplazadas
            if (imageSet.length > 0) {
                try {
                    for (let i = 0; i < imageSet.length; i++) {
                        if (imageSet[i] != null) {
                            const uploaded = await uploadPostImage(
                                imageSet[i] as File
                            );
                            imageAddedUrls.push(uploaded);
                        } else {
                            imageAddedUrls.push(null);
                        }
                    }
                } catch (err) {
                    console.error(err);
                    setError("Error al subir las imágenes accesorias");
                    return;
                }
            }

            // Borrar imágenes en Cloudinary
            if (imageToDelete.length > 0) {
                for (let i = 0; i < imageToDelete.length; i++) {
                    try {
                        const res = await deletePostImage(imageToDelete[i]);
                    } catch (err) {
                        console.error(
                            "Error al borrar imagen en Cloudinary:",
                            err
                        );
                    }
                }
            }

            // Actualizar post en DB
            const response = await updatePost(
                values,
                imageUrl,
                imageAddedUrls,
                imageToDelete,
                postId
            );

            if (response.error) {
                console.error(
                    "Error en la actualización del post:",
                    response.error
                );
                setError(response.error);
            } else {
                router.push("/");
            }
        });
    }

    function removeImageAdded(index: number) {
        if (previewSet[index]) {
            URL.revokeObjectURL(previewSet[index] as string);
        }
        setImageSet((prev) => {
            const newImages = [...prev];
            newImages[index] = null;
            return newImages;
        });
        setPreviewSet((prev) => {
            const newPreviews = [...prev];
            newPreviews[index] = null;
            return newPreviews;
        });
    }

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

    function removeSavedImageAdded(
        e: React.MouseEvent<HTMLButtonElement>,
        img: { url: string; publicId: string }
    ) {
        e.preventDefault();
        setImageToDelete((prev) => [...prev, img]);
    }

    // 🔢 contador de imágenes accesorias efectivas
    imagesAumountRef.current = 0;

    return (
        <div className="w-full text-slate-100">
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
                                        Edita el título de tu post.
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
                                    onChange={handleImageChange}
                                    className="text-xs file:text-xs file:px-2 file:py-1 file:rounded file:border-0 file:bg-slate-700 file:text-slate-100 bg-slate-900 border-slate-700 text-slate-200"
                                />
                            </FormControl>
                            <FormMessage />
                        </div>

                        <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-600/80 bg-slate-900/50 p-4 rounded-xl">
                            {images && images.length > 0 ? (
                                <>
                                    {preview ? (
                                        <Image
                                            src={preview}
                                            alt="Vista previa actual"
                                            width={512}
                                            height={512}
                                            className="rounded-lg max-h-[360px] w-auto object-contain"
                                        />
                                    ) : (
                                        <Image
                                            src={images[0].imageUrl}
                                            alt="Imagen principal"
                                            width={512}
                                            height={512}
                                            className="rounded-lg max-h-[360px] w-auto object-contain"
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    {preview ? (
                                        <Image
                                            src={preview}
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
                                </>
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
                                        Edita el texto de tu post.
                                    </FormDescription>
                                    <FormMessage className="bg-red-900/60 text-red-200 font-bold px-2 rounded" />
                                </div>
                            </FormItem>
                        )}
                    />

                    {/* Imágenes accesorias existentes + previews */}
                    {previewSet.map((val, index) => {
                        if (val) {
                            imagesAumountRef.current =
                                imagesAumountRef.current + 1;
                            return (
                                <div key={val} className="flex flex-col gap-2">
                                    <hr className="border-slate-700" />
                                    <div className="flex flex-row flex-wrap gap-2 items-center">
                                        <FormItem>
                                            <FormLabel className="flex items-center px-4 bg-emerald-700/80 h-8 w-fit rounded-[6px] hover:bg-emerald-600 text-xs cursor-pointer">
                                                Cambiar imagen (preview)
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
                                            onClick={() => {
                                                imagesAumountRef.current--;
                                                removeImageAdded(index);
                                            }}
                                        >
                                            {images && images.length - 1 > index
                                                ? "Volver a la imagen original"
                                                : "Eliminar la imagen agregada"}
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
                            );
                        } else if (
                            images &&
                            images[index + 1] &&
                            !imageToDelete.some(
                                (obj) => images[index + 1].imageUrl === obj.url
                            )
                        ) {
                            imagesAumountRef.current =
                                imagesAumountRef.current + 1;
                            return (
                                <div
                                    key={images[index + 1].imageUrl}
                                    className="flex flex-col gap-2"
                                >
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
                                            onClick={(e) =>
                                                removeSavedImageAdded(e, {
                                                    url: images[index + 1].imageUrl,
                                                    publicId:
                                                        images[index + 1].imagePublicId,
                                                })
                                            }
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                    <Image
                                        src={images[index + 1].imageUrl}
                                        alt="Imagen accesoria"
                                        width={512}
                                        height={512}
                                        className="rounded-lg max-h-[320px] w-auto object-contain"
                                    />
                                </div>
                            );
                        }
                    })}

                    {/* Agregar nuevas imágenes accesorias (máx 6) */}
                    {imagesAumountRef.current < 6 ? (
                        <FormItem>
                            <FormLabel className="flex items-center px-4 bg-emerald-700/80 h-10 w-fit rounded-[6px] hover:bg-emerald-600 text-xs cursor-pointer">
                                Agrega una imagen más al post:{" "}
                                {imagesAumountRef.current}
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
                            El límite para la cantidad de imágenes accesorias es
                            de 6.
                        </div>
                    )}

                    {/* Errores y submit */}
                    {error && (
                        <>
                            <FormMessage className="mt-2 bg-red-900/60 text-red-200 px-3 py-2 rounded">
                                {error}
                            </FormMessage>
                            <Link
                                href="/login"
                                className="inline-block mt-1 text-xs text-sky-300 hover:text-sky-200 underline"
                            >
                                {cfg.TEXTS.acceder}
                            </Link>
                        </>
                    )}

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="mt-3 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
                    >
                        Guardar los cambios y salir
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default EditPostForm;

