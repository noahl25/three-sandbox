'use client'

import { AnimatePresence } from "motion/react";
import { createContext, ReactNode, useContext, useState } from "react";

const Popup = createContext<PopupContext | undefined>(undefined); 

export default function PopupProvider({ children }: { children: ReactNode }) {
    const [popup, setPopup] = useState<PopupElement | null>(null);
    return (
        <Popup.Provider value={{ showPopup: (popup: PopupElement) => setPopup(popup) }}>
            <AnimatePresence>
                {popup}
            </AnimatePresence>
            {children}
        </Popup.Provider>
    );
}

export const usePopup = () => {
    const context = useContext(Popup);
    if (!context) throw Error("Sign in context undefined.");
    return context;
}
