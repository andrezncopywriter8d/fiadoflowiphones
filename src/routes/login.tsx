import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { AppLogo } from "@/components/layout/AppLogo";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar - Fiado." }] }),
  component: LoginPage,
});

const AUTH_RATE_LIMIT_SECONDS = 60;
const AUTH_RATE_LIMIT_KEY = "fiado-auth-rate-limit-until";

function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(window.localStorage.getItem(AUTH_RATE_LIMIT_KEY)) || 0;
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const rateLimitSecondsLeft = useMemo(
    () => Math.max(0, Math.ceil((rateLimitUntil - now) / 1000)),
    [now, rateLimitUntil],
  );

  if (!loading && session) return <Navigate to="/" />;

  function startRateLimit(seconds = AUTH_RATE_LIMIT_SECONDS) {
    const until = Date.now() + seconds * 1000;
    setRateLimitUntil(until);
    window.localStorage.setItem(AUTH_RATE_LIMIT_KEY, String(until));
  }

  function showAuthError(err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao autenticar";
    const normalized = message.toLowerCase();

    if (
      normalized.includes("email rate limit") ||
      normalized.includes("rate limit") ||
      normalized.includes("too many requests")
    ) {
      startRateLimit();
      toast.error("Muitas tentativas em pouco tempo. Aguarde 1 minuto e tente novamente.");
      return;
    }

    if (normalized.includes("invalid login credentials")) {
      toast.error("E-mail ou senha incorretos.");
      return;
    }

    if (
      normalized.includes("failed to fetch") ||
      normalized.includes("fetch failed") ||
      normalized.includes("networkerror") ||
      normalized.includes("network request failed")
    ) {
      toast.error("Nao consegui conectar ao Supabase. Verifique se o projeto esta ativo.");
      return;
    }

    if (normalized.includes("password should be at least")) {
      toast.error("Use uma senha com pelo menos 6 caracteres.");
      return;
    }

    if (normalized.includes("user already registered")) {
      toast.error("Esse e-mail já tem conta. Entre usando a senha cadastrada.");
      return;
    }

    toast.error(message);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rateLimitSecondsLeft > 0) {
      toast.error(`Aguarde ${rateLimitSecondsLeft}s antes de tentar novamente.`);
      return;
    }

    setSubmitting(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome: nome.trim() },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já está conectado.");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      showAuthError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full place-items-center bg-background p-4">
      <div className="w-full max-w-[440px] rounded-[28px] bg-surface p-8 shadow-float">
        <div className="mb-7">
          <AppLogo />
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Digite qualquer senha"
            />
          </Field>

          <button
            type="submit"
            disabled={submitting || rateLimitSecondsLeft > 0}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : rateLimitSecondsLeft > 0 ? (
              `Aguarde ${rateLimitSecondsLeft}s`
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
            className="font-medium text-primary hover:underline"
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
