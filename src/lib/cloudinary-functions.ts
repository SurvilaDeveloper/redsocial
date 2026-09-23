//src/lib/cloudinary-functions.ts
export async function uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-profile-image", {
        method: "POST",
        body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
        console.error("Error upload-profile-image:", data);
        throw new Error(data?.error || "Error subiendo imagen de perfil");
    }

    return {
        url: data.url as string,
        publicId: data.publicId as string,
    };
}


export async function uploadPostImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-post-image", {
        method: "POST",
        body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
        console.error("Error upload-post-image:", data);
        throw new Error(data?.error || "Error subiendo imagen");
    }

    return {
        url: data.url as string,
        publicId: data.publicId as string,
    };
}

export async function uploadSiteImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-site-image", {
        method: "POST",
        body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
        console.error("Error upload-site-image:", data);
        throw new Error(data?.error || "Error subiendo imagen del sitio");
    }

    return {
        url: data.url as string,
        publicId: data.publicId as string,
        thumbUrl: (data.thumbUrl as string | undefined) ?? undefined,
    };
}
