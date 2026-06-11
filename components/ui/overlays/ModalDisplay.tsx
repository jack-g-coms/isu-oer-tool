"use client";

import { useOverlayStore } from "@/components/stores/Overlay";

export default function ModalDisplay() {
    const { isOpen, content, close } = useOverlayStore();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={close}/>

            <div className="relative">
                {content}
            </div>
        </div>  
    );
}