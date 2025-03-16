"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info" | "error";
  duration?: number;
};

type ToastContextType = {
  toasts: Toast[];
  toast: (options: { title: string; description?: string; variant?: "default" | "destructive" | "success" | "warning" | "info" | "error"; duration?: number }) => string;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ 
    title, 
    description, 
    variant = "default", 
    duration = 5000 
  }: { 
    title: string; 
    description?: string; 
    variant?: "default" | "destructive" | "success" | "warning" | "info" | "error"; 
    duration?: number 
  }) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Auto dismiss after duration
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, duration);

    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const dismissAllToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismissToast, dismissAllToasts }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
} 