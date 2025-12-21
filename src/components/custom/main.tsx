// src/components/custom/main.tsx

export default function Main({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main
            id="main"
            className="
                flex-1
                w-full
                flex
                justify-center
                pt-6
            "
        >
            <div
                className="
                    w-full
                    max-w-6xl        /* ancho máximo del contenido */
                    px-2 sm:px-4 
                    md:px-6 lg:px-8   /* padding lateral según breakpoint */
                    py-4 md:py-6      /* padding vertical */
                "
            >
                {children}
            </div>
        </main>
    );
}
