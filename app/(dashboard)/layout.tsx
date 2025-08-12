import { Inter } from "next/font/google";
import "../globals.css";
import "@/components/ui/custom-styles.css";
import { ThemeProviderWrapper } from "@/components/theme/ThemeProviderWrapper";
import { TopNav } from '@/components/TopNav';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Trading Journal - Dashboard",
  description: "Track your trading performance",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background p-3 sm:p-4 md:p-6 transition-all duration-300 md:ml-64">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 