"use client";

import { Button } from "@/components/ui/button";

export default function ShareButton() {
    const handleShare = () => {
        const text = "¡Mira esto! https://surviladeveloper.github.io/PLC_Dispositivos/";
        const message = encodeURIComponent(text);

        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (!isMobile) {
            window.open(
                `https://web.whatsapp.com/send?text=${message}`,
                "_blank",
                "noopener,noreferrer"
            );
            return;
        }

        let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

        const cancelFallback = () => {
            if (fallbackTimer) clearTimeout(fallbackTimer);
            fallbackTimer = null;
            cleanup();
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") cancelFallback();
        };

        const cleanup = () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("pagehide", cancelFallback);
            window.removeEventListener("blur", cancelFallback);
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("pagehide", cancelFallback);
        window.addEventListener("blur", cancelFallback);

        // Fallback: si no se abrió la app, mandalo a la web de WhatsApp
        fallbackTimer = setTimeout(() => {
            cleanup();
            window.location.href = `https://api.whatsapp.com/send?text=${message}`;
        }, 900);

        // Intento abrir la app
        window.location.href = `whatsapp://send?text=${message}`;
    };

    return (
        <Button type="button" onClick={handleShare}>
            Compartir en WhatsApp
        </Button>
    );
}

