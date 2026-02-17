// src/app/b/[slug]/page.tsx
import { redirect } from "next/navigation";

export default async function BusinessRootPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    redirect(`/b/${slug}/home`);
}