'use client'

import { lerp } from "@/lib/utils";
import { useFiles } from "@/providers/providers";
import { useFrame, useThree } from "@react-three/fiber";
import { ReactElement, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export default function Object3D({ object, fragmentShaderOverride, vertexShaderOverride }: { object: Object3D, fragmentShaderOverride?: string, vertexShaderOverride?: string }) {
    const { files } = useFiles();
    const processShader = (shader: string) => {
        if (!shader) return;
        if (shader.startsWith("//using")) {
            const includes = shader.slice(8, shader.indexOf("\n")).split(" ");
            for (const include of includes.reverse()) {
                const file = files[include];
                shader = (file || "") + shader;
            }
        }
        return shader;
    }
    const vertexShader = fragmentShaderOverride ?? processShader(files[object.vertexShader]);
    const fragmentShader = vertexShaderOverride ?? processShader(files[object.fragmentShader]);
    const { camera } = useThree();

    const mesh = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const hover = useRef<number>(0.0);
    const mousePosition = useRef<{ x: number, y: number }>({ x: 0.0, y: 0.0 });

    const uniforms = useMemo(() => ({
        u_time: { value: 0.0 },
        u_hovered: { value: hover.current },
        u_mouse: { value: new THREE.Vector2(0, 0) },
        u_camera_pos: { value: new THREE.Vector3(0, 0, 0) },
        u_camera_dir: { value: new THREE.Vector3(0, 0, 0) }
    }), []);

    useEffect(() => {
        if (materialRef.current && vertexShader && fragmentShader) {
            materialRef.current.vertexShader = vertexShader;
            materialRef.current.fragmentShader = fragmentShader;
            materialRef.current.needsUpdate = true;
        }
    }, [vertexShader, fragmentShader]);

    useFrame((state, delta) => {
        const { clock } = state;
        if (mesh.current) {
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            (mesh.current.material as any).uniforms.u_time.value = clock.getElapsedTime();
            (mesh.current.material as any).uniforms.u_hovered.value = lerp((mesh.current.material as any).uniforms.u_hovered.value, hover.current ? 1 : 0, delta * 3);
            (mesh.current.material as any).uniforms.u_mouse.value = new THREE.Vector2(state.pointer.x, state.pointer.y);
            (mesh.current.material as any).uniforms.u_camera_pos.value = camera.position;
            (mesh.current.material as any).uniforms.u_camera_dir.value = direction;
        }
    });

    const geometry: Record<ObjectTypes, ReactElement<any>> = {
        cube: <boxGeometry args={[1, 1, 1, object.subdivisions, object.subdivisions, object.subdivisions]} />,
        plane: <planeGeometry args={[1, 1, object.subdivisions, object.subdivisions]} />,
        sphere: <icosahedronGeometry args={[0.5, object.subdivisions]} />,
        cylinder: <cylinderGeometry args={[0.5, 0.5, 1, object.subdivisions, object.subdivisions]} />,
        cone: <coneGeometry args={[0.5, 1, object.subdivisions, object.subdivisions]} />,
        torus: <torusGeometry args={[1, 0.5, object.subdivisions, object.subdivisions]} />
    }

    return (
        <mesh ref={mesh}
            position={[object.position.x, object.position.y, object.position.z]}
            rotation={[object.rotation.x * Math.PI / 180, object.rotation.y * Math.PI / 180, object.rotation.z * Math.PI / 180]}
            scale={[object.scale.x, object.scale.y, object.scale.z]}
            onPointerOver={() => hover.current = 1.0}
            onPointerLeave={() => hover.current = 0.0}
        >
            {geometry[object.objectType]}
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                wireframe={object.wireframe}
                uniforms={uniforms}
                side={object.culling as 0 | 1 | 2}
            />
        </mesh>
    );
};