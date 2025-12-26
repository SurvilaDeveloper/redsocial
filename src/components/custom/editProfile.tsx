// src/components/custom/editProfile.tsx
"use client";

import ProfileForm from "./editProfileForm";
import { ProfileMe } from "@/types/profile";


export default function EditProfile({
    initialUser,
}: {
    initialUser: ProfileMe;
}) {
    return <ProfileForm user={initialUser} />;
}




