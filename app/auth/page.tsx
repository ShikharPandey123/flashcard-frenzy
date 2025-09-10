"use client";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  async function signIn(): Promise<void> {
    await supabase.auth.signInWithPassword({ email, password });
  }

  async function signUp(): Promise<void> {
    await supabase.auth.signUp({ email, password });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        placeholder="Email"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
      />
      <input
        placeholder="Password"
        type="password"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setPassword(e.target.value)
        }
      />
      <button onClick={signIn}>Login</button>
      <button onClick={signUp}>Register</button>
    </div>
  );
}
