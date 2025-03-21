import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/components/ui/custom-styles.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeStyles } from "@/components/theme/theme-styles";
import { TopNav } from "@/components/layout/TopNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/providers/toast-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Track your trading performance",
};

export default function RootLayout({
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
          <ToastProvider>
            <ThemeStyles />
            <div className="flex h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <TopNav />
                <main className="flex-1 overflow-y-auto">
                  <div className="p-6 w-full">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
