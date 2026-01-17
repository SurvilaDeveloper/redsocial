// src/app/security/device-disabled/page.tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Página informativa: "Dispositivo deshabilitado".
 *
 * ¿Para qué existe?
 * - Muestra un mensaje simple de confirmación cuando un dispositivo
 *   ya fue revocado correctamente.
 *
 * ¿Cuándo se usa?
 * - Este componente NO participa del flujo B actual (page + POST).
 * - Fue diseñado originalmente para el flujo A:
 *     GET /api/security/devices/disable?token=...
 *     -> backend revoca
 *     -> redirect a /security/device-disabled
 *
 * Estado actual del sistema:
 * - El flujo activo es B:
 *     /security/devices/disable/page.tsx
 *     (esa page hace POST y muestra success/error inline)
 *
 * Por lo tanto:
 * - Esta página es opcional.
 * - Puede mantenerse como fallback / legacy / redirect futuro.
 * - No es llamada actualmente por el flujo principal.
 *
 * ¿Conviene borrarla?
 * - NO es urgente.
 * - Puede servir si en el futuro:
 *     - volvés a usar redirects desde backend
 *     - querés una URL "limpia" de confirmación final
 */
export default function DeviceDisabledPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-xl">
                        Dispositivo deshabilitado
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        El dispositivo fue revocado correctamente y ya no podrá
                        volver a iniciar sesión.
                    </p>

                    <p className="text-sm text-muted-foreground">
                        Si no reconocés esta actividad, te recomendamos cambiar
                        tu contraseña lo antes posible.
                    </p>

                    <div className="flex flex-col gap-2 pt-4">
                        <Button asChild>
                            <Link href="/">Ir al inicio</Link>
                        </Button>

                        <Button variant="outline" asChild>
                            <Link href="/account">
                                Revisar seguridad de la cuenta
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


