"use client";
import AuthModalContainer from "./components/AuthModalContainer";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { authModalReturnTo } from "../return-to";
interface AuthModalContextType {
  openAuthModal: (redirectUrl?: string) => void;
  closeAuthModal: () => void;
  returnTo: string;
  cancelTo: string;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(
  undefined,
);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [returnTo, setReturnTo] = useState("/dashboard");
  const [cancelTo, setCancelTo] = useState("/");
  const openAuthModal = useCallback((redirectUrl?: string) => {
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const targetUrl = authModalReturnTo(currentUrl, redirectUrl);
    localStorage.setItem("authRedirect", targetUrl);
    setReturnTo(targetUrl);
    setCancelTo(window.location.pathname === "/auth/sign-in" ? "/" : currentUrl);
    setIsModalOpen(true);
  }, []);
  const closeAuthModal = useCallback(() => {
    // localStorage.removeItem("authRedirect");
    setIsModalOpen(false);
  }, []);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      setIsModalOpen(false);
      previousPathname.current = pathname;
    }
  }, [pathname]);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, returnTo, cancelTo }}>
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
