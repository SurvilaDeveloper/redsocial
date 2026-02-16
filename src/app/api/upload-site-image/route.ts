//src/app/api/upload-site-image/route.ts
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

        // ✅ “sites”: pensado para gallery (no 256px como posts)
        // - normal: máx 1600px ancho
        // - thumb: 360px ancho (para editor/picker)
        const mainBuffer = await sharp(inputBuffer)
            .resize(1600, null, { withoutEnlargement: true })
            .jpeg({ quality: 82 })
            .toBuffer();

        const thumbBuffer = await sharp(inputBuffer)
            .resize(360, 360, { fit: "cover" })
            .jpeg({ quality: 75 })
            .toBuffer();

        const uploadMain = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "sites",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error || !result) return reject(error || new Error("Upload failed"));
                    resolve({ secure_url: result.secure_url!, public_id: result.public_id! });
                }
            );
            stream.end(mainBuffer);
        });

        const uploadThumb = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "sites/thumbs",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error || !result) return reject(error || new Error("Upload failed"));
                    resolve({ secure_url: result.secure_url!, public_id: result.public_id! });
                }
            );
            stream.end(thumbBuffer);
        });

        return NextResponse.json({
            url: uploadMain.secure_url,
            publicId: uploadMain.public_id,
            thumbUrl: uploadThumb.secure_url,
            thumbPublicId: uploadThumb.public_id,
        });
    } catch (err) {
        console.error("upload-site-image error:", err);
        return NextResponse.json({ error: "Error procesando/subiendo la imagen" }, { status: 500 });
    }
}
