//src/app/(pages)/dashboard/layout.tsx
import { getValidatedSession } from "@/lib/auth/getValidatedSession";
import { redirect } from "next/navigation";
import Navbar from "@/components/custom/navbar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    //const session = await auth();
    const validatedSession = await getValidatedSession();

    if (validatedSession.status != "ok") {
        redirect("/");
    }

    return <div className="">
        <Navbar />
        {children}
    </div>;
}