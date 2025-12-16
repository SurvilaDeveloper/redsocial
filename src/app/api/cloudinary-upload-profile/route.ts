import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

async function _signature() {
    const timestamp = Math.floor(Date.now() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const folder = "Users"; // Especifica la carpeta donde guardar las imágenes

    // Generar la firma incluyendo la carpeta
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

    return { signature, timestamp, apiKey, cloudName, folder };
}

export async function POST(req: NextRequest) {

}