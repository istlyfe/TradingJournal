"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const { signup, isLoading } = useAuth();

  // Password strength checker
  const getPasswordStrength = (pwd: string): { strength: string; color: string } => {
    if (!pwd) return { strength: "", color: "" };
    
    if (pwd.length < 6) return { strength: "Weak", color: "text-red-500" };
    if (pwd.length < 10) return { strength: "Medium", color: "text-yellow-500" };
    
    return { strength: "Strong", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    
    // Validation
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }

    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }

    // Simple email validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFormError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setFormError("Password is required");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    
    try {
      const success = await signup(name, email, password);
      
      if (success) {
        setFormSuccess("Your account has been created successfully!");
        toast({
          title: "Account created",
          description: "Welcome to Trading Journal! You've been signed in.",
        });
        
        // Slight delay before redirect to show success message
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setFormError("This email address is already in use. Please try another one or login instead.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setFormError("There was an error creating your account. Please try again later.");
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
        <p className="mt-2 text-muted-foreground">Create a new account</p>
      </div>
      
      <Card className="w-full">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Enter your details to create a trading journal account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            {formSuccess && (
              <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                <AlertDescription className="text-green-800">{formSuccess}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="focus:border-primary"
                autoComplete="name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="focus:border-primary"
                autoComplete="email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {password && (
                  <span className={`text-xs ${passwordStrength.color}`}>
                    {passwordStrength.strength}
                  </span>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="focus:border-primary"
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className={`focus:border-primary ${confirmPassword && password !== confirmPassword ? 'border-red-300' : ''}`}
                autoComplete="new-password"
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 