import { Controller } from "react-hook-form";
import { X } from "lucide-react";
import { useRef, useState } from "react";

const Tag = ({ name, onClick }: { name: string, onClick: () => void }) => {

    return (
        <div onClick={onClick} className="cursor-pointer text-sm max-w-[100%] rounded-xl bg-gray-900/80 flex items-center justify-center px-3 py-2 gap-1">
            <p className="truncate flex-1">{name}</p>
            <X size={15}/>
        </div>
    );
}

export default function TagsInput({ control, name }: { control: any, name: string }) {

    const inputRef = useRef<HTMLInputElement | null>(null);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {

                const values = field.value ?? [];
                const [error, setError] = useState<string | null>(null);

                const addTag = (tag: string) => {
                    field.onChange([...values, tag]);
                }
                const removeTag = (tag: string) => {
                    field.onChange(values.filter((value: string) => value !== tag));
                }

                return ( 
                    <>
                        <div className="w-full w-[200px] border-3 border-[#0F151C] rounded-lg flex min-h-[40px] items-center justify-start px-2 py-2 flex gap-2 flex-wrap items-center max-h-[150px] overflow-y-scroll scrollbar">
                            {
                                values.map((value: any) => (
                                    <Tag name={value} key={value} onClick={() => { removeTag(value); }}/>
                                ))
                            }
                            <input 
                                ref={inputRef}
                                className={`focus:outline-none flex-1 w-[40%] min-w-[100px] ${values.length > 0 ? "ml-1" : ""}`}
                                placeholder="Tags..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (!inputRef.current) return;
                                        const value = inputRef.current?.value.trim();
                                        if (!value || values.includes(value)) return;
                                        if (values.length >= 10) {
                                            setError("Maximum 10 tags.");
                                            return;
                                        }
                                        if (value.length > 100) {
                                            setError("Tag must be less than 100 characters.");
                                            return;
                                        }
                                        addTag(value);
                                        inputRef.current.value = ""; 
                                    }
                                }}
                            />
                        </div>
                        {
                            error && <p className="w-full text-center text-red-500/80 text-xs">{error}</p>
                        }
                    </>
                );
            }}
        />
    );
}