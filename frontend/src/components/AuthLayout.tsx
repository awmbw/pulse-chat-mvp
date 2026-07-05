import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-8 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <span className="font-serif text-sm text-primary-foreground">P</span>
          </div>
          <span className="font-serif text-lg text-foreground">Pulse Chat</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col justify-center w-full max-w-md mx-auto px-6 pb-24">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
          {children}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
      </main>
    </div>
  );
}
