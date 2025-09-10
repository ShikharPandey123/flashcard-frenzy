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
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        if (error.message === "Email not confirmed") {
          setNeedsConfirmation(true);
          setError("Please check your email and click the confirmation link before signing in.");
          toast.error("Email not confirmed", {
            description: "Please check your email and click the confirmation link before signing in.",
          });
        } else if (error.message === "Invalid login credentials") {
          setError("Invalid email or password. Please try again.");
          toast.error("Login failed", {
            description: "Invalid email or password. Please try again.",
          });
        } else {
          setError(error.message);
          toast.error("Login failed", {
            description: error.message,
          });
        }
      } else {
        setSuccess(true);
        toast.success("Login successful!", {
        //   description: "Welcome back! Redirecting to dashboard...",
          duration: 1500,
        });
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      toast.error("Login failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function resendConfirmation() {
    if (!email) {
      setError("Please enter your email address first.");
      toast.error("Email required", {
        description: "Please enter your email address first.",
      });
      return;
    }

    setError(null);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        setError(error.message);
        toast.error("Failed to resend email", {
          description: error.message,
        });
      } else {
        setError("Confirmation email sent! Please check your inbox.");
        setNeedsConfirmation(false);
        toast.success("Email sent!", {
          description: "Confirmation email sent! Please check your inbox.",
        });
      }
    } catch (err) {
      setError("Failed to resend confirmation email. Please try again.");
      toast.error("Failed to resend email", {
        description: "Failed to resend confirmation email. Please try again.",
      });
      console.error("Resend confirmation error:", err);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-md overflow-hidden backdrop-blur-lg bg-white/90 border-white/30 shadow-2xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <CardHeader className="space-y-1 bg-white/80 backdrop-blur-sm">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
              <CardDescription className="text-gray-700">
                Enter your credentials to access your account
              </CardDescription>
            </motion.div>
          </CardHeader>
        </motion.div>
        
        <CardContent>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 p-3 rounded-md flex items-center gap-2 ${
                  error.includes("Confirmation email sent")
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <AlertCircle className={`h-4 w-4 ${
                  error.includes("Confirmation email sent") 
                    ? "text-blue-600" 
                    : "text-red-600"
                }`} />
                <span className={`text-sm ${
                  error.includes("Confirmation email sent")
                    ? "text-blue-800"
                    : "text-red-800"
                }`}>
                  {error}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4">
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </motion.div>
            
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 transition-all duration-200 focus:scale-[1.02]"
                />
                <motion.button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </motion.button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="space-y-3"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full relative overflow-hidden" 
                  disabled={isLoading || success}
                >
                  <motion.span
                    animate={isLoading ? { opacity: 0 } : { opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    Sign In
                  </motion.span>
                  
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span className="ml-2">Signing in...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
              
              <AnimatePresence>
                {needsConfirmation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full transition-all duration-200" 
                        onClick={resendConfirmation}
                      >
                        Resend Confirmation Email
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
