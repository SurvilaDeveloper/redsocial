//src/app/(pages)/editaccount/layout.tsx
import { getValidatedSession } from "@/lib/auth/getValidatedSession";
import { redirect } from "next/navigation";
import Navbar from "@/components/custom/navbar";

export default async function EditAccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const validatedSession = await getValidatedSession();

    if (validatedSession.status != "ok") {
        redirect("/");
    }

    return <div>
        <Navbar />
        {children}
    </div>;
}