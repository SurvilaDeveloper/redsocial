//src/app/api/upload-service-listing-media/route.ts
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import auth from "@/auth";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const MAX_FILE_MB_IMAGE = 15;
const MAX_FILE_MB_VIDEO = 50;

function isLikelyImage(mime: string) {
    return mime.startsWith("image/");
}
function isLikelyVideo(mime: string) {
    return mime.startsWith("video/");
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof Blob)) {
            return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
        }

        const mime = (file as any)?.type ? String((file as any).type) : "";
        const sizeBytes = (file as any)?.size ? Number((file as any).size) : 0;

        if (!mime) {
            return NextResponse.json({ error: "No se detectó el tipo de archivo" }, { status: 400 });
        }

        const maxBytes = (isLikelyVideo(mime) ? MAX_FILE_MB_VIDEO : MAX_FILE_MB_IMAGE) * 1024 * 1024;
        if (sizeBytes > maxBytes) {
            return NextResponse.json(
                { error: `Archivo demasiado grande (máx ${isLikelyVideo(mime) ? MAX_FILE_MB_VIDEO : MAX_FILE_MB_IMAGE}MB)` },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // Carpetas cloudinary
        const folderMain = "service_listings";
        const folderThumb = "service_listings/thumbs";

        // ✅ VIDEO: subir tal cual (sin sharp)
        if (isLikelyVideo(mime)) {
            const uploadVideo = await new Promise<{ secure_url: string; public_id: string; format?: string; duration?: number }>(
                (resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: folderMain,
                            resource_type: "video",
                        },
                        (error, result) => {
                            if (error || !result) return reject(error || new Error("Upload failed"));
                            resolve({
                                secure_url: result.secure_url!,
                                public_id: result.public_id!,
                                format: (result as any).format,
                                duration: (result as any).duration,
                            });
                        }
                    );
                    stream.end(inputBuffer);
                }
            );

            return NextResponse.json({
                type: "video",
                url: uploadVideo.secure_url,
                publicId: uploadVideo.public_id,
                thumbUrl: null,
                thumbPublicId: null,
                format: uploadVideo.format ?? null,
                durationSec: typeof uploadVideo.duration === "number" ? Math.round(uploadVideo.duration) : null,
            });
        }

        // ✅ IMAGEN: main + thumb via sharp
        if (!isLikelyImage(mime)) {
            return NextResponse.json({ error: "Tipo de archivo no soportado" }, { status: 400 });
        }

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
                { folder: folderMain, resource_type: "image" },
                (error, result) => {
                    if (error || !result) return reject(error || new Error("Upload failed"));
                    resolve({ secure_url: result.secure_url!, public_id: result.public_id! });
                }
            );
            stream.end(mainBuffer);
        });

        const uploadThumb = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: folderThumb, resource_type: "image" },
                (error, result) => {
                    if (error || !result) return reject(error || new Error("Upload failed"));
                    resolve({ secure_url: result.secure_url!, public_id: result.public_id! });
                }
            );
            stream.end(thumbBuffer);
        });

        return NextResponse.json({
            type: "image",
            url: uploadMain.secure_url,
            publicId: uploadMain.public_id,
            thumbUrl: uploadThumb.secure_url,
            thumbPublicId: uploadThumb.public_id,
            format: "jpg",
            durationSec: null,
        });
    } catch (err) {
        console.error("upload-product-listing-media error:", err);
        return NextResponse.json({ error: "Error procesando/subiendo el archivo" }, { status: 500 });
    }
}
