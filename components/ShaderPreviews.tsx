'use client'

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Object3D from "./Object3D";
import { useState } from "react";

const Preview = ({ scene }: { scene: Scene }) => {
    return (
        <Canvas
            className="w-full rounded-2xl border-2 border-[#0F151C] bg-[#0B0F14]"
            camera={{ position: [scene.cameraPosition.x, scene.cameraPosition.y, scene.cameraPosition.z] }}
        >
            <color attach="background" args={["black"]} />
            {
                scene.objects.map((item, key) => (
                    <Object3D object={item} key={key} vertexShaderOverride={scene.files[item.vertexShader]} fragmentShaderOverride={scene.files[item.fragmentShader]} />
                ))
            }
            <OrbitControls target={[ scene.cameraDirection.x, scene.cameraDirection.y, scene.cameraDirection.z ]} />
        </Canvas>
    );
}

export default function ShaderPreview() {

    const [communityShaders, setCommunityShaders] = useState<boolean>(false);

    return (
        <div className="max-w-[1000px] w-full mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
                <div className="text-3xl">Explore Shaders</div>
                <div className="flex justify-center items-center gap-2 text-md">
                    <div onClick={() => setCommunityShaders(false)} className={`border-[#0F151C] border-2 rounded-3xl h-full px-4 py-2 grid place-items-center hover:bg-white/5 cursor-pointer ${!communityShaders ? "bg-white/5" : ""}`}>
                        Your Shaders
                    </div>
                    <div onClick={() => setCommunityShaders(true)} className={`border-[#0F151C] border-2 rounded-3xl h-full px-4 py-2 grid place-items-center hover:bg-white/5 cursor-pointer ${communityShaders ? "bg-white/5" : ""}`}>
                        Community Shaders
                    </div>
                </div>
            </div>
            <div className="w-full h-[50px] rounded-full border-3 border-[#0F151C] flex justify-start items-center px-4">
                <input placeholder="Search..." className="w-full focus:outline-none"></input>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
            </div>
        </div>
    );

}