"use client";
import AuthModalContainer from "@/components/auth/AuthModalContainer";
import { createContext, ReactNode, useContext, useState } from "react";
interface AuthModalContextType {
  openAuthModal: (redirectUrl?: string) => void; // 允许传入可选的跳转地址
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(
  undefined,
);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openAuthModal = (redirectUrl?: string) => {
    // 逻辑：如果调用时传了地址就存传的，没传就存当前路径
    const targetUrl = redirectUrl || window.location.pathname;
    localStorage.setItem("authRedirect", targetUrl);
    setIsModalOpen(true);
  };
  const closeAuthModal = () => {
    // localStorage.removeItem("authRedirect");
    setIsModalOpen(false);
  };
  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModalContainer open={isModalOpen} />
    </AuthModalContext.Provider>
  );
}

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  // 如果组件在 Provider 外部被使用，抛出友好提示
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
};
