'use client'

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CodeMirror, { type Extension } from '@uiw/react-codemirror';
import { cloneElement, createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { EditorView } from "@codemirror/view";
import * as THREE from "three";
import debounce from "lodash.debounce"
import { ArrowLeft, Axis3D, Box, ChevronDown, Circle, Fullscreen, Plus, RotateCcw, Settings, Square, Trash } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCookies } from 'react-cookie';
import { useFiles, useGlobal, useObjects } from "@/providers/providers";
import { truncate } from "node:fs/promises";

const Object3D = ({ object }: { object: Object3D }) => {
	const { files } = useFiles();
	const { settings, setShaderError } = useGlobal();
	const vertexShader = files[object.vertexShader];
	const fragmentShader = files[object.fragmentShader];

	const mesh = useRef<THREE.Mesh>(null);
	const hover = useRef<number>(0.0);
	

	const uniforms = useMemo(() => ({
		u_time: { value: 0.0 },
		u_hovered: { value: hover.current }
	}), []);

	useFrame((state) => {
		const { clock } = state;
		if (mesh.current) {
			(mesh.current.material as any).uniforms.u_time.value = clock.getElapsedTime();
			(mesh.current.material as any).uniforms.u_hovered.value = hover.current;
		}
	});

	useEffect(() => {

		setShaderError(null);
		const originalError = console.error;

		console.error = (msg, ...rest) => {
			if (typeof msg === "string" && msg.includes("THREE")) {
				setShaderError(msg);
			}
			originalError(msg, ...rest);
		};

		setTimeout(() => {
			console.error = originalError;
		}, 100);

	}, [files]);

	const geometry: Record<ObjectTypes, ReactElement<any>> = {
		cube: <boxGeometry />,
		plane: <planeGeometry args={[1, 1, 16, 16]} />,
		sphere: <icosahedronGeometry args={[0.5, 5]} />
	}

	return (
		<mesh ref={mesh} 
			position={[0, 0, 0]} 
			rotation={[-Math.PI / 2, 0, 0]} 
			scale={1.5} 
			key={`${fragmentShader}-${vertexShader}`}
			onPointerOver={() => hover.current = 1.0}
			onPointerLeave={() => hover.current = 0.0}
		>
			{geometry[object.objectType]}
			<shaderMaterial
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				wireframe={object.wireframe}
				uniforms={uniforms}
			/>
		</mesh>
	);
};


const FileSelector = ({ name, onClick, selected }: { name: string, onClick: () => void, selected?: boolean }) => {

	const { renameFile } = useFiles();
	const [renaming, setRenaming] = useState<boolean>(false);
	const [value, setValue] = useState<string>(name);
	const divRef = useRef<HTMLDivElement | null>(null);

	const finishRename = () => {
		renameFile(name, value);
		setRenaming(false);
	};

	return (
		<>
			{
				renaming ? 
					<input type="text" autoFocus onBlur={() => setRenaming(false)} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && finishRename()} placeholder={name} className={`focus:outline-none border-[#0F151C] border-2 rounded-3xl h-full px-4 flex justify-start items-center hover:bg-white/5 cursor-pointer ${selected ? "bg-white/5" : ""}`} style={{
						width: `${divRef.current?.offsetWidth}px`
					}}>
				</input>
					:
				<div ref={divRef} onClick={onClick} onDoubleClick={() => setRenaming(true)} className={`border-[#0F151C] border-2 rounded-3xl h-full px-4 grid place-items-center hover:bg-white/5 cursor-pointer ${selected ? "bg-white/5" : ""}`}>
					{name}
				</div>
			}
		</>
	);
}

const Files = () => {

	const { files, selectedFile, setSelectedFile, addFile } = useFiles();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);
	if (!mounted) return null;
	
	return (
		<>
			{
				Object.keys(files).map((name: string) => (
					<FileSelector key={name} name={name} onClick={() => setSelectedFile(name)} selected={name == selectedFile} />
				))
			}
			<div onClick={() => addFile("file.glsl")} className="p-1 border-[#0F151C] text-[#6B7280] cursor-pointer border-2 rounded-full hover:scale-110 active:scale-95 transition-all duration-300">
				<Plus size={20}/>
			</div>
		</>
	);
}

const Editor = () => {

	const theme: Extension = EditorView.theme({
		"&": {
			color: "#6B7280",
			backgroundColor: "#0B0F14",
			borderBottom: "0px",
		},
		"&.cm-focused": {
			outline: "none",
			borderBottom: "0px",
			boxShadow: "none",
		},
		".cm-content": {
			caretColor: "#6B7280",
		},
		".cm-cursor, .cm-dropCursor": { borderLeftColor: "#6B7280" },
		".cm-gutters": {
			backgroundColor: "#080B0F",
			color: "#6B7280",
			borderRight: "1px solid #0F151C",
			width: "30px",
		},
		"&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection": {
			backgroundColor: "#FFFFFF11",
		},
		".cm-selectionMatch": {
			backgroundColor: "#FFFFFF22",
		},
		".cm-line": {
			lineHeight: "1.7",
		},
		".cm-activeLineGutter": {
			backgroundColor: "#ffffff00",
		},
		".cm-activeLine": {
			backgroundColor: "#FFFFFF00",
		},
		"& .cm-scroller::-webkit-scrollbar": {
			height: "4px",
			width: "4px",
		},
		"& .cm-scroller::-webkit-scrollbar-track": {
			background: "rgba(255, 255, 255, 0)",
		},
		"& .cm-scroller::-webkit-scrollbar-thumb": {
			background: "rgba(255, 255, 255, 0.183)",
			borderRadius: "100vw",
			width: "1px",
			height: "1px",
		},
		"& .cm-scroller::-webkit-scrollbar-thumb:hover": {
			background: "rgba(255, 255, 255, 0.358)",
		},
	});

	const { files, selectedFile, setFileContent } = useFiles();
	const [content, setContent] = useState<string>(files[selectedFile]);
	const { setOnReloadClicked, live } = useGlobal();
	const [cookie, setCookie] = useCookies(["files"]);

	const debounceChange = useMemo(() => (
		debounce((content: string) => {
			setFileContent(selectedFile, content);
		}, 500)
	), [setFileContent, files]);

	useEffect(() => {
		if (!live) return;
		debounceChange(content)
	}, [content]);

	useEffect(() => {
		setOnReloadClicked(() => setFileContent(selectedFile, content));
	}, [selectedFile, setFileContent, content, setOnReloadClicked]);

	const saveFilesToCookie = useMemo(() => debounce(() => {
		setCookie("files", JSON.stringify(files));
	}, 1000), [files]);

	useEffect(() => {
		saveFilesToCookie();
	}, [files]);

	return (
		<CodeMirror
			value={files[selectedFile]}
			onChange={(setContent)}
			theme={theme}
			height="100%"
			basicSetup={{
				lineNumbers: true,
				highlightActiveLine: true,
				foldGutter: false,
			}}
		/>
	);

}

const Reload = () => {

	const { onReloadClicked } = useGlobal();
	const [animate, setAnimate] = useState(false);
	const onClick = () => {
		onReloadClicked();
		if (animate) return;
		setAnimate(true);
		setTimeout(() => setAnimate(false), 1000);
	};

	return (
		<div onClick={onClick} className="h-[35px] rounded-xl bg-[#0B0F14] p-3 flex justify-center items-center cursor-pointer text-[#6B7280] transition-colors duration-500  hover:text-[#838c9cff] group">
			<RotateCcw size={15} className={animate ? "animate-[rotate360_1s_ease-in-out_forwards] group-hover:scale-120 transition-all duration-500" : "group-hover:scale-120 transition-all duration-500"} />
		</div>
	);
}

const Live = () => {

	const { live, setLive } = useGlobal();

	return (
		<div onClick={() => setLive(!live)} className="h-[35px] rounded-xl bg-[#0B0F14] flex justify-center items-center p-3 gap-2 cursor-pointer">
			<div className={`${live ? "bg-red-800" : "bg-black"} border-black size-[10px] rounded-full`} />
			<span className="relative -translate-y-[0.25px]">Live</span>
		</div>
	);

}

const UIButton = ({ onClick, icon }: { onClick: () => void, icon: ReactElement<any> }) => {

	const newIcon = cloneElement(icon, {
		className: "group-hover:scale-120 transition-all duration-500",
		size: 15
	});

	return (
		<div onClick={onClick} className="w-fit h-fit duration-500 bg-[#0B0F14] text-[#6B7280] hover:text-[#838c9cff] group z-10 p-3 rounded-xl cursor-pointer">
			{newIcon}
		</div>
	);
}


const ShaderError = () => {

	const { shaderError } = useGlobal();

	if (shaderError) {
		return (
			<div className="absolute bottom-1 px-4 py-3 left-1 rounded-2xl right-1 h-[20%] bg-[#080B0F] text-[#6B7280]">
				<div className="whitespace-pre-wrap scrollbar overflow-y-scroll h-full">
					{shaderError}
				</div>
			</div>
		);
	}

}

const ObjectPicker = ({ object }: { object: Object3D }) => {

	const [hovering, setHovering] = useState<boolean>(false);
	const { settings, setSettings } = useGlobal();

	const icons: Record<ObjectTypes, ReactElement<any>> = {
		cube: <Box size={20} />,
		plane: <Square size={20} />,
		sphere: <Circle size={20} />
	}

	return (
		<div onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} className="flex flex-col-reverse relative items-center justify-center gap-2 text-[#6B7280]">
			<div className="bg-[#0B0F14] p-3 z-15 rounded-xl">
				<AnimatePresence mode="popLayout">
					<motion.div
						key={object.objectType}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						{
							icons[object.objectType]
						}
					</motion.div>
				</AnimatePresence>
			</div>
			{
				Object.keys(icons).map((key: string) => (
					<motion.div onClick={() => object.objectType = key as ObjectTypes} key={key} layout className="p-2 rounded-full z-14 cursor-pointer bg-[#0B0F14]" style={{ position: hovering ? "static" : "absolute" }}>
						{
							icons[key as ObjectTypes]
						}
					</motion.div>
				))
			}
		</div>
	);
}

const Dropdown = ({ placeholder, options, onClickOption }: { placeholder: string, options: string[], onClickOption: (option: string) => void }) => {

	const [selected, setSelected] = useState<boolean>(false);
	const [shownPlaceholder, setShownPlaceholder] = useState<string>(placeholder);
	const { files } = useFiles();

	const handleClick = (value: string) => {
		setShownPlaceholder(value);
		onClickOption(value);
	}

	return (
		<div onClick={() => setSelected(prev => !prev)} className={`${!Object.keys(files).includes(shownPlaceholder) ? "bg-red-500/10" : "bg-gray-800/10"}  border-3 relative -translate-x-[3px] border-[#0F151C] rounded-xl h-[35px] w-full relative flex justify-start items-center pl-2 cursor-pointer`}>
			<p className="">{shownPlaceholder}</p>
			<motion.div
				animate={{ rotate: selected ? 180 : 0}}
				className={"absolute right-1 top-1/2 -translate-y-1/2 z-20"}
			>
				<ChevronDown color="#243242ff" size={20}/>
			</motion.div>
			<AnimatePresence>
			{
				selected &&
				<motion.div 
					initial={{ opacity: 0, scale: 0.9 }} 
					exit={{ opacity: 0, scale: 0.9 }} 
					animate={{ opacity: 1, scale: 1 }} 
					transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }} 
					className="translate-y-[5px] absolute flex flex-col justify-start p-1 items-start origin-top top-full rounded-xl left-0 w-full max-h-[100px] bg-[#0B0F14] border-3 border-[#0F151C] z-30"
				>
					<div className=" overflow-y-scroll scrollbar w-full h-full">
						{
							options.map((item) => (
								<div key={item} onClick={() => handleClick(item)} className="flex justify-start items-center hover:bg-white/5 w-full rounded-xl px-2.5 py-2">
									<p className="">{item}</p>
								</div>
							))
						}
					</div>
				</motion.div>
			}
			</AnimatePresence>
		</div>
	);
}

const Config = () => {

	const { objects, setObjects } = useObjects();
	const [cookie, setCookie] = useCookies(["objects"]);
	const { files } = useFiles();

	useEffect(() => {
		setCookie("objects", JSON.stringify(objects));
	}, [objects]);

	return (
		<div className="w-full h-full px-4 py-3">
			{
				objects.map((item, key) => (
					<div className="w-full text-gray-300/80 border-b-2 pb-3 border-[#0F151C]" key={key}>
						<p className="text-xl mb-1">Object #{key + 1} - {item.objectType}</p>
						<div className="w-full flex text-sm gap-3 items-center justify-start">
							<div className="w-full flex flex-col gap-1 items-start justify-center">
								<span>Vertex Shader</span>
								<Dropdown 
									placeholder={item.vertexShader} 
									options={Object.keys(files)} 
									onClickOption={(option: string) => {
										setObjects(
											objects.map((object, id) =>
												id === key ? { ...object, vertexShader: option } : object
											)
										);
									}}
								/>
							</div>
							<div className="w-full flex gap-1 flex-col items-start justify-center">
								<span>Fragment Shader</span>
								<Dropdown 
									placeholder={item.fragmentShader} 
									options={Object.keys(files)} 
									onClickOption={(option: string) => {
										setObjects(
											objects.map((object, id) =>
												id === key ? { ...object, fragmentShader: option } : object
											)
										);
									}}
								/>
							</div>
						</div>
					</div>
				))
			}
		</div>
	);
}

export default function Page() {

	const { settings, setSettings } = useGlobal();
	const { objects, setObjects } = useObjects();
	const { selectedFile, deleteFile } = useFiles();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [configOpen, setConfigOpen] = useState<boolean>(false);

	useLayoutEffect(() => {
		window.dispatchEvent(new Event("resize"));
	}, [settings.maximizedViewport]);

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, ease: "easeInOut" }} className={`h-screen w-full overflow-hidden grid ${settings.maximizedViewport ? "landscape:grid-cols-[0fr_1fr] portrait:grid-rows-[0fr_1fr]" : "landscape:grid-cols-2 portrait:grid-rows-2"}  p-2 gap-1 bg-[#080B0F]`}>
			<div className={`min-w-0 w-full relative order-1`}>
				<div className="absolute top-2 left-2 flex gap-1 text-[#6B7280] z-10">
					<Live />
					<Reload />
				</div>
				<div className="absolute bottom-2 left-2 z-10 flex gap-1">
					<UIButton onClick={() => setSettings({ ...settings, axesHelper: !settings.axesHelper })} icon={<Axis3D />} />
				</div>
				<div className="absolute top-2 right-2 z-10">
					<UIButton onClick={() => setSettings({ ...settings, maximizedViewport: !settings.maximizedViewport })} icon={<Fullscreen />} />
				</div>
				<Canvas 
					ref={canvasRef} 
					className="w-full rounded-2xl border-2 border-[#0F151C] bg-[#0B0F14]"
				>
					<color attach="background" args={["black"]} />
					{
						objects.map((item, key) => (
							<Object3D object={item} key={key}/>
						))
					}
					{settings.axesHelper && <axesHelper args={[1.5]} />}
					<OrbitControls />
				</Canvas>
			</div>
			{
				settings.maximizedViewport ? <div /> :
					<div className="min-w-0 w-full relative h-full bg-[#0B0F14] border-2 border-[#0F151C] overflow-hidden flex flex-col rounded-2xl">
						<div className="h-[65px] scrollbar text-gray-300/80 overflow-hidden ml-2 overflow-x-scroll border-b-2 border-[#0F151C] flex gap-2 text-gray-300 items-center justify-start p-2 text-sm">
							<AnimatePresence mode="popLayout">
								{
									configOpen ? 
								<motion.div
									key="arrow"
									initial={{ opacity: 1 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.2 }}
								>
									<ArrowLeft size={20} className="text-[#6B7280] cursor-pointer hover:scale-110 transition-all duration-300" onClick={() => setConfigOpen(prev => !prev)}/>
								</motion.div>
										:
								<motion.div
									key="settings"
									initial={{ opacity: 1 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.2 }}
								>
									<Settings size={20} className="cursor-pointer text-[#6B7280] hover:scale-110 transition-all duration-300" onClick={() => setConfigOpen(prev => !prev)}/>
								</motion.div>
								}
							</AnimatePresence>
							<Files />
						</div>
						<div className="overflow-hidden overflow-y-scroll scrollbar flex-1 relative">
							{
								configOpen ? 
								<Config/> 
									:
								<>
									<Editor />
									<div onClick={() => deleteFile(selectedFile)} className="absolute top-2 right-1.5 p-2 border-[#0F151C] text-[#6B7280] cursor-pointer border-2 rounded-full hover:scale-110 active:scale-95 transition-all duration-300">
										<Trash size={20} />
									</div>
								</>
							}
						</div>
						<ShaderError />
					</div>
			}
		</motion.div>
	)
}

