import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from 'uuid';
import { BackSide, FrontSide, DoubleSide } from "three";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function mapRange(value: number, inRange: [number, number], outRange: [number, number]) {
	const [inMin, inMax] = inRange;
	const [outMin, outMax] = outRange;
	if (inMax === inMin) return outMin;
	return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
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
	uuid: uuidv4(),
	culling: 0,
	...overrides,
});

export function threeCullingToString(culling: number) {
	if (culling == 0) return "Back Side";
	else if (culling == 1) return "Front Side";
	else return "None";
}
