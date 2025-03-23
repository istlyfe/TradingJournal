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
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 