export default function Main({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div id="main" className="flex flex-col w-full items-center md:pt-12 pt-10 h-screen">
            {children}
        </div>
    )
}