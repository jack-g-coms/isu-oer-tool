import { useDroppable } from "@dnd-kit/react";

interface DroppableProps extends React.HTMLAttributes<HTMLDivElement> {
    id: string,
    isDragging: boolean,
    disabled: boolean,
    pos?: number
};

export default function Droppable({id, pos, children, disabled, isDragging, className, ...props}: DroppableProps) {
    const { ref, isDropTarget } = useDroppable({
        id,
        disabled
    });

    return (
        <div 
            ref={ref} 
            className={`${isDropTarget && isDragging ? `h-8 bg-blue-100 border-2 border-blue-500 rounded-md ${pos == 0 ? "mt-1.5" : ""}` : "h-1.5"} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}