//src/app/studio/business/new/page.tsx
import auth from "@/auth";
import { redirect } from "next/navigation";
import { BusinessCreateForm } from "@/components/business/editor/BusinessCreateForm";

export default async function BusinessNewPage() {
    const session = await auth();
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) redirect("/api/auth/signin");

    return <BusinessCreateForm />;
}
