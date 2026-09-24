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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";

import { createPost } from "@/actions/post-action";
import {
    getCloudinaryUploadErrorMessage,
    isCloudinaryUnauthorizedError,
    uploadPostImage,
    validateAuthenticatedImageFile,
} from "@/lib/cloudinary-functions";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useGlobalContext } from "@/context/globalcontext";
import { cfg } from "@/config";
import { ImageIcon, RefreshCcw, X } from "lucide-react";

type Props = {
    wallUserId: number;
    canPublish?: boolean; // si lo resolvés server-side, pasalo y listo
};

const PostFormWall = ({ wallUserId, canPublish }: Props) => {
    const { l } = useGlobalContext();

    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [needsLogin, setNeedsLogin] = useState(false);
    const [expanded, setExpanded] = useState<boolean>(false);

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const form = useForm<z.infer<typeof postSchema>>({
        resolver: zodResolver(postSchema),
        defaultValues: { title: "", description: "" },
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
        setError(null);
        setNeedsLogin(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (!file) {
            clearImage();
            return;
        }

        try {
            validateAuthenticatedImageFile(file);
        } catch (err) {
            setError(
                getCloudinaryUploadErrorMessage(
                    err,
                    "No se pudo usar ese archivo."
                )
            );
            setNeedsLogin(false);
            e.target.value = "";
            return;
        }

        setError(null);
        setNeedsLogin(false);

        if (preview?.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }

        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    useEffect(() => {
        return () => {
            if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    async function onSubmit(values: z.infer<typeof postSchema>) {
        setError(null);
        setNeedsLogin(false);

        startTransition(async () => {
            let imageUrl: { url: string; publicId: string } | null = null;

            if (image) {
                try {
                    imageUrl = await uploadPostImage(image);
                } catch (err) {
                    console.error(err);
                    setError(
                        getCloudinaryUploadErrorMessage(
                            err,
                            "Error al subir la imagen"
                        )
                    );
                    setNeedsLogin(
                        isCloudinaryUnauthorizedError(err)
                    );
                    return;
                }
            }

            // ✅ publica en wallUserId
            const response = await createPost(values, imageUrl, undefined, wallUserId);

            if (response?.error) {
                setError(response.error);
                setNeedsLogin(
                    response.error === "No logged user."
                );
                return;
            }

            // UX: cerramos, limpiamos y refrescamos el feed actual
            clearImage();
            form.reset({ title: "", description: "" });
            setExpanded(false);

            // si querés evitar reload, podés levantar un callback onCreated y hacer prepend.
            router.refresh?.();
            window.location.reload();
        });
    }

    // Si canPublish viene y es false, ocultamos el formulario
    if (canPublish === false) {
        return (
            <div
                className="
          w-full rounded-sm border border-slate-800 bg-[rgba(0,0,0,0.9)]
          px-2 py-2 text-[12px] text-slate-300
        "
            >
                No tenés permiso para publicar en este muro.
            </div>
        );
    }

    return (
        <div
            id="PostFormWall"
            className="
        w-full
        rounded-sm
        border
        border-slate-800
        bg-[rgba(0,0,0,0.9)]
        shadow-md
        px-0 py-0
        lg:px-0 lg:py-0
        mb-0
        sticky
        top-10
        lg:top-12
        z-50
        max-h-[calc(100vh-70px)]
        overflow-y-auto
      "
        >
            {expanded ? (
                <div className="p-2">
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="text-slate-400 hover:text-slate-300 text-sm"
                    >
                        <X size={16} className="text-white" />
                    </button>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0.1">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] text-slate-400 leading-none">
                                            Título
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Título del post"
                                                type="text"
                                                {...field}
                                                className="
                          h-6 text-[12px]
                          bg-slate-950 border-slate-700
                          focus-visible:ring-blue-500
                        "
                                            />
                                        </FormControl>

                                        <div
                                            className={`
                        mt-[2px] text-[10px]
                        ${counterClass(titleValue.length, TITLE_MAX)}
                      `}
                                        >
                                            {titleValue.length} / {TITLE_MAX}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] text-slate-400 leading-none">
                                            Descripción
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Escribe algo..."
                                                {...field}
                                                className="
                          text-[12px] min-h-[48px]
                          bg-slate-950 border-slate-700
                          focus-visible:ring-blue-500
                        "
                                            />
                                        </FormControl>

                                        <div
                                            className={`
                        mt-[2px] text-[10px]
                        ${counterClass(descValue.length, DESC_MAX)}
                      `}
                                        >
                                            {descValue.length} / {DESC_MAX}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormItem>
                                <FormLabel className="text-[11px] text-slate-400 leading-none">
                                    Imagen (opcional)
                                </FormLabel>
                                <FormControl>
                                    <div className="flex flex-wrap items-center gap-1">
                                        <Input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />

                                        {!preview ? (
                                            <Button
                                                type="button"
                                                onClick={openFilePicker}
                                                className="
                          h-7 px-2 text-[11px]
                          bg-slate-600 text-white rounded-md
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
                            h-7 px-2 text-[11px]
                            bg-slate-600 text-white rounded-md
                            hover:bg-blue-600
                          "
                                                >
                                                    <RefreshCcw className="mr-1" size={16} />
                                                    Cambiar
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={clearImage}
                                                    className="
                            h-7 px-2 text-[11px]
                            rounded-md border-slate-600 text-slate-200
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

                            {preview && (
                                <div className="mt-2 flex justify-center">
                                    <img
                                        src={preview}
                                        alt="vista previa"
                                        className="
                      w-full max-w-[400px]
                      rounded-lg border border-slate-700 bg-black object-contain
                    "
                                    />
                                </div>
                            )}

                            {error && (
                                <div
                                    role="alert"
                                    className="mt-2 rounded-md border border-red-900/70 bg-red-950/40 px-3 py-2 text-xs text-red-300"
                                >
                                    <p>{error}</p>
                                    {needsLogin && (
                                        <Link
                                            href="/login"
                                            className="mt-1 inline-block underline text-sky-300 hover:text-sky-200"
                                        >
                                            {cfg.TEXTS.acceder}
                                        </Link>
                                    )}
                                </div>
                            )}

                            <div className="pt-1 flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="
                    h-7 px-2 text-[11px]
                    rounded-md bg-blue-600 hover:bg-blue-500
                    disabled:opacity-60
                  "
                                >
                                    {isPending ? "Publicando..." : "Publicar"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            ) : (
                <div className="h-8 text-[12px] bg-slate-950 text-slate-400 hover:text-slate-300 mb-0">
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="
              h-8 text-[12px]
              bg-slate-950 border border-slate-800 rounded-[4px]
              text-slate-400 hover:text-slate-300
              w-full text-left px-2
            "
                    >
                        Escribe algo...
                    </button>
                </div>
            )}
        </div>
    );
};

export default PostFormWall;



