'use client'

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CodeMirror, { type Extension } from '@uiw/react-codemirror';
import { cloneElement, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { EditorView } from "@codemirror/view";
import debounce from "lodash.debounce"
import { ArrowLeft, Axis3D, Box, ChevronDown, ChevronRight, Circle, CircleUserRound, Cone, Cylinder, File, Fullscreen, Home, HomeIcon, Lock, LockOpen, LogIn, LogOut, MenuIcon, Plus, RotateCcw, Save, Settings, SignalIcon, Square, Torus, Trash, Upload, User, User2 } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";
import { useFiles, useGlobal, useObjects, useSession } from "@/providers/providers";
import { clamp, mapRange, threeCullingToString } from "@/lib/utils";
import { createObject3D, lerp } from "@/lib/utils";
import Object3D from "@/components/Object3D";
import Image from "next/image";
import Link from "next/link";
import { useSignIn } from "@/components/SignInPopup";
import { oauthClient } from "@/lib/auth/client";


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
				Object.keys(files).map((name: string) => {	
					if (name === "") return null;
					return <FileSelector key={name} name={name} onClick={() => setSelectedFile(name)} selected={name == selectedFile} />
				})
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
	const [content, setContent] = useState<string>("");
	const { setOnReloadClicked, live } = useGlobal();

	useEffect(() => {
		setContent(files[selectedFile] || "");
	}, [selectedFile]);

	const debouncedSetFileContent = useMemo(() => (
		debounce((fileName: string, content: string) => {
			setFileContent(fileName, content);
		}, 500)
	), [setFileContent]);

	const handleChange = (newContent: string) => {
		setContent(newContent);
		debouncedSetFileContent(selectedFile, newContent);
	};

	useEffect(() => {
		setOnReloadClicked(() => setFileContent(selectedFile, content));
	}, [selectedFile, setFileContent, content, setOnReloadClicked]);

	return (
		<CodeMirror
			value={content}
			onChange={handleChange}
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

const ObjectPicker = ({ object }: { object: Object3D }) => {

	const [hovering, setHovering] = useState<boolean>(false);
	const { settings, setSettings } = useGlobal();

	const icons: Record<ObjectTypes, ReactElement<any>> = {
		cube: <Box size={20} />,
		plane: <Square size={20} />,
		sphere: <Circle size={20} />,
		cylinder: <Cylinder size={20}/>,
		cone: <Cone size={20}/>,
		torus: <Torus size={20}/>
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

const Dropdown = ({ placeholder, options, onClickOption, specific = true, fullWidth = false }: { placeholder: string, options: string[], onClickOption: (option: string) => void, specific?: boolean, fullWidth?: boolean }) => {

	const [selected, setSelected] = useState<boolean>(false);
	const [shownPlaceholder, setShownPlaceholder] = useState<string>(placeholder);
	const { files } = useFiles();

	const handleClick = (value: string) => {
		setShownPlaceholder(value);
		onClickOption(value);
	}

	return (
		<div onClick={() => setSelected(prev => !prev)} className={`${specific && !Object.keys(files).includes(shownPlaceholder) ? "bg-red-500/10" : "bg-gray-800/10"}  border-3 relative ${specific ? "-translate-x-[3px]" : ""} border-[#0F151C] rounded-xl h-[35px] ${specific || fullWidth ? "w-full" : "w-[200px]"} relative flex justify-start items-center pl-2 cursor-pointer z-30`}>
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
					className="translate-y-[5px] absolute flex flex-col justify-start p-1 items-start origin-top top-full rounded-xl left-0 w-full max-h-[100px] bg-[#0B0F14FF] z-100 border-3 border-[#0F151C] z-30"
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

const NumberInput = ({ initial, handleChange }: { initial: number, handleChange: (num: number) => void }) => {

	const [current, setCurrent] = useState<string>(String(initial));

	useEffect(() => {
		if (Number(current) !== initial) {
			setCurrent(String(initial));
		}
	}, [initial]);

	const onChange = (e: any) => {
		const value = e.target.value;
		if (!/^-?\d*\.?\d*$/.test(value) || (value.split('.').length > 2)) return;
		setCurrent(value);
		const num = Number(value);
		if (!Number.isNaN(num)) {
			handleChange(num);
		}
	}

	return (
		<div className="bg-gray-800/10 border-3 relative border-[#0F151C] rounded-xl h-[35px] w-full relative flex justify-start items-center px-2 cursor-pointer">
			<input type="text" value={current} onChange={onChange} className="w-full active:outline-none focus:outline-none"></input>
		</div>
	);	
}

const BooleanRadio = ({ name, onChange, initial }: { name: string, onChange: (state: boolean) => void, initial: boolean}) => {

	const [checked, setChecked] = useState<boolean>(initial);

	const handleClick = () => {
		setChecked(prev => !prev);
		onChange(!checked);
	}

	return (
		<div className="flex gap-2 justify-start items-center w-full col-span-2">
			<span className="mr-auto">{name}</span>
			<div onClick={handleClick} className="size-6 cursor-pointer rounded-full bg-gray-800/10 border-3 border-[#0F151C] relative translate-y-[0.5px]">
				{
					checked && <div className="bg-gray-800/50 size-3 rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"/>
				}
			</div>
		</div>
	);
}

const Config = () => {

	const { objects, setObjects } = useObjects();
	const { files } = useFiles();
	const [scaleLocked, setScaleLocked] = useState<boolean>(false);

	useEffect(() => {
		window.localStorage.setItem("objects", JSON.stringify(objects));
	}, [objects]);

	const updateAttribute = (type: "position" | "rotation" | "scale", comp: "x" | "y" | "z", newVal: number, key: number) => {
		setObjects(
			objects.map((object, id) => (
				id === key ? { ...object, [type]: { ...object[type], [comp]: newVal } } : object
			))
		);
	}

	return (
		<div className="w-full h-full px-4 py-3 pb-2 overflow-y-scroll scrollbar">
			{
				objects.map((item, key) => (
					<div className="relative w-full text-gray-300/80 border-b-2 pb-3 border-[#0F151C] mb-3" key={key}>
						<div className="flex gap-3 items-center justify-start z-1000 mb-3">
							<p className="text-lg sm:text-xl mb-2">Object #{key + 1}</p>
							<div className="relative -translate-y-[2px] text-sm z-100000000">
								<Dropdown placeholder={item.objectType} specific={false} options={["plane", "cube", "sphere", "cylinder", "cone", "torus"]} onClickOption={(option: string) => {
									setObjects(
										objects.map((object, id) =>
											id === key ? { ...object, objectType: option as ObjectTypes } : object
										)
									);
								}}/>
							</div>
							<div className="p-2 border-[#0F151C] -translate-y-[2.25px] text-[#6B7280] cursor-pointer border-2 rounded-full hover:scale-110 active:scale-95 transition-all duration-300" onClick={() => {
								setObjects(
									objects.filter((_) => _.uuid !== item.uuid)
								);
							}}>
								<Trash size={20} />
							</div>
						</div>
						<div className="w-full flex text-sm gap-3 items-center justify-start mb-2">
							<div className="w-full flex flex-col gap-1 items-start justify-center">
								<span>Vertex Shader</span>
								<Dropdown 
									placeholder={item.vertexShader} 
									options={Object.keys(files).filter(Boolean)} 
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
									options={Object.keys(files).filter(Boolean)} 
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
						<div className="w-full text-sm flex flex-col items-start justify-center gap-1 mb-2">
							<span>Position</span>
							<div className="flex justify-start items-center gap-3 w-full">
								<NumberInput initial={item.position.x} handleChange={(num: number) => updateAttribute("position", "x", num, key)}/>
								<NumberInput initial={item.position.y} handleChange={(num: number) => updateAttribute("position", "y", num, key)} />
								<NumberInput initial={item.position.z} handleChange={(num: number) => updateAttribute("position", "z", num, key)} />
							</div>
						</div>
						<div className="w-full text-sm flex flex-col items-start justify-center gap-1 mb-2">
							<span>Rotation</span>
							<div className="flex justify-start items-center gap-3 w-full">
								<NumberInput initial={item.rotation.x} handleChange={(num: number) => updateAttribute("rotation", "x", num, key)} />
								<NumberInput initial={item.rotation.y} handleChange={(num: number) => updateAttribute("rotation", "y", num, key)} />
								<NumberInput initial={item.rotation.z} handleChange={(num: number) => updateAttribute("rotation", "z", num, key)} />
							</div>
						</div>
						<div className="w-full text-sm flex flex-col items-start justify-center gap-1 mb-5">
							<div className="flex gap-2 justify-start items-center">
								<span>Scale</span>
								<div
									onClick={() => setScaleLocked((prev) => !prev)}
									className="p-1 border-[#0F151C] text-[#6B7280] cursor-pointer border-2 rounded-full hover:scale-110 active:scale-95 transition-all duration-300"
								>
									{scaleLocked ? <Lock size={15} /> : <LockOpen size={15} />}
								</div>
							</div>
							<div className="flex justify-start items-center gap-3 w-full">
								{["x", "y", "z"].map((axis, i) => (
									<NumberInput
										key={axis}
										initial={item.scale[axis as "x" | "y" | "z"]}
										handleChange={(num: number) => {
											setObjects(
												objects.map((object, id) => {
													if (id !== key) return object;
													if (scaleLocked) {
														return { ...object, scale: { x: num, y: num, z: num } };
													} else {
														return { ...object, scale: { ...object.scale, [axis]: num } };
													}
												})
											);
										}}
									/>
								))}
							</div>
						</div>
						<div className="text-md grid grid-cols-2 gap-3">
							<span className="">Subdivisions</span>
							<NumberInput initial={item.subdivisions} handleChange={(num: number) => {
								setObjects(
									objects.map((object, id) => {
										if (id !== key) return object;
										return { ...object, subdivisions: num }
									})
								)
							}}/>
							<span>Culling</span>
							<Dropdown
								placeholder={threeCullingToString(item.culling)}
								options={["Back Side", "Front Side", "None"]}
								onClickOption={(option: string) => {
									setObjects(
										objects.map((object, id) => {
											if (id !== key) return object;
											return { ...object, culling: option === "Back Side" ? 0 : option === "None" ? 2 : 1 }
										})
									)
								}}
								specific={false}
								fullWidth={true}
							/>
							<BooleanRadio name="Wireframe" initial={item.wireframe} onChange={(state: boolean) => {
								setObjects(
									objects.map((object, id) => {
										if (id !== key) return object;
										return { ...object, wireframe: state }
									})
								)
							}}/>
							
						</div>
					</div>
				))
			}
			<div className="w-full flex justify-center items-center mt-5">
				<div className="p-1 mb-5 border-[#0F151C] text-[#6B7280] cursor-pointer border-2 rounded-full hover:scale-110 active:scale-95 transition-all duration-300" onClick={() => {
					setObjects(
						[
							...objects,
							createObject3D({
								vertexShader: "vertex.glsl",
								fragmentShader: "fragment.glsl",
								objectType: "sphere"
							})
						]
					);
				}}>
					<Plus size={25} />
				</div>
			</div>
		</div>
	);
}

const ChevronDropdown = ({ setWindowState }: { setWindowState: (state: string) => void }) => {
	const [menuOpen, setMenuOpen] = useState<boolean>(false);
	return (
		<div
			className="absolute bottom-5 text-gray-300/60 -translate-x-1/2 space-y-1 left-1/2"
			style={{
				pointerEvents: menuOpen ? "auto" : "none"
			}}
		>
			<motion.div
				initial={{
					opacity: 0,
					scale: 0
				}}
				animate={{
					opacity: menuOpen ? 1 : 0,
					scale: menuOpen ? 1 : 0
				}}
				className="rounded-full bg-[#0B0F14] origin-bottom border-3 border-[#0F151C] flex items-center justify-center p-3 gap-3"
			>
				<MenuIcon className="cursor-pointer hover:scale-110 transition-all duration-300" onClick={() => setWindowState("menu")} />
				<File className="cursor-pointer hover:scale-110 transition-all duration-300" onClick={() => setWindowState("editor")} />
				<Settings className="cursor-pointer hover:scale-110 transition-all duration-300" onClick={() => setWindowState("config")} />
			</motion.div>
			<motion.div
				onClick={() => setMenuOpen(prev => !prev)}
				initial={{
					rotate: 180,
					opacity: 0.3
				}}
				animate={{
					rotate: menuOpen ? 0 : 180,
					opacity: menuOpen ? 1 : 0.3
				}}
				style={{
					pointerEvents: "all"
				}}
				className="relative -translate-x-[1.9px]"
			>
				<ChevronRight className="mx-auto hover:scale-110 transition-all duration-300 cursor-pointer" />
			</motion.div>
		</div>
	);
}

const Slider = ({ value, onChange }: { value: number, onChange: (num: number) => void }) => {

	const bottom = useMotionValue(value);
	const bottomSpring = useSpring(bottom);
	const [dragging, setDragging] = useState(false);

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		setDragging(true);
		e.currentTarget.setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!dragging) return;
		const deltaY = -e.movementY;
		bottom.set(clamp(bottom.get() + deltaY, 0, 68));
		onChange(clamp(mapRange(bottom.get() + deltaY, [0, 68], [1, 10]), 1, 10));
	};

	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		setDragging(false);
		e.currentTarget.releasePointerCapture(e.pointerId);
	};

	return (
		<motion.div className="w-2 h-20 bg-[#0B0F14] rounded-full mx-auto relative">
			<motion.div
				className="absolute w-[17px] h-[17px] bg-[#0F151C] hover:bg-[#17212cff] transition-colors duration-300 rounded-full left-1/2 -translate-x-1/2"
				style={{ bottom: bottomSpring }}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerLeave={handlePointerUp}
			/>
		</motion.div>
	);
}

const EditorWindow = () => {
	const { selectedFile, deleteFile } = useFiles();
	return (
		<>
			<div className="h-[65px] scrollbar text-gray-300/80 overflow-hidden ml-2 overflow-x-scroll border-b-2 border-[#0F151C] flex gap-2 text-gray-300 items-center justify-start p-2 text-sm">
				<Files />
			</div>
			<div className="overflow-hidden overflow-y-scroll scrollbar flex-1 relative">
				<Editor />
				<div onClick={() => deleteFile(selectedFile)} className="absolute top-2 right-1.5 p-2 border-[#0F151C] text-[#6B7280] cursor-pointer border-2 rounded-full hover:scale-110 active:scale-95 transition-all duration-300">
					<Trash size={20} />
				</div>
			</div>
		</>
	);
}

const Menu = () => {

	const { signIn } = useSignIn();
	const { session, setSession } = useSession();
	console.log(session)

	return (
		<div className="h-full w-full text-gray-300/80 overflow-y-scroll scrollbar">
			<div className="border-b-2 border-[#0F151C] gap-3 flex items-center px-3 sm:px-5 py-5 justify-start">
				{
					session === null?
					<div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">
						<User2/>
					</div>
						:
					<div className="size-12 rounded-full bg-center bg-cover" style={{ backgroundImage: `url(${session.user.image})` }}/>
				}
				<div className="flex flex-col items-start justify-center">
					<p className="text-xl">Welcome, {session === null ? "guest" : session.user.name}</p>
					<p className="text-sm opacity-70">{session === null ? "Not signed in." : "Signed in"}</p>
				</div>
			</div>
			<div className="border-b-2 border-[#0F151C] px-4 sm:px-7 py-5 space-y-5">
				<p className="text-xs">NAVIGATION</p>
				<div className="flex gap-3 w-fit items-center cursor-pointer hover:scale-110 transition-all duration-300">
					<HomeIcon/>
					<Link href="/home" className="text-lg">Go Home</Link>
				</div>
			</div>
			<div className="border-b-2 border-[#0F151C] px-4 sm:px-7 py-5 space-y-5">
				<p className="text-xs">ACCOUNT</p>
				<div onClick={session ? () => { oauthClient.signOut(); setSession(null); } : signIn } className="flex gap-3 w-fit items-center cursor-pointer hover:scale-110 transition-all duration-300">
					{ session === null ? 
						<LogIn/>
							:
						<LogOut/>
					}
					<p className="text-lg">{session === null ? "Sign In" : "Sign Out"}</p>
				</div>
			</div>
			<div className="border-b-2 border-[#0F151C] px-4 sm:px-7 py-5 space-y-5">
				<p className="text-xs">TOOLS</p>
				<div className="flex gap-3 w-fit items-center cursor-pointer hover:scale-110 transition-all duration-300">
					<Save />
					<p className="text-lg">Save</p>
				</div>
				<div className="flex gap-3 w-fit items-center cursor-pointer hover:scale-110 transition-all duration-300">
					<Upload />
					<p className="text-lg">Publish</p>
				</div>
			</div>

		</div>
	);
}

const WindowSelector = ({ windowState, setWindowState }: { windowState: WindowState, setWindowState: (state: WindowState) => void }) => {

	return (
		<div className="w-full text-gray-300/60 border-t-2 border-[#0F151C] mt-auto">
			<div className="mx-auto flex gap-3 w-fit p-3">
				<motion.div
					initial={{
						scale: windowState === "menu" ? 1 : 0.75
					}}
					animate={{
						scale: windowState === "menu" ? 1 : 0.75
					}}
					transition={{
						type: "spring"
					}}
				>
					<MenuIcon className="cursor-pointer transition-all duration-300" onClick={() => setWindowState("menu")} />
				</motion.div>
				<motion.div
					initial={{
						scale: windowState === "editor" ? 1 : 0.75
					}}
					animate={{
						scale: windowState === "editor" ? 1 : 0.75
					}}
					transition={{
						type: "spring"
					}}
				>
					<File className="cursor-pointer transition-all duration-300" onClick={() => setWindowState("editor")} />
				</motion.div>
				<motion.div
					initial={{
						scale: windowState === "config" ? 1 : 0.75
					}}
					animate={{
						scale: windowState === "config" ? 1 : 0.75
					}}
					transition={{
						type: "spring"
					}}
				>
					<Settings className="cursor-pointer transition-all duration-300" onClick={() => setWindowState("config")} />
				</motion.div>
			</div>
		</div>
	);
}

export default function Page() {

	const { settings, setSettings, axisLength, setAxisLength } = useGlobal();
	const { objects } = useObjects();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [windowState, setWindowState] = useState<WindowState>("editor");

	useLayoutEffect(() => {
		window.dispatchEvent(new Event("resize"));
	}, [settings.maximizedViewport]);

	const variants = {
		hover: {
			height: 145
		}
	}

	const states: Record<WindowState, ReactElement> = {
		"editor": <EditorWindow/>,
		"config": <Config/>,
		"menu": <Menu/>
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, ease: "easeInOut" }} className={`h-screen w-full overflow-hidden grid ${settings.maximizedViewport ? "landscape:grid-cols-[0fr_1fr] portrait:grid-rows-[0fr_1fr]" : "landscape:grid-cols-2 portrait:grid-rows-2"}  p-2 gap-1 bg-[#080B0F]`}>
			<div className={`min-w-0 w-full relative order-1`}>
				<div className="absolute top-2 left-2 flex gap-1 text-[#6B7280] z-10">
					<Live />
					<Reload />
				</div>
				<motion.div className="absolute bottom-2 right-2 z-10 flex gap-1" whileHover="hover">
					<UIButton onClick={() => setSettings({ ...settings, axesHelper: !settings.axesHelper })} icon={<Axis3D />} />
					<motion.div
						className="absolute bottom-0 w-full pt-5 overflow-hidden"
						initial={{
							height: 0
						}}
						transition={{
							duration: 0.7
						}}
						variants={variants}
					>
						<Slider value={axisLength} onChange={(num: number) => { setAxisLength(num) }}/>
					</motion.div>
				</motion.div>
				<div className="absolute top-2 right-2 z-10 overflow-hidden">
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
					{settings.axesHelper && <axesHelper args={[axisLength]} />}
					<OrbitControls />
				</Canvas>
			</div>
			{
				settings.maximizedViewport ? <div /> : 
					<div className="min-w-0 w-full relative h-full bg-[#0B0F14] border-2 border-[#0F151C] overflow-hidden flex flex-col rounded-2xl">
						{states[windowState]}
						<WindowSelector windowState={windowState} setWindowState={(state: WindowState) => setWindowState(state)}/>
					</div>
				
			}
		</motion.div>
	)
}

