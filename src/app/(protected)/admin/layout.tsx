// src/app/(protected)/admin/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Navbar from "@/components/custom/navbar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        redirect("/unauthorized");
    }

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <Navbar />
            <AdminSidebar />
            <main className="flex-1">{children}</main>
        </div>
    );
}

