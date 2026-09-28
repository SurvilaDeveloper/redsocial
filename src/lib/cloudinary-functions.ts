// src/lib/cloudinary-functions.ts

const AUTHENTICATED_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const LISTING_IMAGE_MAX_BYTES = 15 * 1024 * 1024;
const LISTING_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

const AUTHENTICATED_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const LISTING_VIDEO_MIME_TYPES = new Set([
    "video/mp4",
    "video/webm",
    "video/quicktime",
]);

export class CloudinaryUploadError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "CloudinaryUploadError";
        this.status = status;
    }
}

export function validateAuthenticatedImageFile(file: File) {
    if (!AUTHENTICATED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
        throw new CloudinaryUploadError(
            "Formato no permitido. Usa JPEG, PNG o WebP.",
            400
        );
    }

    if (file.size <= 0) {
        throw new CloudinaryUploadError(
            "El archivo está vacío.",
            400
        );
    }

    if (file.size > AUTHENTICATED_IMAGE_MAX_BYTES) {
        throw new CloudinaryUploadError(
            "La imagen supera el límite de 8 MB.",
            413
        );
    }
}

export function validateListingMediaFile(file: File) {
    const mime = file.type.toLowerCase();

    if (file.size <= 0) {
        throw new CloudinaryUploadError(
            "El archivo está vacío.",
            400
        );
    }

    if (AUTHENTICATED_IMAGE_MIME_TYPES.has(mime)) {
        if (file.size > LISTING_IMAGE_MAX_BYTES) {
            throw new CloudinaryUploadError(
                "La imagen supera el límite de 15 MB.",
                413
            );
        }
        return;
    }

    if (LISTING_VIDEO_MIME_TYPES.has(mime)) {
        if (file.size > LISTING_VIDEO_MAX_BYTES) {
            throw new CloudinaryUploadError(
                "El video supera el límite de 50 MB.",
                413
            );
        }
        return;
    }

    throw new CloudinaryUploadError(
        "Formato no permitido. Usa JPEG, PNG, WebP, MP4, WebM o MOV.",
        400
    );
}

export function getCloudinaryUploadErrorMessage(
    error: unknown,
    fallback: string
) {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
}

export function isCloudinaryUnauthorizedError(error: unknown) {
    return (
        error instanceof CloudinaryUploadError &&
        error.status === 401
    );
}

async function readJsonSafely(res: Response) {
    return res.json().catch(() => null);
}

function createUploadError(
    res: Response,
    data: any,
    fallback: string
) {
    if (res.status === 401) {
        return new CloudinaryUploadError(
            "Tu sesión venció. Iniciá sesión nuevamente para continuar.",
            401
        );
    }

    return new CloudinaryUploadError(
        data?.error || fallback,
        res.status
    );
}

export async function uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-profile-image", {
        method: "POST",
        body: formData,
    });

    const data = await readJsonSafely(res);

    if (!res.ok) {
        console.error("Error upload-profile-image:", data);
        throw createUploadError(
            res,
            data,
            "Error subiendo imagen de perfil"
        );
    }

    return {
        url: data.url as string,
        publicId: data.publicId as string,
    };
}

export async function uploadPostImage(file: File) {
    validateAuthenticatedImageFile(file);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-post-image", {
        method: "POST",
        body: formData,
    });

    const data = await readJsonSafely(res);

    if (!res.ok) {
        console.error("Error upload-post-image:", data);
        throw createUploadError(
            res,
            data,
            "Error subiendo imagen"
        );
    }

    return {
        url: data.url as string,
        publicId: data.publicId as string,
    };
}

export async function uploadSiteImage(file: File) {
    validateAuthenticatedImageFile(file);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-site-image", {
        method: "POST",
        body: formData,
    });

    const data = await readJsonSafely(res);

    if (!res.ok) {
        console.error("Error upload-site-image:", data);
        throw createUploadError(
            res,
            data,
            "Error subiendo imagen del sitio"
        );
    }

    return {
        url: data.url as string,
        publicId: data.publicId as string,
        thumbUrl: (data.thumbUrl as string | undefined) ?? undefined,
    };
}
