import Object3D from "@/components/Object3D";
import ShaderPreview from "@/components/ShaderPreviews";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export default async function Page() {

    return (
        <div className="w-full min-h-screen flex p-2 text-stone-300 bg-[#080B0F]">
            <div className="w-full flex-1 relative py-3 bg-[#0B0F14] border-2 border-[#0F151C] rounded-xl">
                <div className="flex justify-between items-center px-4 mb-3 pb-3 border-b-3 border-[#0F151C] mb-4">
                    <div className="w-fit text-2xl">three-sandbox</div>
                    <div className="rounded-full ml-auto px-3 py-2 gap-2 cursor-pointer border-3 border-[#0F151C] hover:scale-105 duration-300 transition-all">
                        <span className="relative -translate-y-[0.25px]">Sign Out</span>
                    </div>
                </div>
                <ShaderPreview/>
            </div>
        </div>
    );

}