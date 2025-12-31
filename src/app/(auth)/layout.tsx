

const AuthLayout = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    return (
        <div id="authLayout" className=" bg-black items-center flex flex-col h-screen w-full">
            <div className="bg-slate-700 p-4 rounded-lg shadow-lg w-full max-w-md">
                {children}
            </div>
        </div>

    )
}

export default AuthLayout

