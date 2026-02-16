// src/types/business-sections.ts

export type BusinessSectionKind =
    | "hero"
    | "text"
    | "features"
    | "productive"
    | "gallery"
    | "cta";

export type BusinessSectionBase<K extends BusinessSectionKind, D> = {
    id: string;      // uuid
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
        body: string; // markdown simple o texto plano (por ahora)
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
            icon?: string; // si después querés mapear a lucide
        }>;
    }
>;

//ESTO ES LO QUE TENGO AHORA /////////////////////////////////////////////////////
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
            mediaId: number;      // CloudinaryImage.id
            alt?: string;         // override opcional
        }>
        ;
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
        href?: string; // whatsapp, mailto, etc.
    }
>;

export type BusinessSection =
    | BusinessHeroSection
    | BusinessTextSection
    | BusinessFeaturesSection
    | BusinessProductiveSection
    | BusinessGallerySection
    | BusinessCTASection;

export type BusinessPageContent = BusinessSection[];

