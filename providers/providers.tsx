'use client'

import { createObject3D } from "@/lib/utils";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CookiesProvider } from "react-cookie";
import { useSearchParams } from "next/navigation";

const FileContext = createContext<FilesContext | undefined>(undefined);
const GlobalContext = createContext<GlobalContext | undefined>(undefined);
const ObjectsContext = createContext<ObjectsContext | undefined>(undefined);
const SessionContext = createContext<SessionContext | undefined>(undefined);

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

const SceneContext = createContext<{ scene: any | null; loading: boolean; error: string | null, setScenePublished: (val: boolean) => void} | undefined>(undefined);

const SceneProvider = ({ children }: { children: ReactNode }) => {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [scene, setScene] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scenePublished, setScenePublished] = useState<boolean>(false);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (!id) {
                setScene(null);
                setError(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const result = await fetch(`/api/scenes?id=${id}`);
                if (!result.ok) throw new Error(`Failed to fetch scene (${result.status})`);

                const json = await result.json();
                if (cancelled) return;
                setScene(json);
            } catch (e: any) {
                if (cancelled) return;
                setError(e?.message ?? "Failed to fetch scene");
                setScene(null);
            } finally {
                if (cancelled) return;
                setLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [id, scenePublished]);

    const value = useMemo(() => ({ scene, loading, error, setScenePublished }), [scene, loading, error, setScenePublished]);

    return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
};

const FileProvider = ({ children }: { children: ReactNode }) => {

    const [selectedFile, setSelectedFile] = useState("vertex.glsl");
    const [files, setFiles] = useState<Record<string, string>>(defaultFiles);
    const { scene } = useScene();

    useEffect(() => {
        if (scene?.scene?.files) {
            const record = Object.fromEntries(Object.entries(scene.scene.files).map(([key, val]) => [
                key.replaceAll("<%period%>", "."),
                val
            ]));
            setFiles(record as Record<string, string>);
            setSelectedFile(Object.keys(record)[0]);
        } else {
            setFiles(defaultFiles);
            setSelectedFile("vertex.glsl");
        }
    }, [scene]);

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
        <FileContext.Provider value={{ files, selectedFile, setSelectedFile, setFileContent, addFile, deleteFile, renameFile, setFiles }}>
            {children}
        </FileContext.Provider>
    );

}

const ObjectsProvider = ({ children }: { children: ReactNode }) => {

    const [objects, setObjects] = useState<Object3D[]>([]);
    const { scene } = useScene();

    useEffect(() => {
        if (scene?.scene?.objects) {
            setObjects(scene.scene.objects);
        } else {
            setObjects([
                createObject3D({
                    vertexShader: "vertex.glsl",
                    fragmentShader: "fragment.glsl",
                    objectType: "sphere"
                })
            ])
        }
    }, [scene]);

    return (
        <ObjectsContext.Provider value={{ objects, setObjects }}>
            {children}
        </ObjectsContext.Provider>
    );
}

const GlobalProvider = ({ children }: { children: ReactNode }) => {

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
    const [currentLoadedSceneID, setCurrentLoadedSceneID] = useState<string | null>(null);
    const [ownsScene, setOwnsScene] = useState<boolean>(false);
    const [currentLoadedSceneName, setCurrentLoadedSceneName] = useState<string | null>(null);
    const camera = useRef<{ position: { x: number, y: number, z: number }, direction: { x: number, y: number, z: number } }>({ position: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: -1 } });
    const { scene } = useScene();
    const initalCameraPosition = useRef < { x: number, y: number, z: number } | null>(null);
    const initalCameraDirection = useRef<{ x: number, y: number, z: number } | null>(null);
    const { session } = useSession();
    const [scenePublished, setScenePublished] = useState<boolean>(false);

    useEffect(() => {
        const id = scene?._id;
        if (id) {
            setCurrentLoadedSceneID(String(id));
            setCurrentLoadedSceneName(scene.title ?? null);
            initalCameraPosition.current = scene.scene?.cameraPosition ?? null;
            initalCameraDirection.current = scene.scene?.cameraDirection ?? null;
        } else {
            setCurrentLoadedSceneID(null);
            setCurrentLoadedSceneName(null);
            initalCameraPosition.current = null;
            initalCameraDirection.current = null;
        }
        setScenePublished(scene?.public ?? false);
    }, [scene]);
    useEffect(() => {
        if (scene) {
            if (session && session.user.id === scene.authorID) {
                setOwnsScene(true);
            }
            else {
                setOwnsScene(false);
            }
        }
        else {
            setOwnsScene(false);
        }
    }, [session, scene, currentLoadedSceneID]);

    return <GlobalContext.Provider value={{ ownsScene, scenePublished, initialCameraPosition: initalCameraPosition.current, initialCameraDirection: initalCameraDirection.current, live, setLive, onReloadClicked, setOnReloadClicked, settings, setSettings, shaderError, setShaderError, axisLength, setAxisLength, currentLoadedSceneID, setCurrentLoadedSceneID, camera, currentLoadedSceneName, setCurrentLoadedSceneName }}>
        {children}
    </GlobalContext.Provider>
}

export const SessionProvider = ({ children, session }: { children: ReactNode, session: any }) => {
    const [clientSession, setSession] = useState<any>(session);
    return <SessionContext.Provider value={{ session: clientSession, setSession }}>
        {children}
    </SessionContext.Provider>
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


export const useScene = () => {
    const scene = useContext(SceneContext);
    if (!scene) throw Error("Scene context undefined.");
    return scene;
};

export const useObjects = () => {
    const objects = useContext(ObjectsContext);
    if (!objects) throw Error("Objects context undefined.");
    return objects;
}

export const useSession = () => {
    const session = useContext(SessionContext);
    if (!session) throw Error("Sessions context undefined.");
    return session;
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <CookiesProvider defaultSetOptions={{ path: "/" }}>
            <SceneProvider>
                <GlobalProvider>
                    <FileProvider>
                        <ObjectsProvider>
                            {children}
                        </ObjectsProvider>
                    </FileProvider>
                </GlobalProvider>
            </SceneProvider>
        </CookiesProvider>
    );
}