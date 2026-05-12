import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Fiado." }] }),
  component: LoginPage,
});

function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Navigate to="/" />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já está conectado.");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao autenticar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background p-4 grid place-items-center">
      <div className="w-full max-w-[440px] rounded-[28px] bg-surface p-8 shadow-float">
        <div className="flex items-center gap-3 mb-7">
          <div className="relative h-10 w-10 rounded-full bg-primary grid place-items-center">
            <span className="text-primary-foreground text-sm font-semibold">F</span>
            <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-surface" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            Fia<span className="text-primary">do</span>.
          </span>
        </div>

        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
          {mode === "login" ? "Entrar na sua conta" : "Criar nova conta"}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {mode === "login"
            ? "Acesse seu painel financeiro."
            : "Comece a controlar suas vendas fiadas em segundos."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          {mode === "signup" && (
            <Field label="Nome">
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="auth-input"
                placeholder="Seu nome"
              />
            </Field>
          )}
          <Field label="E-mail">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="voce@loja.com"
            />
          </Field>
          <Field label="Senha">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Entrar" : "Criar conta"}
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-muted-foreground">
          {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary font-medium hover:underline"
          >
            {mode === "login" ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
      <style>{`
        .auth-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 12px;
          background: var(--color-surface-muted);
          border: 1px solid var(--color-border);
          font-size: 13px;
          color: var(--color-foreground);
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .auth-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
