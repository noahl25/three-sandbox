'use client'

import { createObject3D } from "@/lib/utils";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CookiesProvider, useCookies } from "react-cookie";

const FileContext = createContext<FilesContext | undefined>(undefined);
const GlobalContext = createContext<GlobalContext | undefined>(undefined);
const ObjectsContext = createContext<ObjectsContext | undefined>(undefined);

const defaultFiles = {
    "vertex.glsl": `uniform float u_time;
void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  modelPosition.y += sin(modelPosition.x * 3.0 + u_time) * 0.2;
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;
}`,
    "fragment.glsl": `void main() {
  gl_FragColor = vec4(0.8, 0.8, 1.0, 1.0);
}`
};

export const FileProvider = ({ children }: { children: ReactNode }) => {

    const [selectedFile, setSelectedFile] = useState("");
    const [files, setFiles] = useState<Record<string, string>>(defaultFiles);

    useEffect(() => {
        const saved = window.localStorage.getItem("files");
        if (!saved) return;

        const parsed = JSON.parse(saved);

        setFiles(parsed);
        setSelectedFile(Object.keys(parsed)[0]);
    }, []);

    useEffect(() => {
        window.localStorage.setItem("files", JSON.stringify(files));
    }, [files]);

    useEffect(() => {
        if (selectedFile) return;
        const keys = Object.keys(files);
        if (keys.length) setSelectedFile(keys[0]);
    }, [files, selectedFile]);

    const setFileContent = (name: string, content: string) => {
        setFiles(prev => ({ ...prev, [name]: content }));
    };
    const addFile = (baseName: string) => {
        let name = baseName;
        let i = 0;
        while (Object.keys(files).includes(name)) {
            i++;
            name = `${baseName.split(".")[0]}${i}.${baseName.split(".").slice(1).join(".")}`;
        }
        setFiles(prev => ({ ...prev, [name]: "" }));
        return true;
    }
    const deleteFile = (name: string) => {
        setFiles(prev => {
            const keys = Object.keys(prev);
            if (keys.length == 1) return prev;
            const { [name]: _, ...rest } = prev;
            const remainingKeys = Object.keys(rest);
            setSelectedFile(remainingKeys.length ? remainingKeys[remainingKeys.length - 1] : "");
            return rest;
        });
    }
    const renameFile = (file: string, baseName: string) => {
        setFiles(prev => {
            let name = baseName;
            let i = 0;
            const keys = Object.keys(prev).filter(k => k !== file);
            while (keys.includes(name)) {
                i++;
                const [first, ...rest] = baseName.split(".");
                name = `${first}${i}.${rest.join(".")}`;
            }
            const { [file]: value, ...rest } = prev;
            setSelectedFile(name);
            return {
                ...rest,
                [name]: value,
            };
        });
    }
    return (
        <FileContext.Provider value={{ files, selectedFile, setSelectedFile, setFileContent, addFile, deleteFile, renameFile }}>
            {children}
        </FileContext.Provider>
    );

}

export const ObjectsProvider = ({ children }: { children: ReactNode }) => {

    const [objects, setObjects] = useState<Object3D[]>([]);

    useEffect(() => {
        const cache = window.localStorage.getItem("objects");
        setObjects(cache && JSON.parse(cache) || [
            createObject3D({
                vertexShader: "vertex.glsl",
                fragmentShader: "fragment.glsl",
                objectType: "sphere"
            })
        ])
    }, []);

    return (
        <ObjectsContext.Provider value={{ objects, setObjects }}>
            {children}
        </ObjectsContext.Provider>
    );
}

export const GlobalProvider = ({ children }: { children: ReactNode }) => {

    const [live, setLive] = useState<boolean>(true);
    const [onReloadClicked, setOnReloadClickedState] = useState<() => void>(() => () => { });
    const setOnReloadClicked = useCallback((onReloadClicked: () => void) => {
        setOnReloadClickedState(() => onReloadClicked);
    }, []);
    const [settings, setSettings] = useState<Settings>({
        maximizedViewport: false,
        axesHelper: false
    });
    const [shaderError, setShaderError] = useState<string | null>(null);
    const [axisLength, setAxisLength] = useState<number>(1);

    return <GlobalContext.Provider value={{ live, setLive, onReloadClicked, setOnReloadClicked, settings, setSettings, shaderError, setShaderError, axisLength, setAxisLength }}>
        {children}
    </GlobalContext.Provider>
}

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) throw Error("Global context undefined.");
    return context;
}


export const useFiles = () => {
    const files = useContext(FileContext);
    if (!files) throw Error("File context undefined.");
    return files;
}

export const useObjects = () => {
    const objects = useContext(ObjectsContext);
    if (!objects) throw Error("Objects context undefined.");
    return objects;
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <CookiesProvider defaultSetOptions={{ path: "/" }}>
            <GlobalProvider>
                <FileProvider>
                    <ObjectsProvider>
                        {children}
                    </ObjectsProvider>
                </FileProvider>
            </GlobalProvider>
        </CookiesProvider>
    );
}