import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {  // Usar POST en lugar de GET
    try {
        // Obtener el `public_id` desde el cuerpo de la solicitud
        const { publicId } = await req.json();
        const timestamp = Math.floor(Date.now() / 1000);
        const apiSecret = process.env.CLOUDINARY_API_SECRET!;

        // Crear la cadena para firmar, incluyendo el `public_id` y `timestamp`
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

        console.log("String to sign:", stringToSign);

        // Crear la firma usando el `apiSecret` y la cadena
        const signature = crypto
            .createHash("sha1")
            .update(stringToSign)
            .digest("hex");

        // Respuesta con la firma generada
        const res = {
            signature,
            timestamp,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME
        };

        return NextResponse.json(res);
    } catch (error) {
        console.error("Error generating signature:", error);
        return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
    }
}






