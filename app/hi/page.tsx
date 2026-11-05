import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CodeXml,
  FlaskConical,
  GraduationCap,
  Handshake,
  Lightbulb,
  type LucideIcon,
  MoonStar,
  Rocket,
  Sparkles,
  Telescope,
  UtensilsCrossed,
} from "lucide-react";
import { AndrasLogo } from "@/components/brand/andras-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Portrait, Wave, Week } from "./illustrations";
import "./hi.css";

const BOOKING_URL = "https://calendly.com/stereogram/andraspop-45min";
const DESCRIPTION =
  "Every Wednesday András Pop keeps three 45-minute slots open for a conversation with no agenda. No pitch, nothing to prepare.";

export const metadata: Metadata = {
  title: "Say hi · András Pop",
  description: DESCRIPTION,
  alternates: { canonical: "/hi" },
  // The share image comes from ./opengraph-image.tsx and ./twitter-image.tsx.
  openGraph: {
    type: "website",
    url: "/hi",
    siteName: "András Pop",
    title: "Say hi",
    description: DESCRIPTION,
    locale: "en",
  },
  twitter: { card: "summary_large_image", title: "Say hi · András Pop", description: DESCRIPTION },
};

// Topic colours from the token palette (--topic-1 … --topic-10), one per conversation topic.
const TOPICS: { text: string; icon: LucideIcon; color: string }[] = [
  { text: "running a design studio, and changing one", icon: Building2, color: "var(--topic-1)" },
  { text: "moving from client work to your own products", icon: Rocket, color: "var(--topic-2)" },
  { text: "AI in design work (the useful parts and the rest)", icon: Sparkles, color: "var(--topic-5)" },
  { text: "switching careers into design", icon: GraduationCap, color: "var(--topic-7)" },
  { text: "vibecoding as a designer", icon: CodeXml, color: "var(--topic-8)" },
  { text: "why restaurants matter more now", icon: UtensilsCrossed, color: "var(--topic-3)" },
  { text: "tarot, for people who don't believe in tarot", icon: MoonStar, color: "var(--topic-4)" },
  { text: "anything weird you're making", icon: FlaskConical, color: "var(--topic-10)" },
];

// The "why" paragraph, one sentence per card.
const WHY: { text: string; icon: LucideIcon; color: string }[] = [
  {
    text: "You get an honest outside view from someone who's made a lot of these mistakes with real money.",
    icon: Telescope,
    color: "var(--topic-1)",
  },
  { text: "I get to meet people I wouldn't otherwise meet.", icon: Handshake, color: "var(--topic-2)" },
  { text: "Worst case, one of us learns something.", icon: Lightbulb, color: "var(--topic-10)" },
];

// Facts from "Who I am", as small tiles under the paragraph.
const FACTS = [
  { title: "Stereogram", meta: "Design studio · Budapest", href: null },
  { title: "Tendo", meta: "tendo.sh", href: "https://tendo.sh" },
  { title: "Unwritten", meta: "unwritten.cards", href: "https://unwritten.cards" },
  { title: "6 years", meta: "Teaching career changers", href: null },
];

const ELSEWHERE = [
  { label: "The annual report", href: "https://links.studiostereogram.com/21-26-annual-report", host: "studiostereogram.com" },
  { label: "The map of everything", href: "/", host: "andraspop.com" },
  { label: "Tendo", href: "https://tendo.sh", host: "tendo.sh" },
  { label: "Unwritten", href: "https://unwritten.cards", host: "unwritten.cards" },
];

function BookButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  return (
    <Button asChild variant={variant} className="h-11 w-full px-5 text-[15px] min-[480px]:w-auto [&_svg]:size-[18px]">
      <a href={BOOKING_URL}>
        Pick a Wednesday slot
        <ArrowUpRight aria-hidden />
      </a>
    </Button>
  );
}

function Icon({ icon: I, color }: { icon: LucideIcon; color: string }) {
  return (
    <span className="hi-icon" style={{ "--tc": color } as CSSProperties} aria-hidden>
      <I />
    </span>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <h2 id={id} className="m-0 text-[21px] leading-tight font-[650] tracking-[-.005em] text-ink [font-stretch:104%]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * /hi: open Wednesday conversations. One readable column, mobile-first, in the site's fonts and Dark/Paper themes,
 * with a warmer, illustrated palette scoped to this page (./hi.css). Secondary text uses --ink-2: --ink-3 is too faint
 * on Paper for body copy.
 */
export default function SayHiPage() {
  return (
    <div className="hi min-h-dvh bg-bg text-ink">
      <header className="mx-auto flex w-full max-w-[38rem] items-center gap-3 px-4 pt-3">
        <Link
          href="/"
          className="-mx-1.5 flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-1.5 text-ink no-underline"
          aria-label="mind-map: the map of everything András publishes"
        >
          <AndrasLogo className="size-[22px] flex-none" title="" aria-hidden />
          <span aria-hidden className="h-4 w-px flex-none bg-line-2" />
          <b className="text-[15px] font-[650] tracking-[.01em] whitespace-nowrap [font-stretch:112%]">mind-map</b>
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[38rem] px-4 pt-10 pb-20 max-[480px]:pt-7">
        <article className="grid gap-12 text-[17px] leading-[1.6] text-ink-2">
          {/* Hero: photo with a wave, the headline, the hook */}
          <div className="grid gap-5">
            <div className="flex items-end">
              <Portrait size={88} />
              <Wave size={64} className="-ml-5 [box-shadow:0_0_0_3px_var(--bg)]" />
            </div>
            <h1 className="m-0 text-[52px] leading-none font-[650] tracking-[-.01em] text-ink [font-stretch:112%] max-[480px]:text-[44px]">
              Say hi
            </h1>
            <p className="m-0 text-[21px] leading-[1.35] text-balance text-ink">
              After 7,254 meetings, I&apos;m trying one with no agenda.
            </p>
          </div>

          {/* The slot: where it lives in the week, then the booking button */}
          <div className="hi-card grid gap-5 p-5 max-[480px]:p-4">
            <Week />
            <p className="m-0">
              Every Wednesday I keep three 45-minute slots open. No pitch, nothing to prepare. Nothing gets recorded
              unless we both want it.
            </p>
            <div>
              <BookButton />
            </div>
          </div>

          <Section id="who" title="Who I am">
            <div className="hi-card grid gap-5 p-5 max-[480px]:p-4">
              <div className="flex items-start gap-4 max-[480px]:flex-col max-[480px]:gap-3">
                <Portrait size={64} />
                <p className="m-0">
                  I&apos;m András. I run Stereogram, a design studio in Budapest, and I&apos;m changing how it works.
                  We&apos;re keeping some client work and making our own products, starting with Tendo and Unwritten.
                  I&apos;ve also taught design to career changers for 6 years.
                </p>
              </div>
              <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
                {FACTS.map((f) => {
                  const body = (
                    <>
                      <span className="block text-[15px] leading-tight font-semibold text-ink">{f.title}</span>
                      <span className="mt-1 block truncate font-mono text-[11px] tracking-[.04em] text-ink-2">
                        {f.meta}
                      </span>
                    </>
                  );
                  return (
                    <li key={f.title} className="min-w-0">
                      {f.href ? (
                        <a
                          href={f.href}
                          className="block h-full rounded-lg bg-surface-2 px-3 py-2.5 no-underline transition-colors hover:bg-surface-3"
                        >
                          {body}
                        </a>
                      ) : (
                        <div className="h-full rounded-lg bg-surface-2 px-3 py-2.5">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </Section>

          <Section id="topics" title="Happy to talk about">
            <ul className="m-0 grid list-none gap-2 p-0 min-[560px]:grid-cols-2">
              {TOPICS.map((t) => (
                <li key={t.text} className="hi-card flex items-center gap-3 px-3 py-2.5 text-[15.5px] leading-snug text-ink">
                  <Icon icon={t.icon} color={t.color} />
                  <span>{t.text}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="why" title="Why it might be worth 45 minutes">
            <ul className="m-0 grid list-none gap-2 p-0">
              {WHY.map((w) => (
                <li key={w.text} className="hi-card flex items-start gap-3 px-4 py-3.5">
                  <Icon icon={w.icon} color={w.color} />
                  <p className="m-0 self-center">{w.text}</p>
                </li>
              ))}
            </ul>
          </Section>

          {/* Closing: the same invitation, warmer */}
          <div className="hi-card grid justify-items-start gap-4 p-5 [background:var(--hi-sun-soft)] max-[480px]:p-4">
            <div className="flex items-end">
              <Portrait size={56} />
              <Wave size={44} className="-ml-3.5 [box-shadow:0_0_0_3px_var(--hi-sun-soft)]" />
            </div>
            <p className="m-0 text-[19px] leading-snug font-semibold text-ink">Say hi</p>
            <BookButton />
          </div>

          <nav aria-label="More from András">
            <ul className="m-0 grid list-none gap-1 p-0">
              {ELSEWHERE.map((l) => {
                const internal = l.href.startsWith("/");
                return (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="group -mx-2 flex items-baseline gap-3 rounded-md px-2 py-2 text-ink no-underline hover:bg-surface"
                    >
                      <span className="font-medium underline decoration-line-2 underline-offset-4 group-hover:decoration-ink">
                        {l.label}
                      </span>
                      <span className="ml-auto truncate font-mono text-[12px] tracking-[.04em] text-ink-2">
                        {l.host}
                      </span>
                      {internal ? (
                        <ArrowRight aria-hidden className="size-4 flex-none self-center text-ink-2" />
                      ) : (
                        <ArrowUpRight aria-hidden className="size-4 flex-none self-center text-ink-2" />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </article>
      </main>
    </div>
  );
}
