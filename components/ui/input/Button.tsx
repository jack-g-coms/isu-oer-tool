"use client";

import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "clear" | "icon"
    loading?: boolean,
    icon?: React.ReactNode,
    fixed?: boolean
    loadingText?: string
}

export default function Button({ variant="primary", fixed=false, icon, loading=false, type="button", children, loadingText="Loading...", ...props }: ButtonProps) {
    const base = "inline-flex items-center cursor-pointer w-full py-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants = {
        primary: "justify-center gap-2 px-4 bg-[var(--isu-cardinal)] text-white hover:bg-[#A50D25] active:bg-[#8C0B20] focus:ring-[var(--isu-cardinal)]",
        secondary: "justify-center gap-2 px-4 bg-[var(--isu-gold)] text-white hover:bg-[var(--isu-gold-dark)] active:bg-[#B8890D] focus:ring-[var(--isu-gold)]",
        clear: "text-gray-500 gap-4 px-4 hover:bg-gray-100 focus:ring-[var(--isu-cardinal)]",
        icon: "text-gray-500 gap-4 px-2 hover:bg-gray-100 focus:ring-[var(--isu-cardinal)]"
    }

    return (
        <button {...props} type={type} disabled={props.disabled || loading} className={`${base} ${variants[variant]} ${props.className ? props.className : ""}`}>
            {loading && 
                <Loader2
                    className="inline-block h-4 w-4 animate-spin mb-0.5"
                />
            }
            {loading ? loadingText : fixed ? (
                <span className="inline-flex gap-2 items-center min-w-0 w-full">
                    {icon}
                    
                    <span className="truncate block">
                        {children}
                    </span>
                </span>
            ) : children}
        </button>
    );
}