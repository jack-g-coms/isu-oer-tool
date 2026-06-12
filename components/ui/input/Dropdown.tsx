"use client";

import { ChevronDown } from "lucide-react";

type Option = {
    label: string;
    value: string;
}

interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    tip?: string;
    options: Option[];
    placeholder?: string;
}

export default function Dropdown({
    label,
    tip,
    options,
    placeholder,
    required,
    ...props
}: DropdownProps) {
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

            <div className="relative">
                <select
                    {...props}
                    required={required}
                    className="
                        appearance-none
                        w-full
                        border
                        border-gray-300
                        rounded-lg
                        px-4
                        py-2
                        pr-10
                        bg-white
                        text-gray-900
                        focus:outline-none
                        focus:ring-1
                        focus:ring-[#C8102E]
                        focus:border-transparent
                        transition
                        cursor-pointer
                    "
                >
                    {placeholder &&
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    }

                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    size={18}
                    className="
                        pointer-events-none
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        text-gray-500
                    "
                />
            </div>

            {tip &&
                <span className="block text-sm font-medium text-gray-500 tracking-tight">
                    {tip}
                </span>
            }
        </div>
    );
}