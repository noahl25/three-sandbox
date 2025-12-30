'use server'

import ShaderPreview from "@/components/ShaderPreviews";
import { connectToDatabase } from "@/database/mongoose";
import { SavedScene } from "@/database/schemas";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { SignInOutButton } from "@/components/SignInOutButton";

export default async function Page() {

    const session = await auth.api.getSession({
        headers: await headers()
    });

    let scenes = null;
    if (session) {
        await connectToDatabase();
        scenes = (await SavedScene.find({ authorEmail: session.user.email }).lean()).map((scene: any) => {
            const newMap = new Map<string, string>();
            Object.entries(scene.scene.files).forEach(([key, value]) => {
                const newKey = key.replaceAll("<%period%>", ".");
                newMap.set(newKey, value as string);
            });
            return { ...scene, scene: { ...scene.scene, files: newMap }, _id: scene._id.toString(), createdOn: scene.createdOn.toLocaleDateString('en-CA'), authorID: scene.authorID.toString() }
        });
    }
    

    return (
        <div className="w-full min-h-screen flex p-2 text-stone-300 bg-[#080B0F]">
            <div className="w-full flex-1 relative py-3 bg-[#0B0F14] border-2 border-[#0F151C] rounded-xl">
                <div className="flex justify-between items-center px-4 mb-3 pb-3 border-b-3 border-[#0F151C] mb-4">
                    <div className="w-fit text-2xl">three-sandbox</div>
                    <SignInOutButton session={session}/>
                </div>
                <ShaderPreview scenes={scenes}/>
            </div>
        </div>
    );

}