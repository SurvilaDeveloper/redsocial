// src/components/custom/ImagesSwiper.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import PostImageCard from "./PostImageCard";

type NavigationMode = "thumbnails" | "dots" | "numbers";
type ImageReaction = "LIKE" | "UNLIKE" | null;

interface SwiperImage {
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

interface ImagesSwiperProps {
    id?: string;
    imageArray: SwiperImage[];
    navigation?: NavigationMode;
    sessionUserId: number | null;
}

export const ImagesSwiper: React.FC<ImagesSwiperProps> = ({
    id,
    imageArray,
    navigation = "thumbnails",
    sessionUserId,
}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);

    const dragStartX = useRef<number | null>(null);
    const dragStartY = useRef<number | null>(null);
    const isHorizontalDrag = useRef(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const thumbnailsRef = useRef<HTMLDivElement | null>(null);

    const [containerWidth, setContainerWidth] = useState(0);

    if (!imageArray || imageArray.length === 0) return null;

    // ==========================
    // Medir ancho del contenedor
    // ==========================
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const updateWidth = () => {
            setContainerWidth(el.clientWidth);
        };

        updateWidth();

        const ro = new ResizeObserver(() => {
            updateWidth();
        });
        ro.observe(el);

        window.addEventListener("resize", updateWidth);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", updateWidth);
        };
    }, []);

    // ==========================
    // Navegación básica
    // ==========================
    const goToSlide = (index: number) => {
        if (index < 0 || index >= imageArray.length) return;
        setCurrentSlide(index);
        setDragOffset(0);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) =>
            prev >= imageArray.length - 1 ? imageArray.length - 1 : prev + 1
        );
        setDragOffset(0);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev <= 0 ? 0 : prev - 1));
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
            if (Math.abs(dx) < thresh && Math.abs(dy) < thresh) {
                return;
            }

            if (Math.abs(dx) > Math.abs(dy)) {
                isHorizontalDrag.current = true;
            } else {
                dragStartX.current = null;
                dragStartY.current = null;
                setDragOffset(0);
                return;
            }
        }

        if (isHorizontalDrag.current) {
            // Ya no llamamos a preventDefault aquí
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

        setCurrentSlide(bestIndex);
        setDragOffset(0);
    };

    // ==========================
    // Drag en thumbnails (scroll)
    // ==========================
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

    // ==========================
    // Navegación inferior
    // ==========================
    const renderNavigation = () => {
        if (imageArray.length <= 1) return null;

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
                            className={`thumbnail ${index === currentSlide ? "active" : ""
                                }`}
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
                            className={`navigation-dot ${index === currentSlide ? "active" : ""
                                }`}
                            onClick={() => goToSlide(index)}
                        >
                            <span></span>
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
                        className={`navigation-numbers ${index === currentSlide ? "active" : ""
                            }`}
                        onClick={() => goToSlide(index)}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        );
    };

    // ==========================
    // Estilos del track
    // ==========================
    const trackStyle: React.CSSProperties = {
        transform: `translateX(${-currentSlide * containerWidth + dragOffset
            }px)`,
        transition:
            dragOffset === 0
                ? "transform 1.00s cubic-bezier(0.5, 0.6, 0.5, 1.2)"
                : "none",
    };

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
            }}
        >
            <div
                className="carousel-track"
                style={
                    containerWidth === 0
                        ? { opacity: 0 }
                        : { ...trackStyle, opacity: 1 }
                }
            >
                {imageArray.map((img, index) => (
                    <div
                        key={img.id}
                        className="carousel-slide-item"
                        style={{
                            width: containerWidth || "100%",
                        }}
                    >
                        {/* 👇 Usamos PostImageCard dentro del slide */}
                        <PostImageCard
                            image={img}
                            sessionUserId={sessionUserId}
                            // en el swiper queremos que todas sean "grandes"
                            isFirst={true}
                        />
                    </div>
                ))}
            </div>

            {/* Flechas */}
            {imageArray.length > 1 && currentSlide > 0 && (
                <button
                    className="nav-button prev"
                    onClick={prevSlide}
                    type="button"
                >
                    ‹
                </button>
            )}

            {imageArray.length > 1 &&
                currentSlide < imageArray.length - 1 && (
                    <button
                        className="nav-button next"
                        onClick={nextSlide}
                        type="button"
                    >
                        ›
                    </button>
                )}

            {renderNavigation()}
        </div>
    );
};



