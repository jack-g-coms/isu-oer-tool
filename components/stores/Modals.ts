import { create } from "zustand";

type ModalStore = {
  component: React.ComponentType<any> | null,
  props: Record<string, any>,
  isOpen: boolean,

  open: (component: React.ComponentType<any>, props?: Record<string, any>) => void,
  close: () => void
  updateProps: (newProps: Record<string, any>) => void
};

export const useModalStore = create<ModalStore>((set) => ({
    component: null,
    props: {},
    isOpen: false,

    open: (component, props = {}) =>
        set({
            component,
            props,
            isOpen: true
        }),

    close: () =>
        set({
            component: null,
            props: {},
            isOpen: false
        }),

    updateProps: (newProps) =>
        set((state) => ({
            props: {
                ...state.props,
                ...newProps
            }
        }))
}));
