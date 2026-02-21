// src/app/t/[templateId]/page.tsx
import { redirect } from "next/navigation";

export default async function TemplateRootPage({
    params,
}: {
    params: Promise<{ templateId: string }>;
}) {
    const { templateId } = await params;
    redirect(`/t/${templateId}/home`);
}

