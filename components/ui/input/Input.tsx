"use client";

import { Search, X } from "lucide-react";
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    tip?: string
    search?: boolean
    onClear?: () => void
}

export default function Input({ label, required, search=false, onClear, tip, ...props }: InputProps) {
    return (
        <div className="space-y-1">
            {label &&
                <div className="inline-flex gap-1">
                    <label className="block text-sm font-medium text-gray-500 tracking-tight">
                        {label}
                    </label>
                    {required &&
                        <span className="text-[var(--isu-cardinal)]">*</span>
                    }
                </div>
            }
            
            {search ?
                <div className="relative w-full">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        size={18}
                    />

                    <input
                        {...props}
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2 focus:outline-none focus:ring-1 focus:ring-[#C8102E] focus:border-transparent transition"
                    />

                    {(props.value as string).trim() &&
                        <X
                            onClick={onClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                            size={18}
                        />
                    }
                </div>
            :
                <input
                    {...props}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#C8102E] focus:border-transparent transition"
                />
            }

            {tip &&
                <span className="block text-sm font-medium text-gray-500 tracking-tight">{tip}</span>
            }
        </div>
    );
}