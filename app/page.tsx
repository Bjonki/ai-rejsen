import { CampScoutApp } from "@/components/camp-scout-app";
import { defaultSearchInput } from "@/lib/campscout/defaults";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-emerald-950/20 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <span className="inline-flex w-fit items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-emerald-200 uppercase">
            CampScout
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Browser-assisted availability checks without crossing the booking line.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              CampScout opens curated accommodation sources, tries safe search actions,
              captures screenshots as evidence, and compares what was verified,
              blocked, or still requires manual follow-up.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Initial scenario</p>
              <p>
                Vallåsen Bike Park · 20 Jul 2026 → 21 Jul 2026 · 2 adults ·
                children aged 8 and 5.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Safety guardrails</p>
              <p>
                No bookings, no payments, no account login, no CAPTCHA bypassing,
                and no pretending that unverified inventory is confirmed.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <p className="text-sm font-semibold tracking-[0.2em] text-slate-400 uppercase">
            Included in this build
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>• Next.js dashboard for running and reviewing scouting runs</li>
            <li>• Adapter-based Playwright runner with evidence screenshots</li>
            <li>• Configurable source registry with discovery-first behavior</li>
            <li>• JSON + Markdown outputs in /results/&lt;run&gt;/</li>
            <li>• CLI mode via npm run scout -- ...</li>
          </ul>
          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            This starter deliberately prefers honest manual-verification results
            over fragile scraping. Sources can be upgraded incrementally with
            site-specific adapters.
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-300 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="font-semibold text-white">1. Discover</p>
          <p className="mt-2">
            Start from curated sources, inspect the landing page, and identify
            likely booking or accommodation links before deeper checks.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="font-semibold text-white">2. Verify safely</p>
          <p className="mt-2">
            Try date and guest entry only when fields are clearly available, then
            classify each source as verified, unavailable, or manual.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="font-semibold text-white">3. Compare evidence</p>
          <p className="mt-2">
            Review prices, policy clues, booking URLs, notes, and screenshot
            paths in one comparison dashboard.
          </p>
        </div>
      </section>

      <CampScoutApp initialInput={defaultSearchInput} />
    </main>
  );
}
