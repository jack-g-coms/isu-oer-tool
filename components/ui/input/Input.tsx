interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export default function Input({ label, ...props }: InputProps) {
    return (
        <div className="space-y-1">
            {label &&
                <label className="block text-sm font-medium text-gray-500 tracking-tight">
                    {label}
                </label>
            }
            <input
                {...props}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#C8102E] focus:border-transparent transition"
            />
        </div>
    );
}