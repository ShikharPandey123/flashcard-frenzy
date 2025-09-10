"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface RegisterFormProps {
  onSuccessRedirect?: () => void;
}

export default function RegisterForm({ onSuccessRedirect }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Password strength checker
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 25;
    return strength;
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    setPasswordStrength(calculatePasswordStrength(pwd));
    setError(null);
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      toast.error("Passwords don't match", {
        description: "Please make sure both password fields are identical.",
      });
      return;
    }

    if (passwordStrength < 50) {
      setError("Password is too weak. Use at least 8 characters with uppercase, numbers, and symbols.");
      toast.error("Password too weak", {
        description: "Use at least 8 characters with uppercase, numbers, and symbols.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) {
        setError(error.message);
        toast.error("Registration failed", {
          description: error.message,
        });
      } else {
        setSuccess(true);
        toast.success("Account created successfully!", {
        //   description: "Please check your email for verification. Redirecting to sign in...",
          duration: 4000,
        });
        setTimeout(() => {
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setPasswordStrength(0);
          setSuccess(false);
          // Redirect to sign-in tab after successful registration
          if (onSuccessRedirect) {
            onSuccessRedirect();
          }
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      toast.error("Registration failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
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
              <CardTitle className="text-2xl font-bold text-gray-900">Create account</CardTitle>
              <CardDescription className="text-gray-700">
                Join Flashcard Frenzy and start learning today
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
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">Account created! Redirecting to sign in...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleRegister} className="space-y-4">
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
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
              <Label htmlFor="register-password">Password</Label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
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
              
              {/* Password Strength Indicator */}
              <AnimatePresence>
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1"
                  >
                    <div className="flex gap-1">
                      {[25, 50, 75, 100].map((threshold, index) => (
                        <motion.div
                          key={index}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            passwordStrength >= threshold
                              ? passwordStrength < 50
                                ? "bg-red-400"
                                : passwordStrength < 75
                                ? "bg-yellow-400"
                                : "bg-green-400"
                              : "bg-gray-200"
                          }`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: passwordStrength >= threshold ? 1 : 0 }}
                          transition={{ delay: index * 0.1 }}
                        />
                      ))}
                    </div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-xs ${
                        passwordStrength < 50
                          ? "text-red-600"
                          : passwordStrength < 75
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {passwordStrength < 25
                        ? "Very weak"
                        : passwordStrength < 50
                        ? "Weak"
                        : passwordStrength < 75
                        ? "Good"
                        : "Strong"}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`pr-10 transition-all duration-200 focus:scale-[1.02] ${
                    confirmPassword && password !== confirmPassword
                      ? "border-red-300 focus:border-red-500"
                      : confirmPassword && password === confirmPassword
                      ? "border-green-300 focus:border-green-500"
                      : ""
                  }`}
                />
                <motion.button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </motion.button>
              </div>
              
              <AnimatePresence>
                {confirmPassword && password !== confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-red-600"
                  >
                    Passwords don&apos;t match
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full relative overflow-hidden" 
                  disabled={isLoading || password !== confirmPassword || passwordStrength < 50}
                >
                  <motion.span
                    animate={isLoading ? { opacity: 0 } : { opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    Create Account
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
                        <span className="ml-2">Creating account...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
