// src/app/studio/product-listing/new/page.tsx
import { redirect } from "next/navigation";
import auth from "@/auth";
import Navbar from "@/components/custom/navbar";
import { ProductListingEditor } from "@/components/productListing/editor/ProductListingEditor";
import BackToStudioBusiness from "@/components/custom/BackToStudioBusiness";

export default async function ProductListingCreatePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    return (
        <main className="mx-auto max-w-4xl px-4 py-8">
            <Navbar />

            <div className="mb-4">
                <BackToStudioBusiness label="Volver" />
            </div>

            <ProductListingEditor mode="create" />
        </main>
    );
}

