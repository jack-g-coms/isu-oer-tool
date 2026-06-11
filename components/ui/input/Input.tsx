"use client";
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    tip?: string
}

export default function Input({ label, required, tip, ...props }: InputProps) {
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
            <input
                {...props}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#C8102E] focus:border-transparent transition"
            />
            {tip &&
                <span className="block text-sm font-medium text-gray-500 tracking-tight">{tip}</span>
            }
        </div>
    );
}