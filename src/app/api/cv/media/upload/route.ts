// src/app/api/cv/media/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id ? Number(session.user.id) : null;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file");
        const curriculumIdRaw = formData.get("curriculumId");
        const curriculumId = Number(curriculumIdRaw);

        if (!Number.isFinite(curriculumId) || curriculumId <= 0) {
            return NextResponse.json({ error: "curriculumId inválido" }, { status: 400 });
        }

        // Validar que el CV sea del usuario (aunque sea 1 CV por user)
        const cv = await prisma.curriculum.findFirst({
            where: { id: curriculumId, userId },
            select: { id: true },
        });
        if (!cv) return NextResponse.json({ error: "CV no encontrado" }, { status: 404 });

        if (!(file instanceof Blob)) {
            return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // Procesado opcional (normaliza EXIF, baja peso, etc.)
        const processedBuffer = await sharp(inputBuffer)
            .rotate()
            .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 82 })
            .toBuffer();

        // Un solo upload: Cloudinary devuelve secure_url, public_id, etc.
        const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: `cv/${userId}/${curriculumId}`,
                    resource_type: "image",

                    // Opcional: que Cloudinary genere thumb y te lo devuelva en el response
                    eager: [
                        {
                            width: 160,
                            height: 160,
                            crop: "fill",
                            gravity: "auto",
                            quality: "auto",
                            fetch_format: "auto",
                        },
                    ],
                    eager_async: false,
                },
                (error, result) => {
                    if (error || !result) return reject(error || new Error("Upload failed"));
                    resolve(result);
                }
            );
            stream.end(processedBuffer);
        });

        const url = String(uploadResult.secure_url);
        const publicId = String(uploadResult.public_id);
        const thumbUrl =
            uploadResult?.eager?.[0]?.secure_url ? String(uploadResult.eager[0].secure_url) : null;

        const media = await prisma.curriculumMedia.create({
            data: {
                userId,
                curriculumId,
                url,
                publicId,
                thumbUrl,
                status: "active",
            },
            select: {
                id: true,
                url: true,
                publicId: true,
                thumbUrl: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ media });
    } catch (err) {
        console.error("cv/media/upload error:", err);
        return NextResponse.json(
            { error: "Error subiendo/guardando la imagen" },
            { status: 500 }
        );
    }
}
