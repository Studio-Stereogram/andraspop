import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AndrasLogo } from "@/components/brand/andras-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

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

const TOPICS = [
  "running a design studio, and changing one",
  "moving from client work to your own products",
  "AI in design work (the useful parts and the rest)",
  "switching careers into design",
  "vibecoding as a designer",
  "why restaurants matter more now",
  "tarot, for people who don't believe in tarot",
  "anything weird you're making",
];

const ELSEWHERE = [
  { label: "The annual report", href: "https://links.studiostereogram.com/21-26-annual-report", host: "studiostereogram.com" },
  { label: "The map of everything", href: "/", host: "andraspop.com" },
  { label: "Tendo", href: "https://tendo.sh", host: "tendo.sh" },
  { label: "Unwritten", href: "https://unwritten.cards", host: "unwritten.cards" },
];

function BookButton({ primary = false }: { primary?: boolean }) {
  return (
    <Button
      asChild
      variant={primary ? "default" : "outline"}
      className="h-11 w-full px-5 text-[15px] min-[480px]:w-auto [&_svg]:size-[18px]"
    >
      <a href={BOOKING_URL}>
        Pick a Wednesday slot
        <ArrowUpRight aria-hidden />
      </a>
    </Button>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-3 border-t border-line pt-7">
      <h2 id={id} className="m-0 text-[19px] leading-tight font-[650] tracking-[-.005em] text-ink [font-stretch:104%]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * /hi: open Wednesday conversations. One readable column, mobile-first, in the site's fonts, tokens and themes
 * (Dark by default, Paper via the toggle). Secondary text uses --ink-2: --ink-3 is too faint on Paper for body copy.
 */
export default function SayHiPage() {
  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="mx-auto flex w-full max-w-[36rem] items-center gap-3 px-4 pt-3">
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

      <main className="mx-auto w-full max-w-[36rem] px-4 pt-12 pb-20 max-[480px]:pt-9">
        <article className="grid gap-9 text-[17px] leading-[1.6] text-ink-2">
          <div className="grid gap-5">
            <h1 className="m-0 text-[48px] leading-none font-[650] tracking-[-.01em] text-ink [font-stretch:112%] max-[480px]:text-[42px]">
              Say hi
            </h1>
            <p className="m-0 text-[20px] leading-[1.4] text-balance text-ink">
              After 7,254 meetings, I&apos;m trying one with no agenda.
            </p>
            <p className="m-0">
              Every Wednesday I keep three 45-minute slots open. No pitch, nothing to prepare. Nothing gets recorded
              unless we both want it.
            </p>
            <div className="pt-1">
              <BookButton primary />
            </div>
          </div>

          <Section id="who" title="Who I am">
            <p className="m-0">
              I&apos;m András. I run Stereogram, a design studio in Budapest, and I&apos;m changing how it works.
              We&apos;re keeping some client work and making our own products, starting with Tendo and Unwritten.
              I&apos;ve also taught design to career changers for 6 years.
            </p>
          </Section>

          <Section id="topics" title="Happy to talk about">
            <ul className="m-0 grid list-none gap-2 p-0">
              {TOPICS.map((t) => (
                <li
                  key={t}
                  className="relative pl-5 before:absolute before:top-[.62em] before:left-0.5 before:size-[7px] before:bg-ink-2 before:content-['']"
                >
                  {t}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="why" title="Why it might be worth 45 minutes">
            <p className="m-0">
              You get an honest outside view from someone who&apos;s made a lot of these mistakes with real money. I
              get to meet people I wouldn&apos;t otherwise meet. Worst case, one of us learns something.
            </p>
            <div className="pt-2">
              <BookButton />
            </div>
          </Section>

          <nav aria-label="More from András" className="border-t border-line pt-7">
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
