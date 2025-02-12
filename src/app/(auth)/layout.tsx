

const AuthLayout = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    return (
        <div className=" bg-red-200 justify-center items-center flex flex-col h-screen w-full">
            <h1>AuthLayout</h1>
            <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md min-h-[80%]">
                {children}
            </div>
        </div>

    )
}

export default AuthLayout

