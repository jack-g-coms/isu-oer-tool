"use client";

import { Check } from "lucide-react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: string;
}

export default function Checkbox({ label, className = "", ...props }: CheckboxProps) {
    return (
        <label className="flex items-start gap-3 cursor-pointer select-none">
            <div className="relative">
                <input
                    type="checkbox"
                    className="
                        peer
                        h-4
                        w-4
                        appearance-none
                        rounded
                        border
                        border-gray-300
                        bg-white
                        transition
                        focus:outline-none
                        focus:ring-1
                        focus:ring-[var(--isu-cardinal)]
                        checked:bg-[var(--isu-cardinal)]
                        checked:border-[var(--isu-cardinal)]
                    "
                    {...props}
                />

                <Check
                    size={12}
                    className="
                        absolute
                        left-1/2
                        top-1/4
                        -translate-x-1/2
                        -translate-y-1/8
                        text-white
                        opacity-0
                        peer-checked:opacity-100
                    "
                />
            </div>

            {label && (
                <span className="text-sm font-medium text-gray-600 tracking-tight">
                    {label}
                </span>
            )}
        </label>
    );
}