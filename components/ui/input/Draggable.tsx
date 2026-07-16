import { useDraggable } from "@dnd-kit/react";

import Button, { ButtonProps } from "./Button";

interface DraggableProps extends ButtonProps {
    id: string
}

export default function Draggable({ id, children, className, ...props }: DraggableProps) {
    const { ref, isDragging } = useDraggable({
        id
    });

    return (
        <Button ref={ref} className={`${isDragging ? "opacity-50" : ""} ${className}`} {...props}>
            {children}
        </Button>
    );
}