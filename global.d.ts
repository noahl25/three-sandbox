import { Camera } from "three";
import { MutableRefObject, ReactElement, RefObject } from "react";
import { Vector3 } from "@react-three/fiber";

declare global {
    type FilesContext = {
        files: Record<string, string>,
        selectedFile: string,
        setSelectedFile: (name: string) => void,
        setFileContent: (name: string, contents: string) => void,
        addFile: (name: string) => boolean,
        deleteFile: (name: string) => void,
        renameFile: (file: string, name: string) => void,
        setFiles: (files: Record<string, string>) => void
    }
    
    type ObjectTypes = "plane" | "cube" | "sphere" | "cylinder" | "cone" | "torus";
    
    type Settings = {
        maximizedViewport: boolean,
        axesHelper: boolean
    }
    
    type GlobalContext = {
        live: boolean,
        setLive: (live: boolean) => void,
        onReloadClicked: () => void,
        setOnReloadClicked: (onReloadClicked: () => void) => void,
        settings: Settings,
        setSettings: (settings: Settings) => void,
        shaderError: string | null,
        setShaderError: (error: string | null) => void,
        axisLength: number,
        setAxisLength: (num: number) => void,
        currentLoadedSceneID: string | null,
        setCurrentLoadedSceneID: (id: string | null) => void,
        currentLoadedSceneName: string | null,
        setCurrentLoadedSceneName: (name: string | null) => void,
        camera: RefObject<{ position: { x: number, y: number, z: number }, direction: { x: number, y: number, z: number } }>,
        initialCameraPosition: { x: number, y: number, z: number } | null,
        initialCameraDirection: { x: number, y: number, z: number } | null,
        ownsScene: boolean,
        scenePublished: boolean
    }

    type ObjectsContext = {
        objects: Object3D[],
        setObjects: (objects: Object3D[]) => void
    }

    type Object3D = {
        vertexShader: string,
        fragmentShader: string,
        objectType: ObjectTypes,
        position: { x: number, y: number, z: number },
        rotation: { x: number, y: number, z: number },
        scale: { x: number, y: number, z: number },
        wireframe: boolean = false,
        subdivisions: number,
        uuid: string,
        culling: number,
        config: any = {}
    }

    type Scene = {
        files: Map<string, string>,
        objects: Object3D[],
        cameraPosition: { x: number, y: number, z: number },
        cameraDirection: { x: number, y: number, z: number }
    }

    type SavedScene = {
        scene: Scene,
        title: string,
        description?: string,
        tags?: string[],
        authorEmail: string,
        authorName: string,
        likes: number,
        createdOn: string,
        _id: string
    };

    type WindowState = "menu" | "config" | "editor" | "info"

    type PopupContext = {
        showPopup: (popup: ReactNode) => void
    }

    type PopupElement = ReactElement<{ onClose: () => void }>

    type SessionContext = {
        session: any,
        setSession: (session: any) => void
    }

}

export {}