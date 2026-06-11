"use client";

import { Upload } from "lucide-react";
import { useRef } from "react";

type FileUploadProps = {
    label?: string
    file: File | null
    onChange: (file: File | null) => void
    accept: string
    acceptMsg: string
}

export default function FileUpload({
    label,
    file,
    onChange,
    accept,
    acceptMsg
}: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-gray-500 tracking-tight">
                    {label}
                </label>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) =>
                    onChange(e.target.files?.[0] ?? null)
                }
            />

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="
                    cursor-pointer
                    w-full
                    rounded-lg
                    border
                    border-dashed
                    border-gray-300
                    bg-white
                    px-4
                    py-6
                    text-center
                    transition
                    hover:border-[var(--isu-cardinal)]
                    hover:bg-gray-50
                    focus:outline-none
                    focus:ring-1
                    focus:ring-[var(--isu-cardinal)]
                "
            >
                <div className="flex flex-col items-center gap-2">
                    <Upload
                        size={24}
                        className="text-gray-400"
                    />

                    {file ? (
                        <>
                            <p className="font-medium text-gray-900">
                                {file.name}
                            </p>
                            <p className="text-sm text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-medium text-gray-900">
                                Select a document
                            </p>
                            <p className="text-sm text-gray-500">
                                {acceptMsg}
                            </p>
                        </>
                    )}
                </div>
            </button>
        </div>
    );
}