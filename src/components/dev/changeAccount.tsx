import { EllipsisVertical } from "lucide-react"
import { Button } from "../ui/button"
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "../ui/menubar"
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { loginAction } from "@/actions/auth-action";


type User = {
    id: number;
    name: string;
    email: string;
};

const ChangeAccount = () => {

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch("/api/change-account");
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error("Error al obtener usuarios:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
    }, []);



    const onClickHandle = async (email: string, password: string) => {
        await signOut()
        await loginAction({ email, password });
    };


    return (
        <div>


            <Menubar className="border-none">
                <MenubarMenu>
                    <MenubarTrigger className="flex flex-col justify-center items-center">
                        <span>Cambiar de Cuenta</span>
                    </MenubarTrigger>
                    <MenubarContent className="bg-white rounded-[6px]">
                        {users.map((value, index) => {
                            return (
                                <MenubarItem key={index} onClick={() => { onClickHandle(value.email, "1234") }}>
                                    {value.name}
                                </MenubarItem>
                            )
                        })}

                    </MenubarContent>
                </MenubarMenu>
            </Menubar>

        </div>
    )
}

export default ChangeAccount