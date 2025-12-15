import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

export const createObject3D = (overrides: Partial<Object3D>): Object3D => ({
	vertexShader: "",
	fragmentShader: "",
	objectType: "sphere",
	position: { x: 0, y: 0, z: 0 },
	rotation: { x: 0, y: 0, z: 0 },
	scale: { x: 1, y: 1, z: 1 },
	wireframe: false,
	config: {},
	subdivisions: 5,
	...overrides,
});