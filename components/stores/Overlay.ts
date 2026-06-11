import { create } from "zustand";
import { ReactNode } from "react";

type OverlayStore = {
    content: ReactNode | null;
    isOpen: boolean;

    open: (content: ReactNode) => void;
    close: () => void;
};

export const useOverlayStore = create<OverlayStore>((set) => ({
    content: null,
    isOpen: false,

    open: (content) => set({
        content,
        isOpen: true
    }),

    close: () => set({
        content: null,
        isOpen: false
    })
}));