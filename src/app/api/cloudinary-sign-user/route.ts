import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
    const timestamp = Math.floor(Date.now() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const folder = "Users"; // Especifica la carpeta donde guardar las imágenes

    // Generar la firma incluyendo la carpeta
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

    return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder });
}