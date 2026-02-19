"use client";
import { create } from "zustand";
import { ReactNode } from "react";
interface ConfirmOptions {
  title: string;
  content: ReactNode;
  confirmText?: string;
  variant?: "danger" | "primary";
}
interface ConfirmStore {
  isOpen: boolean;
  isDeleting: boolean;

  options: ConfirmOptions | null;
  resolver: ((value: boolean) => void) | null;
  setIsDeleting: (loading: boolean) => void;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
  close: () => void;
}
export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  isDeleting: false,
  options: null,
  resolver: null,
  setIsDeleting: (loading) => set({ isDeleting: loading }),
  openConfirm: (options) => {
    console.log("收到打开指令", options);
    set({ isDeleting: false });
    return new Promise((resolve) => {
      set({
        isOpen: true,
        options,
        resolver: resolve,
      });
    });
  },
  onConfirm: () => {
    get().resolver?.(true);
    // set({ isOpen: false, resolver: null });
  },
  onCancel: () => {
    get().resolver?.(false);
    set({ isOpen: false, resolver: null });
  },
  close: () => {
    set({ isOpen: false, options: null, resolver: null, isDeleting: false });
  },
}));
