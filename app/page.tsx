"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { safeNavigate } from "@/lib/browser-utils";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    try {
      setIsDemoLoading(true);
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const ok = res.ok;
      // Create NextAuth session for the demo user
      await signIn('credentials', { redirect: false, email: 'demo@example.com', password: 'demo123' });
      if (ok) {
        safeNavigate('/dashboard');
      }
    } catch (_) {
      // no-op
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <nav className="mx-auto max-w-6xl flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-bold text-lg">
          Trading Journal
        </Link>
        <div className="flex gap-3">
          {status === 'authenticated' ? (
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost">Sign In</Button></Link>
              <Link href="/signup"><Button>Sign Up</Button></Link>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Level up your trading with a smarter journal</h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Import trades, analyze performance, track psychology, and improve consistency with actionable insights.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {status === 'authenticated' ? (
              <Button size="lg" onClick={() => router.push('/dashboard')}>Open Dashboard</Button>
            ) : (
              <>
                <Link href="/signup"><Button size="lg">Get Started</Button></Link>
                <Link href="/login"><Button variant="outline" size="lg">Sign In</Button></Link>
                <Button variant="secondary" size="lg" onClick={handleTryDemo} disabled={isDemoLoading}>
                  {isDemoLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Loading Demo...</>) : 'Try Demo'}
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="border rounded-xl p-6 bg-card shadow-sm">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-muted">Win Rate, P&L, Streaks</div>
            <div className="p-4 rounded-lg bg-muted">Best Times & Setups</div>
            <div className="p-4 rounded-lg bg-muted">Risk & Drawdown</div>
            <div className="p-4 rounded-lg bg-muted">Mood & Notes</div>
          </div>
        </div>
      </section>
    </main>
  );
}
