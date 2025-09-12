"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setNeedsConfirmation(false);
    setSuccess(false);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        if (loginError.message.includes("Email not confirmed")) {
          setNeedsConfirmation(true);
          setError("Please check your email and click the confirmation link before signing in.");
          toast.error("Email not confirmed", { description: "Please confirm your email first." });
        } else {
          setError("Invalid email or password. Please try again.");
          toast.error("Login failed", { description: "Invalid email or password." });
        }
      } else {
        setSuccess(true);
        toast.success("Login successful!", { duration: 1500 });
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("Login failed", { description: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  }

  async function resendConfirmation() {
    if (!email) {
      setError("Please enter your email first.");
      toast.error("Email required", { description: "Please enter your email first." });
      return;
    }

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });

      if (resendError) {
        setError(resendError.message);
        toast.error("Failed to resend email", { description: resendError.message });
      } else {
        setError("Confirmation email sent! Please check your inbox.");
        setNeedsConfirmation(false);
        toast.success("Email sent!", { description: "Check your inbox for the confirmation link." });
      }
    } catch (err) {
      console.error("Resend confirmation error:", err);
      setError("Failed to resend confirmation email. Please try again.");
      toast.error("Failed to resend email", { description: "Please try again." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="w-full max-w-md overflow-hidden backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
        <CardHeader className="space-y-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white relative overflow-hidden">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription className="text-purple-100">Enter your credentials to access your account</CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                  error.includes("Confirmation email sent") ? "bg-blue-50 border border-blue-200" : "bg-red-50 border border-red-200"
                }`}
              >
                <AlertCircle className={`h-4 w-4 ${error.includes("Confirmation email sent") ? "text-blue-600" : "text-red-600"}`} />
                <span className={`text-sm ${error.includes("Confirmation email sent") ? "text-blue-800" : "text-red-800"}`}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Button type="submit" disabled={isLoading || success} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              {needsConfirmation && (
                <Button type="button" variant="outline" onClick={resendConfirmation} className="w-full border-2 border-purple-200 text-purple-700">
                  Resend Confirmation Email
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
