// src/lib/cloudinary-upload-security.ts
import sharp, { type Metadata } from "sharp";
import cloudinary from "@/lib/cloudinary";

export const AUTHENTICATED_IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8 MiB
export const AUTHENTICATED_IMAGE_MAX_PIXELS = 25_000_000; // 25 MP
export const AUTHENTICATED_IMAGE_MAX_REQUEST_BYTES =
    AUTHENTICATED_IMAGE_MAX_BYTES + 1024 * 1024;

const ALLOWED_MIME_TO_FORMAT = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
} as const;

type AllowedMime = keyof typeof ALLOWED_MIME_TO_FORMAT;
type AllowedFormat = (typeof ALLOWED_MIME_TO_FORMAT)[AllowedMime];

export class ImageUploadValidationError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "ImageUploadValidationError";
        this.status = status;
    }
}

export type ValidatedImageUpload = {
    inputBuffer: Buffer;
    mime: AllowedMime;
    format: AllowedFormat;
    width: number;
    height: number;
    size: number;
};

export type CloudinaryUploadedImage = {
    secure_url: string;
    public_id: string;
};

export function assertRequestSizeIsReasonable(contentLengthHeader: string | null) {
    if (!contentLengthHeader) return;

    const contentLength = Number(contentLengthHeader);

    if (
        Number.isFinite(contentLength) &&
        contentLength > AUTHENTICATED_IMAGE_MAX_REQUEST_BYTES
    ) {
        throw new ImageUploadValidationError(
            "La solicitud supera el tamaño máximo permitido.",
            413
        );
    }
}

export async function validateAuthenticatedImageUpload(
    value: FormDataEntryValue | null
): Promise<ValidatedImageUpload> {
    if (!(value instanceof Blob)) {
        throw new ImageUploadValidationError("Archivo inválido.");
    }

    if (value.size <= 0) {
        throw new ImageUploadValidationError("El archivo está vacío.");
    }

    if (value.size > AUTHENTICATED_IMAGE_MAX_BYTES) {
        throw new ImageUploadValidationError(
            "La imagen supera el límite de 8 MB.",
            413
        );
    }

    const mime = value.type.toLowerCase();

    if (!(mime in ALLOWED_MIME_TO_FORMAT)) {
        throw new ImageUploadValidationError(
            "Formato no permitido. Usa JPEG, PNG o WebP."
        );
    }

    const inputBuffer = Buffer.from(await value.arrayBuffer());

    let metadata: Metadata;

    try {
        metadata = await sharp(inputBuffer, {
            failOn: "error",
            limitInputPixels: AUTHENTICATED_IMAGE_MAX_PIXELS,
        }).metadata();
    } catch {
        throw new ImageUploadValidationError(
            "La imagen no es válida o supera el límite de resolución."
        );
    }

    const expectedFormat = ALLOWED_MIME_TO_FORMAT[mime as AllowedMime];
    const actualFormat = metadata.format;

    if (actualFormat !== expectedFormat) {
        throw new ImageUploadValidationError(
            "El contenido del archivo no coincide con su tipo de imagen."
        );
    }

    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (width <= 0 || height <= 0) {
        throw new ImageUploadValidationError(
            "No se pudieron determinar las dimensiones de la imagen."
        );
    }

    const pixelCount = width * height;

    if (
        !Number.isSafeInteger(pixelCount) ||
        pixelCount > AUTHENTICATED_IMAGE_MAX_PIXELS
    ) {
        throw new ImageUploadValidationError(
            "La imagen supera el límite de 25 megapíxeles."
        );
    }

    return {
        inputBuffer,
        mime: mime as AllowedMime,
        format: actualFormat as AllowedFormat,
        width,
        height,
        size: value.size,
    };
}

export function createValidatedSharp(inputBuffer: Buffer) {
    return sharp(inputBuffer, {
        failOn: "error",
        limitInputPixels: AUTHENTICATED_IMAGE_MAX_PIXELS,
    });
}

export async function uploadImageBufferToCloudinary(
    buffer: Buffer,
    folder: string
): Promise<CloudinaryUploadedImage> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
            },
            (error, result) => {
                if (error || !result?.secure_url || !result.public_id) {
                    reject(error ?? new Error("Cloudinary upload failed"));
                    return;
                }

                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        );

        stream.end(buffer);
    });
}

export async function destroyCloudinaryImageBestEffort(publicId: string) {
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
            invalidate: true,
        });
    } catch (error) {
        console.error("Cloudinary rollback cleanup failed:", publicId, error);
    }
}
