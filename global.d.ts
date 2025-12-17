declare global {
    type FilesContext = {
        files: Record<string, string>,
        selectedFile: string,
        setSelectedFile: (name: string) => void,
        setFileContent: (name: string, contents: string) => void,
        addFile: (name: string) => boolean,
        deleteFile: (name: string) => void,
        renameFile: (file: string, name: string) => void
    }
    
    type ObjectTypes = "plane" | "cube" | "sphere";
    
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
        setAxisLength: (num: number) => void
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

}

export {}