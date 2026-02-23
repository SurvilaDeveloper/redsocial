// src/types/business-sections.ts

export type BusinessSectionKind =
    | "hero"
    | "text"
    | "features"
    | "productive"
    | "gallery"
    | "cta"
    | "contactForm";

export type BusinessSectionBase<K extends BusinessSectionKind, D> = {
    id: string; // uuid
    kind: K;
    data: D;
};

export type BusinessHeroSection = BusinessSectionBase<
    "hero",
    {
        title: string;
        subtitle?: string;
        align?: "left" | "center";
    }
>;

export type BusinessTextSection = BusinessSectionBase<
    "text",
    {
        title?: string;
        body: string;
    }
>;

export type BusinessFeaturesSection = BusinessSectionBase<
    "features",
    {
        title?: string;
        columns?: 1 | 2 | 3;
        items: Array<{
            title: string;
            text?: string;
            icon?: string;
        }>;
    }
>;

export type BusinessProductiveSection = BusinessSectionBase<
    "productive",
    {
        title?: string;
        type: "product" | "service";
        items: Array<{
            title: string;
            listingId: number;
            text?: string;
        }>;
    }
>;

export type BusinessGallerySection = BusinessSectionBase<
    "gallery",
    {
        title?: string;
        swiper?: string;
        images: Array<{
            mediaId: number;
            alt?: string;
        }>;
        columns?: 1 | 2 | 3 | 4;
        width?: "25%" | "33%" | "50%" | "66%" | "75%" | "83%" | "100%";
        minWidth?: "320px" | "384px" | "512px" | "640px" | "768px" | "1024px";
    }
>;

export type BusinessCTASection = BusinessSectionBase<
    "cta",
    {
        title: string;
        text?: string;
        buttonText?: string;
        href?: string;
    }
>;

/**
 * ✅ NUEVO: sección de formulario de contacto
 * - Se renderiza en público como <BusinessContactSection />
 * - En editor solo tiene un “placeholder” simple.
 */
export type BusinessContactFormSection = BusinessSectionBase<
    "contactForm",
    {
        title?: string; // opcional (ej: "Contacto")
        description?: string; // opcional (texto arriba del form)
    }
>;

export type BusinessSection =
    | BusinessHeroSection
    | BusinessTextSection
    | BusinessFeaturesSection
    | BusinessProductiveSection
    | BusinessGallerySection
    | BusinessCTASection
    | BusinessContactFormSection;

export type BusinessPageContent = BusinessSection[];