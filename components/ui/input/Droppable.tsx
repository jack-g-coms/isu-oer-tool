import { useDroppable } from "@dnd-kit/react";
import { closestCenter } from "@dnd-kit/collision";

interface DroppableProps extends React.HTMLAttributes<HTMLDivElement> {
    id: string,
    isDragging: boolean,
    disabled: boolean,
};

export default function Droppable({id, children, disabled, isDragging, className, ...props}: DroppableProps) {
    const { ref, isDropTarget } = useDroppable({
        id,
        disabled,
        collisionDetector: closestCenter
    });

    return (
        <div 
            ref={ref} 
            className={`${isDropTarget && isDragging ? `h-8 bg-blue-100 border-2 border-blue-500 rounded-md w-full mb-1.5` : "h-0 w-full"} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}