import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
    try {
        const data = await req.formData();
        const file = data.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadedImage = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: "profile_pictures" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        return NextResponse.json({ url: (uploadedImage as any).secure_url });
    } catch (error) {
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
