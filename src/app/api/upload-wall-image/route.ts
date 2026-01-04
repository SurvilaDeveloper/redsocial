// src/app/api/upload-wall-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof Blob)) {
            return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        const processedBuffer = await sharp(inputBuffer)
            .rotate()
            .resize(256, null, { withoutEnlargement: true }) // máx 256px de ancho
            .jpeg({ quality: 80 }) // compresión
            .toBuffer();

        const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
            (resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "users",
                        resource_type: "image",
                    },
                    (error, result) => {
                        if (error || !result) return reject(error || new Error("Upload failed"));
                        resolve({ secure_url: result.secure_url!, public_id: result.public_id! });
                    }
                );
                stream.end(processedBuffer);
            }
        );

        return NextResponse.json({ url: uploadResult.secure_url, publicId: uploadResult.public_id });
    } catch (err) {
        console.error("upload-profile-image error:", err);
        return NextResponse.json({ error: "Error procesando/subiendo la imagen" }, { status: 500 });
    }
}