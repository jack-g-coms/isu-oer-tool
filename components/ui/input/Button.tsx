import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary"
    loading?: boolean
}

export default function Button({ variant="primary", loading=false, children, ...props }: ButtonProps) {
    const base = "cursor-pointer w-full py-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants = {
        primary: "bg-[var(--isu-cardinal)] text-white hover:bg-[#A50D25] active:bg-[#8C0B20] focus:ring-[var(--isu-cardinal)]",
        secondary: "bg-[var(--isu-gold)] text-white hover:bg-[var(--isu-gold-dark)] active:bg-[#B8890D] focus:ring-[var(--isu-gold)]",
    }

    return (
        <button {...props} disabled={props.disabled || loading} className={`${base} ${variants[variant]}`}>
            {loading && 
                <Loader2
                    className="inline-block h-4 w-4 animate-spin mr-2 mb-0.5"
                />
            }
            {loading ? "Loading..." : children}
        </button>
    );
}