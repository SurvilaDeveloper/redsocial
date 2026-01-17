//src/app/security/devices/disable/layout.tsx
import { getValidatedSession } from "@/lib/auth/getValidatedSession";
import { redirect } from "next/navigation";

export default async function DisableDeviceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const validatedSession = await getValidatedSession();

    if (validatedSession.status != "ok") {
        redirect("/");
    }

    return <div className="">
        {children}
    </div>;
}