"use client";

import { useEffect, useState } from "react";
import ProfileForm from "./editProfileForm";
import { useSession } from "next-auth/react";

interface User {
    nick: string,
    bio: string,
    phoneNumber: string,
    movilNumber: string,
    birthday: Date,
    occupation: string,
    company: string,
    twitterHandle: string,
    facebookHandle: string,
    instagramHandle: string,
    linkedinHandle: string,
    githubHandle: string,
    youtubeHandle: string,
    country: string,
    province: string,
    city: string,
    street: string,
    number: string,
    department: string,
    mailCode: string,
}

const EditProfile = () => {
    const [userData, setUserData] = useState<User | null>(null);
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== "authenticated") return; // Evita ejecutar la petición si la sesión aún no está cargada

        const fetchData = async () => {
            try {
                const res = await fetch("/api/user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: session.user.email }),
                });

                if (!res.ok) {
                    throw new Error("Error fetching user data");
                }

                const result = await res.json();
                console.log(result);
                setUserData(result.user);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [session, status]); // Se ejecuta solo cuando la sesión está autenticada

    return (
        <div className="pb-10">
            {userData && <ProfileForm user={userData} />}
        </div>
    );
};

export default EditProfile;

