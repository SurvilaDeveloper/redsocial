// src/app/security/devices/page.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";



type Device = {
    id: number;
    name: string;
    browser: string;
    os: string;
    lastUsedAt: string;
    createdAt: string;
    revoked: boolean;
};

export default function SecurityDevicesPage() {
    const { toast } = useToast();
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/security/devices");
            const data = await res.json();
            setDevices(data.devices);
        } catch (err) {
            console.error(err);
            toast({
                title: "Error",
                description: "No se pudieron cargar los dispositivos",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const handleDisable = async (deviceId: number) => {
        try {
            const res = await fetch("/api/security/devices/disable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceId }),
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Dispositivo revocado" });
                fetchDevices(); // refrescar lista
            } else {
                toast({ title: "Error", description: data.error, variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "No se pudo revocar", variant: "destructive" });
        }
    };

    const handleEnable = async (deviceId: number) => {
        try {
            const res = await fetch("/api/security/devices/enable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceId }),
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Dispositivo confiable nuevamente" });
                fetchDevices();
            } else {
                toast({ title: "Error", description: data.error, variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "No se pudo habilitar el dispositivo", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-4 p-4">
            <h1 className="text-2xl font-bold">Otros dispositivos</h1>
            {loading ? (
                <p>Cargando dispositivos...</p>
            ) : devices.length === 0 ? (
                <p>No se encontraron otros dispositivos.</p>
            ) : (
                devices.map((device) => (
                    <Card key={device.id}>
                        <CardHeader>
                            <CardTitle>{device.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <div className="space-y-1">
                                <p>Último uso: {new Date(device.lastUsedAt).toLocaleString()}</p>
                                <p>Creado: {new Date(device.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={device.revoked ? "destructive" : "secondary"}>
                                    {device.revoked ? "Revocado" : "Activo"}
                                </Badge>
                                {!device.revoked && (
                                    <Button size="sm" variant="outline" onClick={() => handleDisable(device.id)}>
                                        Revocar
                                    </Button>
                                )}
                                {device.revoked && (
                                    <Button size="sm" onClick={() => handleEnable(device.id)}>
                                        Volver a confiar
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}

