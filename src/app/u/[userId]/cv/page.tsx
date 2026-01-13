// src/app/u/[userId]/cv/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { CVPreviewSheet } from "@/components/cv/CVPreviewSheet";
import type { Curriculum } from "@/types/cv";

type RemoteOk = { cv: Curriculum };
type RemoteErr = { error: string };

async function resolveBaseUrl() {
    // 1) Preferimos env si existe
    const envBase = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
    if (envBase) return envBase;

    // 2) Fallback server-side (Next App Router)
    const h = await headers();

    const proto =
        h.get("x-forwarded-proto") ??
        (process.env.NODE_ENV === "production" ? "https" : "http");

    const host =
        h.get("x-forwarded-host") ??
        h.get("host");

    if (!host) {
        throw new Error("Cannot resolve host for base URL");
    }

    return `${proto}://${host}`;
}

async function getCv(userId: string): Promise<Curriculum | "forbidden" | null> {
    const base = await resolveBaseUrl();
    const url = `${base}/api/users/${userId}/cv/view`;

    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 404) return null;
    if (res.status === 403) return "forbidden";
    if (!res.ok) throw new Error("Failed to fetch CV");

    const data = (await res.json()) as { cv?: Curriculum };
    return data?.cv ?? null;
}


export default async function Page({ params }: { params: { userId: string } }) {
    const cv = await getCv(params.userId);

    if (cv === null) notFound();

    if (cv === "forbidden") {
        return (
            <div className="mx-auto max-w-2xl p-6">
                <h1 className="text-xl font-semibold">CV no disponible</h1>
                <p className="mt-2 text-muted-foreground">
                    Este CV no está publicado o no tenés permisos para verlo.
                </p>
            </div>
        );
    }

    return (
        <div className="flex justify-center p-6">
            <CVPreviewSheet cv={cv} />
        </div>
    );
}

