import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "clear"
    loading?: boolean
}

export default function Button({ variant="primary", loading=false, children, ...props }: ButtonProps) {
    const base = "inline-flex items-center cursor-pointer w-full py-2 px-4 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants = {
        primary: "justify-center gap-2 bg-[var(--isu-cardinal)] text-white hover:bg-[#A50D25] active:bg-[#8C0B20] focus:ring-[var(--isu-cardinal)]",
        secondary: "justify-center gap-2 bg-[var(--isu-gold)] text-white hover:bg-[var(--isu-gold-dark)] active:bg-[#B8890D] focus:ring-[var(--isu-gold)]",
        clear: "text-gray-500 gap-4 hover:bg-gray-100 focus:ring-[var(--isu-cardinal)]"
    }

    return (
        <button {...props} disabled={props.disabled || loading} className={`${base} ${variants[variant]}`}>
            {loading && 
                <Loader2
                    className="inline-block h-4 w-4 animate-spin mb-0.5"
                />
            }
            {loading ? "Loading..." : children}
        </button>
    );
}