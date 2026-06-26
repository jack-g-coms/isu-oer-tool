"use client";

import React from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    tip?: string;
}

export default function TextArea({ label, required, tip, ...props }: TextAreaProps) {
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

            <textarea
                {...props}
                required={required}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#C8102E] focus:border-transparent transition resize-none"
            />

            {tip &&
                <span className="block text-sm font-medium text-gray-500 tracking-tight">
                    {tip}
                </span>
            }
        </div>
    );
}