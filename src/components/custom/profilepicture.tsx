"use client"

import { Session } from 'next-auth';
import Image from 'next/image';

const ProfilePicture = ({ session }: { session: Session }) => {
    return (
        <div className="w-8 aspect-square relative overflow-hidden rounded-full">
            <Image
                src={session?.user?.image || '/user.jpg'} // URL de la imagen o un placeholder
                alt="Profile Picture"
                width={32} // Ajusta el tamaño según lo necesario
                height={32}
                className="rounded-full"
            />
        </div>
    );
};

export default ProfilePicture;
