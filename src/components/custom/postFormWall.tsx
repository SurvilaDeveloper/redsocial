// src/components/custom/postFormWall.tsx

"use client";

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
import { Textarea } from "../ui/textarea";

import { createPost } from "@/actions/post-action";
import { uploadPostImage } from "@/lib/cloudinary-functions";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useGlobalContext } from "@/context/globalcontext";
import { cfg } from "@/config";
import { ImageIcon, RefreshCcw, X } from "lucide-react";

const PostFormWall = () => {
    const { l } = useGlobalContext();

    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const form = useForm<z.infer<typeof postSchema>>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: "",
            description: "",
        },
        mode: "onChange",
    });

    const titleValue = form.watch("title") ?? "";
    const descValue = form.watch("description") ?? "";

    const TITLE_MAX = 100;
    const DESC_MAX = 1000;

    const counterClass = (len: number, max: number) => {
        if (len > max) return "text-red-400";
        if (len >= Math.floor(max * 0.8)) return "text-yellow-300";
        return "text-slate-400";
    };

    const openFilePicker = () => fileInputRef.current?.click();

    const clearImage = () => {
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        setImage(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);

        setImage(file);

        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
        } else {
            setPreview(null);
        }
    };

    useEffect(() => {
        return () => {
            if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    async function onSubmit(values: z.infer<typeof postSchema>) {
        setError(null);

        startTransition(async () => {
            let imageUrl: {
                url: string;
                publicId: string;
            } | null = null;

            if (image) {
                try {
                    imageUrl = await uploadPostImage(image);
                } catch {
                    setError("Error al subir la imagen");
                    return;
                }
            }

            const response = await createPost(values, imageUrl);

            if (response?.error) {
                setError(response.error);
                return;
            }

            router.push("/");
            window.location.reload();
        });
    }

    return (
        <div
            id="PostFormWall"
            className="
                w-full 
                rounded-xl 
                border border-slate-800 
                bg-slate-900/80 
                shadow-md 
                px-3 py-3 
                md:px-4 md:py-4 
                mb-3
            "
        >
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-3"
                >
                    {/* Título */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs text-slate-300">
                                    Título
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Título del post"
                                        type="text"
                                        {...field}
                                        className="
                                            h-9
                                            text-sm
                                            bg-slate-950
                                            border-slate-700
                                            focus-visible:ring-blue-500
                                        "
                                    />
                                </FormControl>
                                <div
                                    className={`
                                        mt-1 text-[11px] text-right
                                        ${counterClass(titleValue.length, TITLE_MAX)}
                                    `}
                                >
                                    {titleValue.length} / {TITLE_MAX}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Descripción */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs text-slate-300">
                                    Descripción
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Escribe algo..."
                                        {...field}
                                        className="
                                            text-sm
                                            min-h-[80px]
                                            bg-slate-950
                                            border-slate-700
                                            focus-visible:ring-blue-500
                                        "
                                    />
                                </FormControl>
                                <div
                                    className={`
                                        mt-1 text-[11px] text-right
                                        ${counterClass(descValue.length, DESC_MAX)}
                                    `}
                                >
                                    {descValue.length} / {DESC_MAX}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Imagen + botones */}
                    <FormItem>
                        <FormLabel className="text-xs text-slate-300">
                            Imagen (opcional)
                        </FormLabel>
                        <FormControl>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* input real (oculto) */}
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />

                                {!preview ? (
                                    <Button
                                        type="button"
                                        onClick={openFilePicker}
                                        className="
                                            h-8 
                                            px-3 
                                            text-xs 
                                            bg-slate-600 
                                            text-white 
                                            rounded-md 
                                            hover:bg-blue-600
                                        "
                                    >
                                        <ImageIcon className="mr-1" size={16} />
                                        Seleccionar imagen
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            onClick={openFilePicker}
                                            className="
                                                h-8 
                                                px-3 
                                                text-xs 
                                                bg-slate-600 
                                                text-white 
                                                rounded-md 
                                                hover:bg-blue-600
                                            "
                                        >
                                            <RefreshCcw
                                                className="mr-1"
                                                size={16}
                                            />
                                            Cambiar
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={clearImage}
                                            className="
                                                h-8 
                                                px-3 
                                                text-xs 
                                                rounded-md 
                                                border-slate-600 
                                                text-slate-200
                                            "
                                        >
                                            <X className="mr-1" size={16} />
                                            Quitar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>

                    {/* Preview */}
                    {preview && (
                        <div className="mt-2 flex justify-center">
                            <img
                                src={preview}
                                alt="vista previa"
                                className="
                                    w-full 
                                    max-w-[400px] 
                                    rounded-lg 
                                    border border-slate-700 
                                    bg-black 
                                    object-contain
                                "
                            />
                        </div>
                    )}

                    {/* Error global */}
                    {error && (
                        <div className="mt-2 text-xs text-red-400">
                            <p>{error}</p>
                            <Link
                                href="/login"
                                className="underline text-red-300"
                            >
                                {cfg.TEXTS.acceder}
                            </Link>
                        </div>
                    )}

                    {/* Botón enviar */}
                    <div className="pt-1 flex justify-end">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="
                                h-9 
                                px-4 
                                text-sm 
                                rounded-md 
                                bg-blue-600 
                                hover:bg-blue-500 
                                disabled:opacity-60
                            "
                        >
                            {isPending ? "Publicando..." : "Publicar"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default PostFormWall;

