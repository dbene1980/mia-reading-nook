import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Library, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Accedi · La mia libreria" },
      { name: "description", content: "Accedi alla tua libreria personale." },
      { property: "og:title", content: "Accedi · La mia libreria" },
      { property: "og:description", content: "Accedi alla tua libreria personale." },
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lift">
            <Library className="size-6" />
          </span>
          <h1 className="text-3xl font-medium">La mia libreria</h1>
          <p className="text-sm text-muted-foreground">Accedi per vedere i tuoi libri.</p>
        </div>
        <form
          onSubmit={submit}
          className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-lift"
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
