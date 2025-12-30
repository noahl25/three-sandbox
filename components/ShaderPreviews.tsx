'use client'

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Object3D from "./Object3D";
import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import { useRouter } from 'next/navigation'

const Preview = ({ scene, onLoaded }: { scene: SavedScene, onLoaded: () => void }) => {
    const processShader = (shader: string) => {
        if (!shader) return;
        if (shader.startsWith("//using")) {
            const includes = shader.slice(8, shader.indexOf("\n")).split(" ");
            for (const include of includes.reverse()) {
                const file = scene.scene.files.get(include);
                shader = (file || "") + shader;
            }
        }
        return shader;
    }
    return (
        <Canvas
            className="w-full rounded-t-2xl bg-[#0B0F14]"
            camera={{ position: [scene.scene.cameraPosition.x, scene.scene.cameraPosition.y, scene.scene.cameraPosition.z] }}
            onCreated={() => onLoaded()}
        >
            <color attach="background" args={["black"]} />
            {
                scene.scene.objects.map((item, key) => (
                    <Object3D object={item} key={key} vertexShaderOverride={processShader(scene.scene.files.get(item.vertexShader) ?? "")} fragmentShaderOverride={processShader(scene.scene.files.get(item.fragmentShader) ?? "")} />
                ))
            }
            <OrbitControls target={[ scene.scene.cameraDirection.x, scene.scene.cameraDirection.y, scene.scene.cameraDirection.z ]} />
        </Canvas>
    );
}

export default function ShaderPreview({ scenes }: { scenes: SavedScene[] | null }) {

    const [communityShaders, setCommunityShaders] = useState<boolean>(false);
    const [loadedCount, setLoadedCount] = useState<number>(0);
    const router = useRouter();

    const handleCanvasLoaded = () => setLoadedCount(prev => prev + 1);
    const allLoaded = scenes ? loadedCount === scenes.length : true;

    const handleNewClicked = () => {
        router.push("/");
    }

    return (
        <div className="max-w-[1000px] w-full mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 items-center mb-4">
                <div className="text-3xl text-center">Explore Shaders</div>
                <div className="flex justify-center items-center gap-2 text-sm sm:text-md">
                    <div onClick={() => setCommunityShaders(false)} className={`border-[#0F151C] text-center border-2 rounded-3xl h-full px-4 py-2 grid place-items-center hover:bg-white/5 cursor-pointer ${!communityShaders ? "bg-white/5" : ""}`}>
                        Your Shaders
                    </div>
                    <div onClick={() => setCommunityShaders(true)} className={`border-[#0F151C] text-center border-2 rounded-3xl h-full px-4 py-2 grid place-items-center hover:bg-white/5 cursor-pointer ${communityShaders ? "bg-white/5" : ""}`}>
                        Community Shaders
                    </div>
                </div>
            </div>
            <div className="w-full h-[50px] rounded-full border-3 border-[#0F151C] flex justify-start items-center px-4 mb-4">
                <input placeholder="Search..." className="w-full focus:outline-none"></input>
            </div>
            <div className="grid mx-auto grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5" style={{ opacity: allLoaded ? 1 : 0 }}>
                <div onClick={handleNewClicked} className={`w-full ${scenes === null || scenes.length == 0 ? "max-w-[50%]" : ""} h-full min-h-[300px] bg-gray-800/7 border-3 border-[#0F151C] rounded-2xl hover:scale-103 flex flex-col justify-center items-center cursor-pointer transition-all duration-300 ease-in-out`}>
                    <Plus size={35}/>
                </div>
                {
                    scenes &&
                    <>
                        {
                            scenes.map((scene, key) => (
                                <div onClick={() => router.push(`/?id=${scene._id}`)} key={key} className="bg-gray-800/7 rounded-2xl border-3 border-[#0F151C] hover:scale-103 cursor-pointer transition-all duration-300 ease-in-out">
                                    <div className="h-[275px]">
                                        <Preview scene={scene} onLoaded={handleCanvasLoaded}/>
                                    </div>
                                    <div className="py-2 px-3">
                                        <p className="text-xl font-bold truncate">{scene.title}</p>
                                        <p className="opacity-80 text-sm mb-[5px]">{scene.authorName}</p>
                                        <div className="flex gap-2 opacity-80 items-center mb-[5px]">
                                            <Heart size={15}/>
                                            <p className="text-xs">{scene.likes}</p>
                                            <p className="ml-auto text-xs">{scene.createdOn}</p>
                                        </div>
                                    </div>
                                </div> 
                            ))  
                        }
                    </>
                }
            </div>
        </div>
    );

}