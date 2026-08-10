import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PRINCIPLES = [
  {
    title: "Human approves every step",
    body: "Nothing is ever submitted automatically. You review every tailored résumé, cover letter, and application before it goes anywhere.",
  },
  {
    title: "No fabricated experience",
    body: "AI can rewrite and reorganize your verified facts, but it can never invent a skill, title, date, or metric you didn't provide.",
  },
  {
    title: "Only permitted sources",
    body: "Official APIs, approved feeds, and job URLs you supply — never LinkedIn scraping, CAPTCHA bypassing, or anti-bot evasion.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold">JobPilot</span>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" render={<Link href="/sign-in" />}>
              Sign in
            </Button>
            <Button render={<Link href="/register" />}>Create account</Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-16">
        <section className="flex flex-col gap-6">
          <Badge variant="secondary" className="w-fit">
            Phase 1 — architecture &amp; foundations
          </Badge>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            An AI-assisted job search that keeps you in control.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Upload a master résumé, describe the roles you want, and let
            JobPilot find, rank, and tailor applications for your review —
            never submitted without your explicit approval.
          </p>
          <div className="flex gap-3">
            <Button size="lg" render={<Link href="/register" />}>
              Get started
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/sign-in" />}
            >
              I already have an account
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map((principle) => (
            <Card key={principle.title}>
              <CardHeader>
                <CardTitle className="text-base">{principle.title}</CardTitle>
                <CardDescription>{principle.body}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        JobPilot is a personal learning project. See{" "}
        <code className="rounded bg-muted px-1 py-0.5">ARCHITECTURE.md</code>{" "}
        for the compliance rules and phased roadmap.
      </footer>
    </div>
  );
}
