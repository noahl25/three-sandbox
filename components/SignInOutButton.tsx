'use client'

import { oauthClient } from "@/lib/auth/client";
import { ConfirmationPopup, SignInPopup } from "./Popups";
import { usePopup } from "./Popup";
import { useSession } from "@/providers/providers";
import { useRouter } from "next/navigation";

export function SignInOutButton({ session }: { session: any | null }) {

    const { showPopup } = usePopup();
    const { setSession } = useSession();
    const router = useRouter();
    
    const signIn = () => {
        showPopup(<SignInPopup onCloseAction={() => showPopup(null)} />);
    }
    const signOut = () => {
        showPopup(<ConfirmationPopup confirmationText="Sign out?" onCloseAction={() => showPopup(null)} onConfirmAction={async () => {
            await oauthClient.signOut();
            showPopup(null);
            setSession(null);
            router.refresh();
        }} />)
    }

    return (
        <div onClick={session ? signOut : signIn} className="rounded-full text-center ml-auto px-3 py-2 gap-2 cursor-pointer border-3 border-[#0F151C] hover:scale-105 duration-300 transition-all">
            <span className="relative -translate-y-[0.25px]">{session ? "Sign Out" : "Sign In"}</span>
        </div>
    );

}