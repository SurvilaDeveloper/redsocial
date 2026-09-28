// src/lib/cloudinary-upload-security.ts
import sharp, { type Metadata } from "sharp";
import cloudinary from "@/lib/cloudinary";

export const AUTHENTICATED_IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8 MiB
export const AUTHENTICATED_IMAGE_MAX_PIXELS = 25_000_000; // 25 MP
export const AUTHENTICATED_IMAGE_MAX_REQUEST_BYTES =
    AUTHENTICATED_IMAGE_MAX_BYTES + 1024 * 1024;

export const LISTING_IMAGE_MAX_BYTES = 15 * 1024 * 1024; // 15 MiB
export const LISTING_VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MiB
export const LISTING_MEDIA_MAX_REQUEST_BYTES =
    LISTING_VIDEO_MAX_BYTES + 2 * 1024 * 1024;

const ALLOWED_MIME_TO_FORMAT = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
} as const;

const LISTING_VIDEO_MIME_TYPES = new Set([
    "video/mp4",
    "video/webm",
    "video/quicktime",
]);

const ALLOWED_CLOUDINARY_VIDEO_FORMATS = new Set([
    "mp4",
    "webm",
    "mov",
]);

type AllowedMime = keyof typeof ALLOWED_MIME_TO_FORMAT;
type AllowedFormat = (typeof ALLOWED_MIME_TO_FORMAT)[AllowedMime];

export type CloudinaryResourceType = "image" | "video";

export class MediaUploadValidationError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "MediaUploadValidationError";
        this.status = status;
    }
}

export class ImageUploadValidationError extends MediaUploadValidationError {
    constructor(message: string, status = 400) {
        super(message, status);
        this.name = "ImageUploadValidationError";
    }
}

export class VideoUploadValidationError extends MediaUploadValidationError {
    constructor(message: string, status = 400) {
        super(message, status);
        this.name = "VideoUploadValidationError";
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

export type ValidatedVideoUpload = {
    inputBuffer: Buffer;
    mime: "video/mp4" | "video/webm" | "video/quicktime";
    container: "iso-bmff" | "webm";
    size: number;
};

export type CloudinaryUploadedImage = {
    secure_url: string;
    public_id: string;
};

export type CloudinaryUploadedImageWithEager =
    CloudinaryUploadedImage & {
        eager: Array<{
            secure_url?: string;
        }>;
    };

export type CloudinaryUploadedVideo = {
    secure_url: string;
    public_id: string;
    format: string | null;
    duration: number | null;
};

function formatMiB(bytes: number) {
    return Math.round(bytes / (1024 * 1024));
}

function assertContentLengthBelow(
    contentLengthHeader: string | null,
    maxRequestBytes: number,
    ErrorType: typeof MediaUploadValidationError
) {
    if (!contentLengthHeader) return;

    const contentLength = Number(contentLengthHeader);

    if (
        Number.isFinite(contentLength) &&
        contentLength > maxRequestBytes
    ) {
        throw new ErrorType(
            "La solicitud supera el tamaño máximo permitido.",
            413
        );
    }
}

export function assertRequestSizeIsReasonable(
    contentLengthHeader: string | null
) {
    assertContentLengthBelow(
        contentLengthHeader,
        AUTHENTICATED_IMAGE_MAX_REQUEST_BYTES,
        ImageUploadValidationError
    );
}

export function assertListingMediaRequestSizeIsReasonable(
    contentLengthHeader: string | null
) {
    assertContentLengthBelow(
        contentLengthHeader,
        LISTING_MEDIA_MAX_REQUEST_BYTES,
        MediaUploadValidationError
    );
}

async function validateImageUpload(
    value: FormDataEntryValue | null,
    maxBytes: number
): Promise<ValidatedImageUpload> {
    if (!(value instanceof Blob)) {
        throw new ImageUploadValidationError("Archivo inválido.");
    }

    if (value.size <= 0) {
        throw new ImageUploadValidationError("El archivo está vacío.");
    }

    if (value.size > maxBytes) {
        throw new ImageUploadValidationError(
            `La imagen supera el límite de ${formatMiB(maxBytes)} MB.`,
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

    const expectedFormat =
        ALLOWED_MIME_TO_FORMAT[mime as AllowedMime];

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

export async function validateAuthenticatedImageUpload(
    value: FormDataEntryValue | null
) {
    return validateImageUpload(
        value,
        AUTHENTICATED_IMAGE_MAX_BYTES
    );
}

export async function validateListingImageUpload(
    value: FormDataEntryValue | null
) {
    return validateImageUpload(
        value,
        LISTING_IMAGE_MAX_BYTES
    );
}

function isIsoBmff(buffer: Buffer) {
    if (buffer.length < 12) return false;

    const boxType = buffer.toString("ascii", 4, 8);

    if (boxType !== "ftyp") return false;

    const boxSize = buffer.readUInt32BE(0);

    return (
        boxSize === 1 ||
        (boxSize >= 8 && boxSize <= buffer.length)
    );
}

function isWebm(buffer: Buffer) {
    if (buffer.length < 4) return false;

    const hasEbmlHeader =
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3;

    if (!hasEbmlHeader) return false;

    const probe = buffer
        .subarray(0, Math.min(buffer.length, 4096))
        .toString("latin1")
        .toLowerCase();

    return probe.includes("webm");
}

export async function validateListingVideoUpload(
    value: FormDataEntryValue | null
): Promise<ValidatedVideoUpload> {
    if (!(value instanceof Blob)) {
        throw new VideoUploadValidationError("Archivo inválido.");
    }

    if (value.size <= 0) {
        throw new VideoUploadValidationError("El archivo está vacío.");
    }

    if (value.size > LISTING_VIDEO_MAX_BYTES) {
        throw new VideoUploadValidationError(
            "El video supera el límite de 50 MB.",
            413
        );
    }

    const mime = value.type.toLowerCase();

    if (!LISTING_VIDEO_MIME_TYPES.has(mime)) {
        throw new VideoUploadValidationError(
            "Formato de video no permitido. Usa MP4, WebM o MOV."
        );
    }

    const inputBuffer = Buffer.from(await value.arrayBuffer());

    const isoBmff = isIsoBmff(inputBuffer);
    const webm = isWebm(inputBuffer);

    if (mime === "video/webm" && !webm) {
        throw new VideoUploadValidationError(
            "El contenido del archivo no coincide con un video WebM válido."
        );
    }

    if (
        (mime === "video/mp4" || mime === "video/quicktime") &&
        !isoBmff
    ) {
        throw new VideoUploadValidationError(
            "El contenido del archivo no coincide con un video MP4/MOV válido."
        );
    }

    return {
        inputBuffer,
        mime: mime as ValidatedVideoUpload["mime"],
        container: webm ? "webm" : "iso-bmff",
        size: value.size,
    };
}

export function isListingImageMime(mime: string) {
    return mime.toLowerCase() in ALLOWED_MIME_TO_FORMAT;
}

export function isListingVideoMime(mime: string) {
    return LISTING_VIDEO_MIME_TYPES.has(mime.toLowerCase());
}

export function isAllowedCloudinaryVideoFormat(
    format: string | null | undefined
) {
    if (!format) return false;

    return ALLOWED_CLOUDINARY_VIDEO_FORMATS.has(
        format.toLowerCase()
    );
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
                if (
                    error ||
                    !result?.secure_url ||
                    !result.public_id
                ) {
                    reject(
                        error ??
                            new Error(
                                "Cloudinary upload failed"
                            )
                    );
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

export async function uploadImageBufferToCloudinaryWithEager(
    buffer: Buffer,
    folder: string,
    eager: Array<Record<string, unknown>>
): Promise<CloudinaryUploadedImageWithEager> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                eager: eager as any,
                eager_async: false,
            },
            (error, result) => {
                if (
                    error ||
                    !result?.secure_url ||
                    !result.public_id
                ) {
                    reject(
                        error ??
                            new Error(
                                "Cloudinary upload failed"
                            )
                    );
                    return;
                }

                const eagerRows =
                    Array.isArray((result as any).eager)
                        ? (result as any).eager
                        : [];

                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                    eager: eagerRows.map((row: any) => ({
                        secure_url:
                            typeof row?.secure_url === "string"
                                ? row.secure_url
                                : undefined,
                    })),
                });
            }
        );

        stream.end(buffer);
    });
}

export async function uploadVideoBufferToCloudinary(
    buffer: Buffer,
    folder: string
): Promise<CloudinaryUploadedVideo> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "video",
            },
            (error, result) => {
                if (
                    error ||
                    !result?.secure_url ||
                    !result.public_id
                ) {
                    reject(
                        error ??
                            new Error(
                                "Cloudinary video upload failed"
                            )
                    );
                    return;
                }

                const rawDuration = Number(
                    (result as any).duration
                );

                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                    format:
                        typeof (result as any).format === "string"
                            ? String((result as any).format).toLowerCase()
                            : null,
                    duration:
                        Number.isFinite(rawDuration) &&
                        rawDuration >= 0
                            ? rawDuration
                            : null,
                });
            }
        );

        stream.end(buffer);
    });
}

export async function destroyCloudinaryAssetBestEffort(
    publicId: string,
    resourceType: CloudinaryResourceType
) {
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true,
        });
    } catch (error) {
        console.error(
            "Cloudinary rollback cleanup failed:",
            publicId,
            resourceType,
            error
        );
    }
}

export async function destroyCloudinaryImageBestEffort(
    publicId: string
) {
    await destroyCloudinaryAssetBestEffort(
        publicId,
        "image"
    );
}
