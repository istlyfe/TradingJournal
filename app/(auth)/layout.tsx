import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Trading Journal",
  description: "Login to your Trading Journal account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  );
} 