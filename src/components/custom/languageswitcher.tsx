"use client";
import Image from "next/image";
import { Languages } from "lucide-react";
import { useGlobalContext } from "@/context/globalcontext"; // Asegúrate de importar correctamente el contexto

const LanguageSwitcher = () => {
    const { l, setL } = useGlobalContext();

    return (
        <div className="flex items-center">
            <button
                onClick={() => setL(l === "sp" ? "en" : "sp")}
                className="flex"
            >
                <Languages className="w-6 h-6 text-gray-700 hover:text-black" />
                <span>:{l}</span>
            </button>
        </div>
    );
};

export default LanguageSwitcher;
