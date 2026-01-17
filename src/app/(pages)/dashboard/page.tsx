import { auth } from "@/auth";
import { LogoutButton } from "@/components/custom/logoutButton";

export default async function DashboardPage() {
    const session = await auth(); // ya está garantizado por layout, pero lo podés usar para datos

    return (
        <div className="container mx-auto p-6">
            <pre className="rounded-md bg-slate-950 p-4 text-slate-100 overflow-auto">
                {JSON.stringify(session, null, 2)}
            </pre>
            <div className="mt-4">
                <LogoutButton />
            </div>
        </div>
    );
}