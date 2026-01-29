// src/components/custom/ImagesSwiper.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PostImageCard from "./PostImageCard";

export type NavigationMode = "thumbnails" | "dots" | "numbers" | "none";
export type ImageReaction = "LIKE" | "UNLIKE" | null;
export type SwiperFit = "width" | "height";

export interface SwiperImage {
    id: number;
    post_id: number;
    imageUrl: string;
    imagePublicId: string;
    index: number;
    active?: number | null;
    likesCount?: number;
    unlikesCount?: number;
    userReaction?: ImageReaction;
}

export interface ImagesSwiperProps {
    id?: string;
    imageArray: SwiperImage[];
    navigation?: NavigationMode;
    sessionUserId: number | null;

    // ✅ control opcional del slide
    currentSlide?: number;
    onSlideChange?: (index: number) => void;

    // ✅ NUEVO: cómo se ajusta el swiper
    // - "width" (default): se ajusta al ancho del contenedor
    // - "height": se ajusta al alto del contenedor (el padre debe tener altura definida)
    fit?: SwiperFit;
}

export const ImagesSwiper: React.FC<ImagesSwiperProps> = ({
    id,
    imageArray,
    navigation = "thumbnails",
    sessionUserId,
    currentSlide: currentSlideProp,
    onSlideChange,
    fit = "width",
}) => {
    const [internalSlide, setInternalSlide] = useState(0);
    const isControlled = typeof currentSlideProp === "number";
    const currentSlide = isControlled ? (currentSlideProp as number) : internalSlide;

    const setSlide = (index: number) => {
        if (index < 0 || index >= imageArray.length) return;

        if (isControlled) {
            onSlideChange?.(index);
        } else {
            setInternalSlide(index);
            onSlideChange?.(index);
        }
    };

    const [dragOffset, setDragOffset] = useState(0);

    const dragStartX = useRef<number | null>(null);
    const dragStartY = useRef<number | null>(null);
    const isHorizontalDrag = useRef(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const thumbnailsRef = useRef<HTMLDivElement | null>(null);

    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    if (!imageArray || imageArray.length === 0) return null;

    // ==========================
    // Medir tamaño del contenedor
    // ==========================
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const updateSize = () => {
            setContainerWidth(el.clientWidth);
            setContainerHeight(el.clientHeight);
        };

        updateSize();

        const ro = new ResizeObserver(() => updateSize());
        ro.observe(el);

        window.addEventListener("resize", updateSize);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", updateSize);
        };
    }, []);

    // ==========================
    // Navegación básica
    // ==========================
    const goToSlide = (index: number) => {
        setSlide(index);
        setDragOffset(0);
    };

    const nextSlide = () => {
        const next =
            currentSlide >= imageArray.length - 1
                ? imageArray.length - 1
                : currentSlide + 1;
        setSlide(next);
        setDragOffset(0);
    };

    const prevSlide = () => {
        const prev = currentSlide <= 0 ? 0 : currentSlide - 1;
        setSlide(prev);
        setDragOffset(0);
    };

    // ==========================
    // Drag con mouse
    // ==========================
    const handleMouseDown = (e: React.MouseEvent) => {
        if (imageArray.length <= 1 || !containerWidth) return;
        e.preventDefault();
        dragStartX.current = e.clientX;
        dragStartY.current = e.clientY;
        isHorizontalDrag.current = true;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (dragStartX.current === null) return;
        const distance = e.clientX - dragStartX.current;
        setDragOffset(distance);
    };

    const handleMouseUp = () => {
        finalizeDrag();
        dragStartX.current = null;
        dragStartY.current = null;
        isHorizontalDrag.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    // ==========================
    // Drag con touch
    // ==========================
    const handleTouchStart = (e: React.TouchEvent) => {
        if (imageArray.length <= 1 || !containerWidth) return;
        const touch = e.touches[0];
        dragStartX.current = touch.clientX;
        dragStartY.current = touch.clientY;
        isHorizontalDrag.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (dragStartX.current === null || dragStartY.current === null) return;

        const touch = e.touches[0];
        const dx = touch.clientX - dragStartX.current;
        const dy = touch.clientY - dragStartY.current;
        const thresh = 5;

        if (!isHorizontalDrag.current) {
            if (Math.abs(dx) < thresh && Math.abs(dy) < thresh) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                isHorizontalDrag.current = true;
            } else {
                // scroll vertical => liberamos
                dragStartX.current = null;
                dragStartY.current = null;
                setDragOffset(0);
                return;
            }
        }

        if (isHorizontalDrag.current) {
            setDragOffset(dx);
        }
    };

    const handleTouchEnd = () => {
        if (!isHorizontalDrag.current) {
            dragStartX.current = null;
            dragStartY.current = null;
            setDragOffset(0);
            return;
        }

        finalizeDrag();
        dragStartX.current = null;
        dragStartY.current = null;
        isHorizontalDrag.current = false;
    };

    const finalizeDrag = () => {
        if (dragStartX.current === null) {
            setDragOffset(0);
            return;
        }

        const container = containerRef.current;
        if (!container) {
            setDragOffset(0);
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;

        const slideElements = Array.from(
            container.querySelectorAll<HTMLElement>(".carousel-slide-item")
        );

        if (slideElements.length === 0) {
            setDragOffset(0);
            return;
        }

        let bestIndex = currentSlide;
        let bestDistance = Infinity;

        slideElements.forEach((el, index) => {
            const r = el.getBoundingClientRect();
            const slideCenter = r.left + r.width / 2;
            const distance = Math.abs(slideCenter - containerCenter);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestIndex = index;
            }
        });

        setSlide(bestIndex);
        setDragOffset(0);
    };

    // ==========================
    // Drag en thumbnails (scroll)
    // ==========================
    const thumbDragStartX = useRef<number | null>(null);

    const handleThumbMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        thumbDragStartX.current = e.clientX;
        document.addEventListener("mousemove", handleThumbMouseMove);
        document.addEventListener("mouseup", handleThumbMouseUp);
    };

    const handleThumbMouseMove = (e: MouseEvent) => {
        if (thumbDragStartX.current === null || !thumbnailsRef.current) return;
        const distance = thumbDragStartX.current - e.clientX;
        thumbnailsRef.current.scrollLeft += distance;
        thumbDragStartX.current = e.clientX;
    };

    const handleThumbMouseUp = () => {
        thumbDragStartX.current = null;
        document.removeEventListener("mousemove", handleThumbMouseMove);
        document.removeEventListener("mouseup", handleThumbMouseUp);
    };

    const handleThumbTouchStart = (e: React.TouchEvent) => {
        thumbDragStartX.current = e.touches[0].clientX;
    };

    const handleThumbTouchMove = (e: React.TouchEvent) => {
        if (thumbDragStartX.current === null || !thumbnailsRef.current) return;
        const distance = thumbDragStartX.current - e.touches[0].clientX;
        thumbnailsRef.current.scrollLeft += distance;
        thumbDragStartX.current = e.touches[0].clientX;
    };

    const handleThumbTouchEnd = () => {
        thumbDragStartX.current = null;
    };

    // ==========================
    // Navegación inferior
    // ==========================
    const renderNavigation = () => {
        if (imageArray.length <= 1) return null;
        if (navigation === "none") return null;

        if (navigation === "thumbnails") {
            return (
                <div
                    className="carousel-thumbnails"
                    ref={thumbnailsRef}
                    onMouseDown={handleThumbMouseDown}
                    onTouchStart={handleThumbTouchStart}
                    onTouchMove={handleThumbTouchMove}
                    onTouchEnd={handleThumbTouchEnd}
                >
                    {imageArray.map((img, index) => (
                        <img
                            key={img.id}
                            src={img.imageUrl}
                            alt={`Imagen ${img.index}`}
                            className={`thumbnail ${index === currentSlide ? "active" : ""}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
            );
        }

        if (navigation === "dots") {
            return (
                <div className="carousel-thumbnails">
                    {imageArray.map((img, index) => (
                        <button
                            key={img.id}
                            className={`navigation-dot ${index === currentSlide ? "active" : ""}`}
                            onClick={() => goToSlide(index)}
                            type="button"
                        >
                            <span />
                        </button>
                    ))}
                </div>
            );
        }

        return (
            <div className="carousel-thumbnails">
                {imageArray.map((img, index) => (
                    <button
                        key={img.id}
                        className={`navigation-numbers ${index === currentSlide ? "active" : ""}`}
                        onClick={() => goToSlide(index)}
                        type="button"
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        );
    };

    // ==========================
    // Fit (width/height)
    // ==========================
    const effectiveWidth = containerWidth;
    const effectiveHeight = containerHeight;

    const canRender =
        effectiveWidth > 0 && (fit === "width" || effectiveHeight > 0);

    // Track: siempre se mueve por width
    const trackStyle: React.CSSProperties = useMemo(() => {
        return {
            transform: `translateX(${-currentSlide * effectiveWidth + dragOffset}px)`,
            transition:
                dragOffset === 0
                    ? "transform 1.00s cubic-bezier(0.5, 0.6, 0.5, 1.2)"
                    : "none",
            // si calzamos por alto, forzamos altura del viewport del track
            height: fit === "height" ? effectiveHeight : undefined,
        };
    }, [currentSlide, dragOffset, effectiveWidth, effectiveHeight, fit]);

    // Slide: siempre ancho fijo, y opcionalmente alto fijo
    const slideStyle: React.CSSProperties = useMemo(() => {
        return {
            width: effectiveWidth || "100%",
            height: fit === "height" ? effectiveHeight : undefined,
        };
    }, [effectiveWidth, effectiveHeight, fit]);

    return (
        <div
            id={id}
            className="inline-carousel"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                cursor: imageArray.length > 1 ? "grab" : "default",
                // en fit height, el carrusel debe poder estirarse a la altura del padre
                height: fit === "height" ? "100%" : undefined,
            }}
        >
            <div
                className="carousel-track"
                style={!canRender ? { opacity: 0 } : { ...trackStyle, opacity: 1 }}
            >
                {imageArray.map((img) => (
                    <div key={img.id} className="carousel-slide-item" style={slideStyle}>
                        {/* wrapper que permite "ocupar el alto" en fit="height" */}
                        <div style={{ width: "100%", height: fit === "height" ? "100%" : "auto" }}>
                            <PostImageCard image={img} sessionUserId={sessionUserId} isFirst={true} variant={fit === "height" ? "swiper" : "grid"} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Flechas */}
            {imageArray.length > 1 && currentSlide > 0 && (
                <button className="nav-button prev" onClick={prevSlide} type="button">
                    ‹
                </button>
            )}

            {imageArray.length > 1 && currentSlide < imageArray.length - 1 && (
                <button className="nav-button next" onClick={nextSlide} type="button">
                    ›
                </button>
            )}

            {renderNavigation()}
        </div>
    );
};

// ======================================================
// ✅ Thumbnails externos (para renderizar “afuera”)
// ======================================================
export function ImagesSwiperThumbnails({
    imageArray,
    currentSlide,
    onSelect,
}: {
    imageArray: SwiperImage[];
    currentSlide: number;
    onSelect: (index: number) => void;
}) {
    const thumbnailsRef = useRef<HTMLDivElement | null>(null);
    const dragStartX = useRef<number | null>(null);

    const handleThumbMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        dragStartX.current = e.clientX;
        document.addEventListener("mousemove", handleThumbMouseMove);
        document.addEventListener("mouseup", handleThumbMouseUp);
    };

    const handleThumbMouseMove = (e: MouseEvent) => {
        if (dragStartX.current === null || !thumbnailsRef.current) return;
        const distance = dragStartX.current - e.clientX;
        thumbnailsRef.current.scrollLeft += distance;
        dragStartX.current = e.clientX;
    };

    const handleThumbMouseUp = () => {
        dragStartX.current = null;
        document.removeEventListener("mousemove", handleThumbMouseMove);
        document.removeEventListener("mouseup", handleThumbMouseUp);
    };

    const handleThumbTouchStart = (e: React.TouchEvent) => {
        dragStartX.current = e.touches[0].clientX;
    };

    const handleThumbTouchMove = (e: React.TouchEvent) => {
        if (dragStartX.current === null || !thumbnailsRef.current) return;
        const distance = dragStartX.current - e.touches[0].clientX;
        thumbnailsRef.current.scrollLeft += distance;
        dragStartX.current = e.touches[0].clientX;
    };

    const handleThumbTouchEnd = () => {
        dragStartX.current = null;
    };

    if (!imageArray || imageArray.length <= 1) return null;

    return (
        <div
            className="carousel-thumbnails"
            ref={thumbnailsRef}
            onMouseDown={handleThumbMouseDown}
            onTouchStart={handleThumbTouchStart}
            onTouchMove={handleThumbTouchMove}
            onTouchEnd={handleThumbTouchEnd}
        >
            {imageArray.map((img, index) => (
                <img
                    key={img.id}
                    src={img.imageUrl}
                    alt={`Imagen ${img.index}`}
                    className={`thumbnail ${index === currentSlide ? "active" : ""}`}
                    onClick={() => onSelect(index)}
                />
            ))}
        </div>
    );
}