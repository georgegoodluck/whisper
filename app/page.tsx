import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  MessageCircleQuestion,
  Shield,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Whisper";

  async function goToSpace(formData: FormData) {
    "use server";
    const code = String(formData.get("code") ?? "")
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9]{4,32}$/.test(code)) {
      // fall through — redirect back with an error
      const { redirect } = await import("next/navigation");
      redirect("/?error=invalid");
    }
    const { redirect } = await import("next/navigation");
    redirect(`/s/${code}`);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-base font-semibold tracking-tight">
                {appName}
              </h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">
                Anonymous Q&amp;A
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href={user ? "/admin/dashboard" : "/admin/login"}>
                <Shield className="h-4 w-4 mr-2" />
                {user ? "Dashboard" : "Admin"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 sm:py-24 max-w-2xl">
        <section className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            Ask anything. Anonymously.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto">
            Each community has its own space. Enter your invite code to ask
            questions and see answers.
          </p>
        </section>

        <form
          action={goToSpace}
          className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 sm:p-8"
        >
          <div className="flex items-center gap-2 mb-4 text-sm font-medium">
            <KeyRound className="h-4 w-4 text-primary" />
            Enter your invite code
          </div>
          <div className="flex gap-2">
            <Input
              name="code"
              placeholder="e.g. abc12xyz"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              required
              className="text-lg h-12 tracking-wider font-mono"
            />
            <Button
              type="submit"
              size="lg"
              className="bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
            >
              Enter <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Don&apos;t have a code? Ask the person who invited you.
          </p>
        </form>

        <div className="mt-12 grid sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl border border-border/60 p-5">
            <div className="font-semibold mb-1">🔒 Anonymous</div>
            <p className="text-muted-foreground text-xs">
              No account needed to ask. Your identity stays private.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-5">
            <div className="font-semibold mb-1">👥 Community</div>
            <p className="text-muted-foreground text-xs">
              Each invite code has its own admins and answers.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-5">
            <div className="font-semibold mb-1">🚀 Create your own</div>
            <p className="text-muted-foreground text-xs">
              Sign up as an overseer and get your own space.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="outline">
            <Link href="/signup">
              Create your own space <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
