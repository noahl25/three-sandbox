'use client'

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CodeMirror, { type Extension } from '@uiw/react-codemirror';
import { cloneElement, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { EditorView } from "@codemirror/view";
import debounce from "lodash.debounce"
import { Axis3D, Box, Camera, ChevronDown, ChevronRight, Circle, Cone, Cylinder, File, Fullscreen, Heart, HomeIcon, InfoIcon, Lock, LockOpen, LogIn, LogOut, MenuIcon, Plus, RotateCcw, Save, Settings, Square, Torus, Trash, Upload, User2 } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useAnimationControls } from "motion/react";
import { useFiles, useGlobal, useObjects, useScene, useSession } from "@/providers/providers";
import { clamp, mapRange, threeCullingToString } from "@/lib/utils";
import { createObject3D } from "@/lib/utils";
import Object3D from "@/components/Object3D";
import { SignInPopup, ConfirmationPopup } from "@/components/Popups"
import Link from "next/link";
import { usePopup } from "@/components/Popup";
import { oauthClient } from "@/lib/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteShader, saveShader } from "@/lib/actions";
import UpdateCamera from "@/components/UpdateCamera";
import { useForm, SubmitHandler } from "react-hook-form"
import TagsInput from "@/components/TagsInput";
import router from "next/router";


const FileSelector = ({ name, onClick, selected }: { name: string, onClick: () => void, selected?: boolean }) => {

	const { renameFile } = useFiles();
	const [renaming, setRenaming] = useState<boolean>(false);
	const [value, setValue] = useState<string>(name);
	const divRef = useRef<HTMLDivElement | null>(null);

	const finishRename = () => {
		if (value.length > 100) {
			setRenaming(false);
		}
		else {
			renameFile(name, value);
			setRenaming(false);
		}
	};

	return (
		<>
			{
				renaming ? 
					<input type="text" maxLength={100} autoFocus onBlur={() => setRenaming(false)} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && finishRename()} placeholder={name} className={`focus:outline-none border-[#0F151C] border-2 rounded-3xl h-full px-4 flex justify-start items-center hover:bg-white/5 cursor-pointer ${selected ? "bg-white/5" : ""}`} style={{
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
			<div onClick={() => { if (Object.keys(files).length < 100) addFile("file.glsl"); } } className="p-1 border-[#0F151C] text-[#6B7280] cursor-pointer border-2 rounded-full hover:scale-110 active:scale-95 transition-all duration-300">
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
	const { setOnReloadClicked } = useGlobal();

	useEffect(() => {
		setContent(files[selectedFile] || "");
	}, [selectedFile, files, files[selectedFile]]);

	const debouncedSetFileContent = useMemo(() => (
		debounce((fileName: string, content: string) => {
			setFileContent(fileName, content);
		}, 500)
	), [setFileContent]);

	const handleChange = (newContent: string) => {
		if (newContent.length > 10000) return;
		setContent(newContent);
		debouncedSetFileContent(selectedFile, newContent);
	};

	useEffect(() => {
		setOnReloadClicked(() => setFileContent(selectedFile, content));
	}, [selectedFile, setFileContent, content]);

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

const SavePopup = ({ onClose }: { onClose: () => void }) => {

	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [submitResult, setSubmitResult] = useState<{ result: string, success: boolean } | null>(null);

	const { files } = useFiles();
	const { objects } = useObjects();
	const { currentLoadedSceneID, camera } = useGlobal();
	const router = useRouter();

	const onSubmit = () => {
		if (!inputRef.current) return;
		const title = inputRef.current.value.trim();
		if (title.length === 0) {
			setError("Please enter a title.")
		}
		else if (title.length > 35) {
			setError("Title must be less than 35 characters.");
		}
		else {
			const filesMap = new Map<string, string>(Object.entries(files));
			const newMap = new Map<string, string>();
			filesMap.forEach((value, key) => {
				const newKey = key.replace(/\./g, "<%period%>");
				newMap.set(newKey, value);
			});
			setSubmitting(true);
			const scene: Scene = {
				files: newMap,
				objects,
				cameraPosition: { x: camera.current.position.x, y: camera.current.position.y, z: camera.current.position.z },
				cameraDirection: { x: camera.current.direction.x, y: camera.current.direction.y, z: camera.current.direction.z }
			}
			saveShader(scene, title, currentLoadedSceneID).then((result) => {
				if (result?.success) {
					setSubmitResult({ result: "Success!", success: true })
					router.push(`?id=${result.id}`);
					setTimeout(onClose, 1300);
				}
				else {
					setSubmitResult({ result: result?.error ?? "An error occurred.", success: false })
					setSubmitting(false);
				}
			});
		}
	}

	const close = () => {
		if (!submitting) {
			onClose();
		}
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="absolute inset-0 backdrop-blur-sm z-10000 text-stone-300">
			<div onClick={(e) => e.stopPropagation()} className="absolute left-1/2 top-1/2 -translate-x-1/2 flex flex-col items-center gap-4 -translate-y-1/2 w-7/8 sm:w-[400px] p-5 rounded-xl bg-gray-950">
				<p className="text-xl text-center w-full">Save Scene</p>
				<input ref={inputRef} type="text" maxLength={35} placeholder="Title..." className="cursor-pointer text-stone-300/80 w-full h-[40px] focus:outline-none w-[200px] border-3 border-[#0F151C] rounded-lg flex items-center justify-start p-2"/>
				{
					error &&
					<div className="text-xs text-red-500/80 w-full text-center">
						{error}
					</div>
				}
				<div className="w-full flex justify-center items-center gap-2">
					<div onClick={onSubmit} className="cursor-pointer hover:opacity-80 transition-all duration-300 opacity-60 text-sm">{submitting ? "Saving..." : "Save"}</div>
					<div onClick={close} className="cursor-pointer hover:opacity-80 transition-all duration-300 opacity-60 text-sm">Cancel</div>
				</div>
				{
					submitResult &&
					<div className={`${submitResult.success ? "text-green-500/80" : "text-red-500/80"} text-xs w-full text-center`}>
						{submitResult.result}
					</div>
				}
			</div>
		</motion.div>
	);
}

const PublishPopup = ({ onClose }: { onClose: () => void }) => {

	type Inputs = {
		title: string,
		description: string,
		tags: string[]
	}

	const [submitResult, setSubmitResult] = useState<{ result: string, success: boolean } | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const { files } = useFiles();
	const { objects } = useObjects();
	const { currentLoadedSceneID, camera } = useGlobal();
	const router = useRouter();
	const { setScenePublished } = useScene();
	
	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<Inputs>();
	const onSubmit: SubmitHandler<Inputs> = (data) => {
		setIsSubmitting(true);
		const filesMap = new Map<string, string>(Object.entries(files));
		const newMap = new Map<string, string>();
		filesMap.forEach((value, key) => {
			const newKey = key.replace(/\./g, "<%period%>");
			newMap.set(newKey, value);
		});
		const scene: Scene = {
			files: newMap,
			objects,
			cameraPosition: { x: camera.current.position.x, y: camera.current.position.y, z: camera.current.position.z },
			cameraDirection: { x: camera.current.direction.x, y: camera.current.direction.y, z: camera.current.direction.z }
		}
		saveShader(scene, data.title, currentLoadedSceneID, data.description, data.tags, true).then((result) => {
			if (result?.success) {
				setSubmitResult({ result: "Success!", success: true })
				if (result.id) {
					router.push(`?id=${result.id}`);
				}
				else {
					setScenePublished(true);
				}
				setTimeout(onClose, 1300);
			}
			else {
				setSubmitResult({ result: result?.error ?? "An error occurred.", success: false })
				setIsSubmitting(false);
			}
		});
	}
	
	const close = () => {
		if (!isSubmitting) {
			onClose();
		}
	}

	const { currentLoadedSceneName } = useGlobal();

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="absolute inset-0 backdrop-blur-sm z-10000 text-stone-300">
			<div onClick={(e) => e.stopPropagation()} className="absolute left-1/2 top-1/2 -translate-x-1/2 flex flex-col items-center gap-4 -translate-y-1/2 w-7/8 sm:w-[400px] p-5 rounded-xl bg-gray-950">
				<p className="text-xl text-center w-full">Publish Scene</p>
				<form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-2 text-stone-300/80">
					<input defaultValue={currentLoadedSceneName ? currentLoadedSceneName : ""} maxLength={35} type="text" {...register("title", { required: { value: true, message: "Please enter a title." }, maxLength: 35, setValueAs: (value) => value.trim() } )} placeholder="Title..." className="w-full h-[40px] focus:outline-none w-[200px] border-3 border-[#0F151C] rounded-lg flex items-center justify-start p-2" />
					{
						errors.title && <p className="w-full text-center text-red-500/80 text-xs">{errors.title.message}</p>
					}
					<textarea maxLength={500} placeholder="Description..." style={{ resize: "none" }} {...register("description", { required: false, maxLength: 500, setValueAs: (value) => value.trim() })} className="scrollbar w-full h-[120px] focus:outline-none w-[200px] border-3 border-[#0F151C] rounded-lg flex items-center justify-start px-2 py-[2px]" />
					{
						errors.description && <p className="w-full text-center text-red-500/80 text-xs">{errors.description.message}</p>
					}
					<TagsInput control={control} name={"tags"}/>
					<div className="w-full flex justify-center items-center gap-2 mt-5">
						<button type="submit" disabled={isSubmitting} className="cursor-pointer hover:opacity-80 transition-all duration-300 opacity-60 text-sm">{isSubmitting ? "Publishing..." : "Publish"}</button>
						<div onClick={close} className="cursor-pointer hover:opacity-80 transition-all duration-300 opacity-60 text-sm">Cancel</div>
					</div>
				</form>
				{
					submitResult &&
					<div className={`${submitResult.success ? "text-green-500/80" : "text-red-500/80"} text-xs w-full text-center`}>
						{submitResult.result}
					</div>
				}
			</div>
		</motion.div>
	);
}

const Menu = () => {

	const { showPopup } = usePopup();
	const { session, setSession } = useSession();
	const { currentLoadedSceneID, camera, currentLoadedSceneName, ownsScene, scenePublished } = useGlobal();
	const { files } = useFiles();
	const { objects } = useObjects();

	const [actionResult, setActionResult] = useState<{ result: string, success: boolean } | null>(null);
	const actionResultAnimationControls = useAnimationControls();
	const router = useRouter();
	
	const showSigninPopup = () => {
		showPopup(<SignInPopup onCloseAction={() => showPopup(null)} />);
	}
	const save = () => {
		if (currentLoadedSceneID) {
			const filesMap = new Map<string, string>(Object.entries(files));
			const newMap = new Map<string, string>();
			filesMap.forEach((value, key) => {
				const newKey = key.replace(/\./g, "<%period%>");
				newMap.set(newKey, value);
			});
			const scene: Scene = {
				files: newMap,
				objects,
				cameraPosition: { x: camera.current.position.x, y: camera.current.position.y, z: camera.current.position.z },
				cameraDirection: { x: camera.current.direction.x, y: camera.current.direction.y, z: camera.current.direction.z }
			}
			saveShader(scene, currentLoadedSceneName ?? "", currentLoadedSceneID).then((result) => {
				if (result?.success) {
					setActionResult({ result: "Success!", success: true });
				}
				else {
					setActionResult({ result: result?.error ?? "An error occurred.", success: false });
				}
			});
		}
		else {
			showPopup(<SavePopup onClose={() => showPopup(null)} />);
		}
	}
	const publish = () => {
		showPopup(<PublishPopup onClose={() => showPopup(null)} />);
	}
	const signOut = () => {
		showPopup(<ConfirmationPopup confirmationText="Sign out?" subText="Unsaved progress may be lost." onCloseAction={() => showPopup(null)} onConfirmAction={async () => { 
			await oauthClient.signOut(); 
			showPopup(null); 
			setSession(null);
		}}/>)
	}
	const onDeleteShader = () => {
		if (currentLoadedSceneID) {
			deleteShader(currentLoadedSceneID).then((result) => {
				if (result?.success) {
					setActionResult({ result: "Success!", success: true });
					showPopup(null);
					router.push("/home");
				}
				else {
					setActionResult({ result: result?.error ?? "An error occurred.", success: false });
					showPopup(null);
				}
			});
		}
	}
	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout>;
		if (actionResult) {
			actionResultAnimationControls.stop();
			actionResultAnimationControls.start({
				opacity: 1,
				transition: { duration: 0 }
			});
			timeout = setTimeout(() => {
				actionResultAnimationControls.start({
					opacity: 0,
					transition: { duration: 2 }
				});
			}, 2000);
		}
		return () => clearTimeout(timeout);
	}, [actionResult]);


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
				<div onClick={session ? signOut : showSigninPopup } className="flex gap-3 w-fit items-center cursor-pointer hover:scale-110 transition-all duration-300">
					{ session === null ? 
						<LogIn/>
							:
						<LogOut/>
					}
					<p className="text-lg">{session === null ? "Sign In" : "Sign Out"}</p>
				</div>
			</div>
			{
				(ownsScene || !currentLoadedSceneID) &&
				<div className="border-b-2 border-[#0F151C] px-4 sm:px-7 py-5 space-y-5">
					<div className="flex items-center gap-3 h-[16px]">
						<p className="text-xs">TOOLS</p>
						{
							actionResult &&
							<motion.p animate={actionResultAnimationControls} className={`text-xs ${actionResult.success ? "text-green-500/80" : "text-red-500/80"}`}>{actionResult.result}</motion.p>
						}
					</div>
					<div onClick={session ? save : showSigninPopup } className="flex gap-3 relative w-fit items-center cursor-pointer hover:scale-110 transition-all duration-300">
						<Save />
						<p className="text-lg">Save</p>
					</div>
					{
						!scenePublished &&
						<div onClick={session ? publish : showSigninPopup} className="flex gap-3 w-fit items-center cursor-pointer hover:scale-110 transition-all duration-300">
							<Upload />
							<p className="text-lg">Publish</p>
						</div>
					}
					{
						currentLoadedSceneID &&
						<div onClick={() => showPopup(<ConfirmationPopup onConfirmAction={onDeleteShader} confirmationText={`Delete ${currentLoadedSceneName}?`} onCloseAction={() => showPopup(null)}/>)} className="flex gap-3 w-fit items-center cursor-pointer hover:scale-110 transition-all duration-300">
							<Trash />
							<p className="text-lg">Delete</p>
						</div>
					}
				</div>
			}

		</div>
	);
}

const WindowSelector = ({ windowState, setWindowState }: { windowState: WindowState, setWindowState: (state: WindowState) => void }) => {

	const { currentLoadedSceneName, scenePublished } = useGlobal();

	return (
		<div className="w-full text-gray-300/60 border-t-2 border-[#0F151C] mt-auto relative">
			<div className="flex items-center justify-start gap-3 w-full p-3">
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
				{
					scenePublished &&
					<motion.div
						initial={{
							scale: windowState === "info" ? 1 : 0.75
						}}
						animate={{
							scale: windowState === "info" ? 1 : 0.75
						}}
						transition={{
							type: "spring"
						}}
					>
						<InfoIcon className="cursor-pointer transition-all duration-300" onClick={() => setWindowState("info")} />
					</motion.div>
				}
				{
					currentLoadedSceneName &&
					<div className="text-xs ml-auto">
						Current scene: "{currentLoadedSceneName}"
					</div>
				}
			</div>
		</div>
	);
}

const Info = () => {

	const { scene } = useScene();

	if (!scene) return;

	return (
		<div className="h-full w-full text-gray-300/80 overflow-y-scroll scrollbar">
			<div className="h-full w-full text-gray-300/80 overflow-y-scroll scrollbar">
				<div className="border-b-2 border-[#0F151C] px-3 sm:px-5 py-3 relative">
					<div className=" flex items-center gap-3 justify-center">
						<div className="relative">
							<p className="text-[clamp(25px,4vw,40px)]">{scene.title}</p>
						</div>
						<div className="ml-auto p-2 flex gap-3 items-center flex-shrink-0">
							<div className="w-12 h-12 rounded-full bg-center bg-cover" style={{ backgroundImage: `url(${scene.authorImage})` }} />
							<div className="flex flex-col justify-center items-start tracking-wide">
								<p className="text-xl">@{scene.authorName}</p>
								<p className="opacity-70 text-sm">{scene.updatedOn}</p>
							</div>
						</div>
					</div>
					<div className="flex gap-2 items-center mt-1 ml-1 relative">
						<p className="opacity-70 relative -translate-y-[1px]">1 like</p>
						<div className="gap-2 flex group hover:scale-105 transition-all duration-300 cursor-pointer ease-in-out text-xs items-center px-2 py-1 rounded-xl border-2 border-[#151d27ff]">
							<Heart size={13}/>
							<p className="relative -translate-y-[1px]">Like</p>
						</div>
					</div>
				</div>
				<div className="pb-5">
					{
						scene.description &&
						<div className="border-b-2 py-5 border-[#0F151C]">
							<div className="px-3 sm:px-5 space-y-5">
								<p className="text-xs">DESCRIPTION</p>
								<p className="text-md">{scene.description}</p>
							</div>
						</div>
					}
					{
						scene.tags && scene.tags.length > 0 &&
						<div className="border-b-2 py-5 border-[#0F151C]">
							<div className="px-3 sm:px-5 space-y-5">
								<p className="text-xs">TAGS</p>
								<div className="flex flex-wrap gap-2">
									{
										scene.tags.map((tag: string, index: number) => (
											<span key={index} className="px-3 py-2 bg-gray-800/40 border border-[#0F151C] rounded-xl text-sm">
												{tag}
											</span>
										))
									}
								</div>
							</div>
						</div>
					}
				</div>
			</div>
		</div>
	);
}

export default function Page() {

	const { settings, setSettings, axisLength, setAxisLength, initialCameraDirection, initialCameraPosition, ownsScene, scenePublished } = useGlobal();
	const { objects } = useObjects();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const orbitControlsRef = useRef<any>(null);
	const [windowState, setWindowState] = useState<WindowState>(ownsScene || !scenePublished ? "editor" : "info");
	const firstUpdate = useRef<boolean>(true);
	const { scene } = useScene();
	const searchParams = useSearchParams();

	useLayoutEffect(() => {
		window.dispatchEvent(new Event("resize"));
	}, [settings.maximizedViewport]);

	useEffect(() => {
		if (!initialCameraPosition || !initialCameraDirection) return;
		const controls = orbitControlsRef.current;
		if (!controls) return;

		controls.object.position.set(
			initialCameraPosition.x,
			initialCameraPosition.y,
			initialCameraPosition.z
		);
		controls.target.set(
			initialCameraDirection.x,
			initialCameraDirection.y,
			initialCameraDirection.z
		);
		controls.update();
	}, [initialCameraPosition, initialCameraDirection]);

	const variants = {
		hover: {
			height: 145
		}
	}
	
	useEffect(() => {
		if (firstUpdate.current) {
			setWindowState(ownsScene || !scenePublished ? "editor" : "info");
			firstUpdate.current = false;
		}
	}, [ownsScene, scenePublished])

	const states: Record<WindowState, ReactElement> = {
		"editor": <EditorWindow/>,
		"config": <Config/>,
		"menu": <Menu/>,
		"info": <Info/>
	}

	return (
		<>
			{
				(scene || !searchParams.get("id")) &&
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, ease: "easeInOut", duration: 0.5 }} className={`h-screen w-full overflow-hidden grid ${settings.maximizedViewport ? "landscape:grid-cols-[0fr_1fr] portrait:grid-rows-[0fr_1fr]" : "landscape:grid-cols-2 portrait:grid-rows-2"}  p-2 gap-1 bg-[#080B0F]`}>
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
						<div className="absolute bottom-2 left-2 z-10 overflow-hidden">
							<UIButton onClick={() => { if (orbitControlsRef.current) orbitControlsRef.current.reset(); }} icon={<Camera />} />
						</div>
						<Canvas 
							ref={canvasRef} 
							className="w-full rounded-2xl border-2 border-[#0F151C] bg-[#0B0F14]"
							camera={initialCameraPosition ? {
								position: [initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z]
							} : undefined}
						>
							<color attach="background" args={["black"]} />
							<UpdateCamera/>
							{
								objects.map((item, key) => (
									<Object3D object={item} key={key}/>
								))
							}
							{settings.axesHelper && <axesHelper args={[axisLength]} />}
							<OrbitControls ref={orbitControlsRef} target={initialCameraDirection ? [
								initialCameraDirection.x,
								initialCameraDirection.y,
								initialCameraDirection.z
							] : undefined}/>
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
			}
		</>
	)
}

