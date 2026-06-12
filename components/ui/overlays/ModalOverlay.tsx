"use client";

import { useModalStore } from "@/components/stores/Modals";

export default function ModalOverlay() {
    const { isOpen, content, close } = useModalStore();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={close}/>

            <div className="w-full md:w-auto relative">
                {content}
            </div>
        </div>  
    );
}