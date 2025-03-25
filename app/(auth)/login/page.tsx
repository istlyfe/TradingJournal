"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { safeNavigate } from "@/lib/browser-utils";

// Loading fallback component
function LoginPageLoader() {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md px-4">
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

// The actual login page content
function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get('redirect') || '/dashboard';
  const { toast } = useToast();
  const { login, isLoading, isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isAuthenticated && !isLoading) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, isLoading, router, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    // Simple validation
    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }

    if (!password) {
      setFormError("Password is required");
      return;
    }
    
    try {
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in",
        });
        
        // Safely navigate to redirectPath
        safeNavigate(redirectPath);
      } else {
        setFormError("Invalid email or password. Please check your credentials and try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setFormError("There was an error logging in. Please try again later.");
    }
  };

  // Demo login handler
  const handleDemoLogin = async () => {
    try {
      setIsDemoLoading(true);
      setFormError("");
      
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: "Demo mode activated!",
          description: "You're now using a demo account with sample data",
        });
        
        // Safely navigate to redirectPath
        safeNavigate(redirectPath);
      } else {
        setFormError("Failed to login with demo account. Please try again.");
      }
    } catch (error) {
      console.error("Demo login error:", error);
      setFormError("There was an error with the demo login. Please try again later.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md px-4">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            Trading Journal
          </h1>
        </Link>
        <p className="mt-2 text-muted-foreground">Sign in to your account</p>
      </div>
      
      <Card className="w-full">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your details to sign into your account
            </CardDescription>
          </CardHeader>
          
          {/* Demo account info box */}
          <div className="mx-6 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800">Demo Account</h3>
            <p className="text-xs text-blue-700 mt-1">
              Email: demo@example.com<br/>
              Password: demo123
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Or click the "Try Demo Mode" button below for instant access
            </p>
          </div>
          
          <CardContent className="space-y-4">
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isDemoLoading}
                className="focus:border-primary"
                autoComplete="email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isDemoLoading}
                className="focus:border-primary"
                autoComplete="current-password"
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700" 
              disabled={isLoading || isDemoLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            
            <div className="relative flex items-center justify-center w-full">
              <div className="border-t border-gray-200 dark:border-gray-700 w-full"></div>
              <span className="bg-card px-2 text-xs text-muted-foreground absolute">OR</span>
            </div>
            
            <Button 
              type="button" 
              variant="outline"
              className="w-full"
              onClick={handleDemoLogin}
              disabled={isLoading || isDemoLoading}
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Demo...
                </>
              ) : (
                "Try Demo Mode"
              )}
            </Button>
            
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Demo account: demo@example.com / password</p>
      </div>
    </div>
  );
}

// Default export with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoader />}>
      <LoginPageContent />
    </Suspense>
  );
} 