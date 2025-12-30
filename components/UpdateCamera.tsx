import { useGlobal } from "@/providers/providers";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

export default function UpdateCamera() {

    const { camera: threeCamera } = useThree();
    const { camera } = useGlobal();

    useFrame(() => {
        const direction = threeCamera.getWorldDirection(new Vector3());
        camera.current.position = { x: threeCamera.position.x, y: threeCamera.position.y, z: threeCamera.position.z };
        camera.current.direction = { x: direction.x, y: direction.y, z: direction.z };
    });

    return null;

}