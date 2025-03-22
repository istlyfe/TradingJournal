import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import "@/components/ui/custom-styles.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeStyles } from "@/components/theme/theme-styles";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          [role="checkbox"] {
            width: 16px !important;
            height: 16px !important;
            min-width: 16px !important;
            min-height: 16px !important;
            max-width: 16px !important;
            max-height: 16px !important;
            aspect-ratio: 1/1 !important;
            border-width: 1px !important;
            border-radius: 3px !important;
            padding: 0 !important;
          }
          
          [role="checkbox"] svg {
            width: 12px !important;
            height: 12px !important;
            min-width: 12px !important;
            min-height: 12px !important;
            max-width: 12px !important;
            max-height: 12px !important;
          }
        `}} />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ThemeStyles />
          <div className="min-h-screen flex items-center justify-center bg-background">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
} 