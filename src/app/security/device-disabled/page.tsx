// src/app/security/device-disabled/page.tsx

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

