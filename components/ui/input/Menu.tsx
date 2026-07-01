"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type MenuItem = {
    label: string
    icon?: LucideIcon
    onClick?: () => void
    disabled?: boolean
    danger?: boolean
    divider?: boolean
};

type MenuProps = {
    menuClassName?: string,
    label?: {
        text?: string
        icon?: LucideIcon,
        iconClassName?: string
    }
    trigger?: ReactNode
    items: MenuItem[]
    align?: "left" | "right" | "top-left"
};

export default function Menu({
    menuClassName,
    label,
    trigger,
    items,
    align="left"
}: MenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                ref.current &&
                !ref.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClick);

        return () => {
            document.removeEventListener("mousedown", handleClick);
        }
    }, []);

    return (
        <div
            ref={ref}
            className={`relative ${menuClassName ? menuClassName : ""}`}
        >
            {trigger ? (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen(!open);
                    }}
                    className="cursor-pointer"
                >
                    {trigger}
                </div>
            ) : (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen(!open);
                    }}
                    className={`
                        ${label?.text ? "px-3" : "px-1"}
                        ${open ? "bg-gray-100" : ""}
                        py-1.5
                        rounded-md
                        text-lg
                        lg:text-base
                        w-full
                        font-medium
                        text-gray-700
                        hover:bg-gray-100
                        transition
                        cursor-pointer
                        inline-flex
                        items-center
                        gap-2
                    `}
                >
                    {label?.icon &&
                        <label.icon className={label.iconClassName} />
                    }
                    {label?.text}
                </button>
            )}

            {open &&
                <div
                    className={`
                        absolute
                        w-48
                        bg-white
                        border
                        border-gray-200
                        rounded-lg
                        shadow-lg
                        py-1
                        z-[9999]
                        ${align === "right" ? "right-0 top-full mt-1" : align === "top-left" ? "left-0 bottom-full mb-1" : "left-0 top-full mt-1"}
                    `}
                >
                    {items.map((item, index) => (
                        item.divider ? (
                            <div
                                key={index}
                                className="
                                    border-t
                                    border-gray-200
                                    my-1
                                "
                            />
                        ) : (
                            <button
                                key={index}
                                disabled={item.disabled}
                                onClick={() => {
                                    if (item.disabled) return
                                    item.onClick?.()
                                    setOpen(false)
                                }}
                                className={`
                                    w-full
                                    text-left
                                    px-3
                                    py-2
                                    text-lg
                                    lg:text-base
                                    font-medium
                                    transition
                                    flex
                                    items-center
                                    gap-2
                                    min-w-0
                                    whitespace-nowrap
                                    overflow-hidden
                                    ${
                                        item.danger
                                            ? "text-red-600 hover:bg-red-50"
                                            : "text-gray-700 hover:bg-gray-100"
                                    }
                                    ${
                                        item.disabled
                                            ? "opacity-40 cursor-not-allowed"
                                            : "cursor-pointer"
                                    }
                                `}
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    {item.icon && <item.icon/>}

                                    <span className="truncate">
                                        {item.label}
                                    </span>
                                </span>
                            </button>
                        )
                    ))}
                </div>
            }
        </div>
    );
}