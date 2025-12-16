export default function Main({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div id="main" className="main">
            {children}
        </div>
    )
}