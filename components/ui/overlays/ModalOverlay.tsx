"use client";

import { useModalStore } from "@/components/stores/Modals";

export default function ModalOverlay() {
    const { component: Modal, isOpen, props, close } = useModalStore();

    if (!isOpen || !Modal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:p-8">
            <div className="absolute inset-0 bg-black/50" onClick={close}/>

            <div className="w-full max-h-full md:w-auto relative">
                <Modal {...props}/>
            </div>
        </div>  
    );
}