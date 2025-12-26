// src/components/custom/editAccount.tsx
"use client";

import AccountForm from "./editAccountForm";
import { Configuration } from "@/types/configuration";


export default function EditProfile({
    config,
}: {
    config: Configuration;
}) {
    return <AccountForm config={config} />;
}