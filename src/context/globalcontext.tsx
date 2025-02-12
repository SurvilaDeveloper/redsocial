"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type GlobalContextType = {
    l: string;
    setL: (value: string) => void;
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
    const [l, setL] = useState("sp");

    return (
        <GlobalContext.Provider value={{ l, setL }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContext = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error("useGlobalContext debe usarse dentro de GlobalProvider");
    }
    return context;
};
