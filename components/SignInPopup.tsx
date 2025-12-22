'use client'

import { motion } from "motion/react";
import Image from "next/image";
import { createContext, ReactNode, useContext, useState } from "react";
import { oauthClient } from "@/lib/auth/client"
import { usePathname } from "next/navigation";

const SignInContext = createContext<SignInContext | undefined>(undefined);

const signIn = async (callbackURL: string) => {
    try {
        await oauthClient.signIn.social({
            provider: "google",
            callbackURL
        });
    } catch (err: unknown) {

    }
}

const SignInPopup = ({ onClose }: { onClose: () => void }) => {

    const pathname = usePathname();

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 backdrop-blur-sm z-10000 text-stone-300">
            <div onClick={(e) => e.stopPropagation()} className="absolute left-1/2 top-1/2 -translate-x-1/2 flex flex-col items-center gap-4 -translate-y-1/2 w-7/8 sm:w-[400px] p-5 rounded-xl bg-gray-950">
                <p className="text-xl text-center w-full">Sign in to Three-Sandbox</p>
                <div onClick={() => signIn(pathname)} className="cursor-pointer w-full h-[40px] w-[200px] bg-white gap-3 rounded-lg flex items-center justify-center">
                    <Image src="/google.png" alt="Google logo" width={20} height={20}/>
                    <p className="text-black text-lg relative -translate-y-[0.5px]">Continue with Google</p>
                </div>
                <div onClick={onClose} className="cursor-pointer hover:opacity-80 transition-all duration-300 opacity-60 text-sm">Cancel</div>
            </div>  
        </motion.div>
    );

}   

export default function SignInProvider({ children }: { children: ReactNode }) {
    const [showSignIn, setShowSignIn] = useState<boolean>(false);
    return (
        <SignInContext.Provider value={{ signIn: () => setShowSignIn(true) }}>
            {showSignIn && <SignInPopup onClose={() => setShowSignIn(false)} />}
            {children}
        </SignInContext.Provider>
    );
}

export const useSignIn = () => {
    const context = useContext(SignInContext);
    if (!context) throw Error("Sign in context undefined.");
    return context;
}
