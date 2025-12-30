'use client'

import { oauthClient } from "@/lib/auth/client";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export const SignInPopup = ({ onCloseAction }: { onCloseAction: () => void }) => {

    const signIn = async () => {
        const callbackURL = new URL(window.location.href).toString();
        try {
            await oauthClient.signIn.social({
                provider: "google",
                callbackURL: callbackURL
            });
        } catch (err: unknown) {

        }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCloseAction} className="absolute inset-0 backdrop-blur-sm z-10000 text-stone-300">
            <div onClick={(e) => e.stopPropagation()} className="absolute left-1/2 top-1/2 -translate-x-1/2 flex flex-col items-center gap-4 -translate-y-1/2 w-7/8 sm:w-[400px] p-5 rounded-xl bg-gray-950">
                <p className="text-xl text-center w-full">Sign in to Three-Sandbox</p>
                <div onClick={signIn} className="cursor-pointer w-full h-[40px] w-[200px] bg-white gap-3 rounded-lg flex items-center justify-center">
                    <Image src="/google.png" alt="Google logo" width={20} height={20} />
                    <p className="text-black text-lg relative -translate-y-[0.5px]">Continue with Google</p>
                </div>
                <div onClick={onCloseAction} className="cursor-pointer hover:opacity-80 transition-all duration-300 opacity-60 text-sm">Cancel</div>
            </div>
        </motion.div>
    );

}  

export const ConfirmationPopup = ({ confirmationText, subText, onConfirmAction: onConfirm, onCloseAction }: { confirmationText: string, subText?: string, onConfirmAction: () => void, onCloseAction: () => void }) => {

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCloseAction} className="absolute inset-0 backdrop-blur-sm z-10000 text-stone-300">
            <div onClick={(e) => e.stopPropagation()} className="absolute left-1/2 top-1/2 -translate-x-1/2 flex flex-col items-center gap-4 -translate-y-1/2 w-7/8 sm:w-[400px] p-5 rounded-xl bg-gray-950">
                <div className="space-y-2">
                    <p className="text-xl text-center w-full">{confirmationText}</p>
                    {
                        subText &&
                        <p className="text-sm opacity-70 text-center w-full">{subText}</p>
                    }
                </div>
                <div className="flex justify-center items-center gap-3 w-full">
                    <div onClick={onConfirm} className="h-10 rounded-xl grid place-items-center bg-red-500/80 flex-grow cursor-pointer">
                        Confirm
                    </div>
                    <div onClick={onCloseAction} className="h-10 rounded-xl grid place-items-center flex-grow cursor-pointer bg-gray-800/40">
                        Cancel
                    </div>
                </div>
            </div>
        </motion.div>
    );
}