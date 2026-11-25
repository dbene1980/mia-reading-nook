import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand/brand-logo";
import { OrnamentRule } from "@/components/brand/ornaments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Accedi · La Libreria di Daniele" },
      { name: "description", content: "Accedi alla Libreria di Daniele." },
      { property: "og:title", content: "Accedi · La Libreria di Daniele" },
      { property: "og:description", content: "Accedi alla Libreria di Daniele." },
    ],
  }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login") ? "Email o password non corretti" : error.message,
      );
      return;
    }
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen w-full max-w-full items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm min-w-0 animate-rise">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandLogo className="size-24" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Ex Libris</p>
          <h1 className="break-words text-2xl min-[480px]:text-3xl">La Libreria di Daniele</h1>
          <OrnamentRule className="w-48" />
          <p className="text-sm text-muted-foreground">Accedi per vedere i tuoi libri.</p>
        </div>
        <form
          onSubmit={submit}
          className="grid gap-4 ink-card p-6 shadow-lift"
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" disabled={loading} className="mt-2">
            {loading && <Loader2 className="animate-spin" />} Accedi
          </Button>
        </form>
      </div>
    </div>
  );
}
