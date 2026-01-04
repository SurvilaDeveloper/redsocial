// src/components/custom/profilepicture.tsx
"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";

const ProfilePicture = () => {
    const { data: session } = useSession();

    const src = session?.user?.image || "/user.jpg";

    return (
        <div className="w-8 h-8 relative overflow-hidden rounded-full">
            <Image
                src={src}
                alt="Profile Picture"
                fill
                sizes="32px"
                className="object-cover rounded-full"
            />
        </div>
    );
};

export default ProfilePicture;


