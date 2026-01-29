//src/app/(pages)/mywall/layout.tsx
import { getValidatedSession } from "@/lib/auth/getValidatedSession";
import { redirect } from "next/navigation";
import Navbar from "@/components/custom/navbar";

export default async function MyWallLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const validatedSession = await getValidatedSession();

    if (validatedSession.status != "ok") {
        redirect("/");
    }

    return <div
        id="my-wall-layout"
        className="
                flex flex-col
                min-h-[calc(100vh-3.5rem)]
                lg:min-h-[calc(100vh-4rem)]
                text-slate-100
                w-full
                lg:max-w-[33%]
                lg:min-w-[400px]
                lg:w-full
            ">
        <Navbar />
        {children}
    </div>;
}