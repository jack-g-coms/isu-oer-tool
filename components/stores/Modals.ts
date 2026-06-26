import { create } from "zustand";
import { ComponentType } from "react";

type ModalEntry = {
    component: ComponentType<any>,
    props?: Record<string, any>
};

type ModalStore = {
    stack: ModalEntry[],

    open: (component: ComponentType<any>, props?: Record<string, any>) => void,
    close: () => void,
    updateProps: (newProps: Record<string, any>) => void,

    current: () => ModalEntry | null
};

export const useModalStore = create<ModalStore>((set, get) => ({
    stack: [],

    open: (component, props = {}) =>
        set((state) => ({
            stack: [...state.stack, { component, props }]
        })),

    close: () =>
        set((state) => ({
            stack: state.stack.slice(0, -1)
        })),

    updateProps: (newProps) =>
        set((state) => {
            const stack = [...state.stack];
            const last = stack[stack.length - 1];

            if (last) {
                last.props = {
                    ...last.props,
                    ...newProps
                };
            }

            return { stack };
        }),

    current: () => {
        const state = get();
        return state.stack[state.stack.length - 1] ?? null;
    }
}));