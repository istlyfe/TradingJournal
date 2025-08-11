import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Forgot Password - Trading Journal",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md px-4">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            Trading Journal
          </h1>
        </Link>
        <p className="mt-2 text-muted-foreground">Password reset</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Password reset via email will be available shortly. For now, use the demo account or create a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link href="/login"><Button variant="outline">Back to Sign In</Button></Link>
          <Link href="/signup"><Button>Create Account</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}


