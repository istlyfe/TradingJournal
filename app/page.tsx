"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, BarChart2, LayoutDashboard, LineChart, Calendar, Settings, CreditCard, ArrowRight, ChevronDown, TrendingUp, DollarSign, Target, Clock, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);
    setIsLoading(false);
    
    // If authenticated, redirect to dashboard
    if (authStatus) {
      router.push('/dashboard');
    }
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin mr-3 h-8 w-8 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  // If not authenticated, show the landing page
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                  TradingJournal
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                <Link 
                  href="#features" 
                  className="text-foreground/80 hover:text-primary transition-colors"
                >
                  Features
                </Link>
                <Link 
                  href="#how-it-works" 
                  className="text-foreground/80 hover:text-primary transition-colors"
                >
                  How It Works
                </Link>
              </div>
            </div>
            
            {/* Authentication Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/90 backdrop-blur-md pt-2 pb-3 px-4 border-b border-border/40">
            <div className="flex flex-col space-y-4">
              <Link 
                href="#features" 
                className="text-foreground/80 hover:text-primary transition-colors px-3 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#how-it-works" 
                className="text-foreground/80 hover:text-primary transition-colors px-3 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <div className="pt-4 flex flex-col space-y-3">
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Hero section with animated elements and gradient background */}
      <header className="relative pt-32 pb-32 overflow-hidden bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-background via-background to-primary/10">
        {/* Animated shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-24 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] pointer-events-none" />

        <div className="container relative mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center md:text-left"
            >
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Trading Journal</span>
                <span className="block mt-2 leading-tight">Elevate Your Trading Performance</span>
              </h1>
              <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto md:mx-0">
                Transform your trading strategy with data-driven insights. Track, analyze, and improve—all in one powerful platform designed for serious traders.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                <Button size="lg" className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white px-8 py-6 h-auto text-lg font-medium" asChild>
                  <Link href="/signup">
                    Start Trading Smarter
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-6 h-auto text-lg border-2" asChild>
                  <Link href="/login">
                    Login
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Hero image/mockup */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-16 rounded-xl shadow-2xl border border-border/40 bg-black/5 backdrop-blur-sm overflow-hidden"
            >
              <div className="rounded-t-lg bg-muted px-4 py-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="ml-2 text-xs text-muted-foreground">Trading Journal - Dashboard</div>
              </div>
              <img 
                src="/dashboard-preview.png" 
                alt="Trading Journal Dashboard Preview" 
                className="w-full object-cover shadow-md"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/1200x675/111827/6366f1?text=Trading+Journal+Dashboard&font=open-sans";
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-sm text-muted-foreground animate-bounce">
          <span>Scroll to explore</span>
          <ChevronDown className="h-5 w-5 mt-1" />
        </div>
      </header>
      
      {/* Stats section */}
      <section className="py-16 bg-background relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="text-primary text-4xl font-bold mb-2">78%</div>
              <div className="text-muted-foreground">Improve Win Rate</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="text-primary text-4xl font-bold mb-2">1,000+</div>
              <div className="text-muted-foreground">Active Traders</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="text-primary text-4xl font-bold mb-2">250K+</div>
              <div className="text-muted-foreground">Trades Analyzed</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <div className="text-primary text-4xl font-bold mb-2">42%</div>
              <div className="text-muted-foreground">Average P&L Increase</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features section with animated cards */}
      <section id="features" className="py-20 bg-muted/10 relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px] pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 inline">
              Powerful Features For Serious Traders
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Everything you need to track and analyze your trading performance with precision.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <LayoutDashboard className="h-6 w-6" />,
                title: "Comprehensive Dashboard",
                description: "Get a bird's eye view of your trading performance with real-time metrics and visualizations."
              },
              {
                icon: <BarChart2 className="h-6 w-6" />,
                title: "Advanced Analytics",
                description: "Drill down into your trading patterns to identify strengths and pinpoint areas for improvement."
              },
              {
                icon: <Calendar className="h-6 w-6" />,
                title: "Trading Calendar",
                description: "Visualize your trading frequency and performance on a daily, weekly, and monthly basis."
              },
              {
                icon: <LineChart className="h-6 w-6" />,
                title: "Performance Metrics",
                description: "Track your equity curve, win rate, profit factor, and other key performance indicators."
              },
              {
                icon: <CreditCard className="h-6 w-6" />,
                title: "Multi-Account Support",
                description: "Manage and track multiple trading accounts in one place for comprehensive analysis."
              },
              {
                icon: <Settings className="h-6 w-6" />,
                title: "Platform Integrations",
                description: "Easily import your trades from major platforms like TopstepX, Tradovate, and TradingView."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-8 bg-background rounded-xl shadow-sm border border-border/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How it works section */}
      <section id="how-it-works" className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Three simple steps to transform your trading performance
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 relative">
            {/* Connected line between steps */}
            <div className="hidden md:block absolute top-24 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-primary/30"></div>
            
            {[
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: "1. Log Your Trades",
                description: "Import trades from your platform or add them manually to build your trading database."
              },
              {
                icon: <Target className="h-8 w-8" />,
                title: "2. Analyze Performance",
                description: "Review detailed analytics and identify patterns in your trading behavior."
              },
              {
                icon: <DollarSign className="h-8 w-8" />,
                title: "3. Improve Results",
                description: "Apply insights to refine your strategy and boost your trading performance."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background text-primary relative z-10">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-10 sm:p-16 shadow-lg border border-primary/20"
          >
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to elevate your trading?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join thousands of traders who have transformed their results with data-driven insights.
              </p>
              <div className="mt-10">
                <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white px-8 py-6 h-auto text-lg font-medium" asChild>
                  <Link href="/signup">
                    Start Your Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="mt-4 text-sm text-muted-foreground">
                  No credit card required • Free forever plan available
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-border/40">
            <div>
              <h3 className="text-lg font-semibold mb-4">Trading Journal</h3>
              <p className="text-muted-foreground">
                Your all-in-one solution for tracking, analyzing, and improving your trading performance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/signup" className="text-muted-foreground hover:text-primary transition-colors">Get Started</Link></li>
                <li><Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">Login</Link></li>
                <li><Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} Trading Journal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
