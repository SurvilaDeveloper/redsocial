import { auth } from "@/auth"
import { LogoutButton } from "@/components/custom/logoutButton"

const AdminPage = async () => {

    const session = await auth();

    if (session?.user?.role != "admin") {
        return (
            <>
                <h1>Admin page no authorized</h1>
                <p>
                    Usted no es administrador
                </p>
                <LogoutButton />
            </>
        )


    }
    return (
        <div>
            <h1>AdminPage</h1>
            <LogoutButton />
        </div>

    )
}

export default AdminPage