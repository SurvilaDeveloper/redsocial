// src/components/custom/SitesImageCard.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface SitesImageProps {
    image: {
        id: number;
        imageUrl: string;
        imagePublicId: string;
        index: number;
    };
    isFirst: boolean;

    /** 🆕 Callback opcional para abrir detalle de imagen */
    //onOpenImageDetail?: (imageId: number, postId: number) => void;

    /**
     * 🆕 Variante de layout:
     * - "grid" (default): mantiene tu comportamiento actual (aspect-square, etc.)
     * - "swiper": ocupa todo el alto disponible (h-full)
     */
    variant?: "grid" | "swiper";
}

/**
 * SitesImageCard
 * -----------------------------------------------------------------------------
 * Componente visual para renderizar una imagen dentro de grillas o swipers.
 * Usa next/image con layout "fill" y muestra overlay de carga hasta que
 * la imagen termina de renderizar.
 *
 * Props:
 * - image: {
 *     id: number
 *     imageUrl: string
 *     imagePublicId: string
 *     index: number
 *   }
 *   Información de la imagen a mostrar.
 *
 * - isFirst: boolean
 *   Indica si es la primera imagen (usado en layout tipo grid para ocupar
 *   ancho completo).
 *
 * - variant?: "grid" | "swiper"
 *   Define el comportamiento de layout:
 *
 *     • "grid" (default)
 *       - Usa aspect-square.
 *       - Mantiene proporción fija.
 *       - Ideal para galerías tipo masonry/grid.
 *
 *     • "swiper"
 *       - Ocupa todo el alto disponible (h-full).
 *       - Pensado para usarse dentro de ImagesSwiperSites con fit="height".
 *
 * Comportamiento:
 * - Muestra spinner mientras la imagen carga.
 * - Usa object-contain para no recortar la imagen.
 * - Evita drag nativo de la imagen (draggable={false}).
 */
export default function SitesImageCard({
    image,
    isFirst,
    //onOpenImageDetail,
    variant = "grid",
}: SitesImageProps) {

    // 👇 estado de carga de la imagen
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
        setIsImageLoaded(false);
    }, [image.id, image.imageUrl]);

    const rootClass =
        variant === "swiper"
            ? // ✅ Swiper: ocupa el alto disponible, sin aspect-square
            "flex flex-col gap-1 bg-black relative w-full h-full overflow-hidden rounded-[8px]"
            : // ✅ Grid: tu layout original
            isFirst
                ? "flex flex-col gap-1 bg-[var(--b-gy-cbcr)] relative w-full aspect-square overflow-hidden"
                : "flex flex-col gap-1 bg-[var(--b-gy-cbcr)] relative w-[48%] aspect-square overflow-hidden";

    return (
        <div className={rootClass}
            style={{
                border: "var(--b-gy-cbr) solid var(--b-gy-cbrcr)",
                borderRadius: "var(--b-gy-crs)"
            }}
        >

            {/* ✅ En swiper: la imagen debe ser flex-1 para dejar visible la barra de reacciones */}
            <div
                //onDoubleClick={() => onOpenImageDetail?.(image.id, image.post_id)}
                className={
                    variant === "swiper"
                        ? "relative w-full flex-1 min-h-0 cursor-zoom-in select-none"
                        : "relative w-full h-full cursor-zoom-in select-none"
                }
            >
                {/* Overlay de carga */}
                {!isImageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                        <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                )}

                <Image
                    src={image.imageUrl}
                    alt={`Imagen ${image.index}`}
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                    className={`object-contain transition-opacity duration-300 ${isImageLoaded ? "opacity-100" : "opacity-0"
                        }`}
                    draggable={false}
                    onLoad={() => setIsImageLoaded(true)}
                />
            </div>


        </div>
    );
}