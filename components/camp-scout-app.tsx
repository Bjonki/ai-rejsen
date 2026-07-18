"use client";

import { useMemo, useState } from "react";
import type { ScoutRun, SearchInput } from "@/lib/campscout/schema";
import {
  accommodationTypeOptions,
  defaultSearchInput,
  sourceRegistry,
} from "@/lib/campscout/defaults";

type FormState = {
  destination: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: string;
  accommodationTypes: string[];
};

const statusTone: Record<string, string> = {
  VERIFIED_AVAILABLE:
    "border-emerald-400/30 bg-emerald-400/15 text-emerald-100",
  VERIFIED_UNAVAILABLE: "border-rose-400/30 bg-rose-400/15 text-rose-100",
  COULD_NOT_VERIFY: "border-slate-400/30 bg-slate-400/15 text-slate-100",
  MANUAL_VERIFICATION_REQUIRED:
    "border-amber-400/30 bg-amber-400/15 text-amber-100",
};

function toFormState(input: SearchInput): FormState {
  return {
    destination: input.destination,
    checkin: input.checkin,
    checkout: input.checkout,
    adults: input.adults,
    children: input.childrenAges.join(","),
    accommodationTypes: [...input.accommodationTypes],
  };
}

function parseFormState(form: FormState): SearchInput {
  const childrenAges = form.children
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  return {
    ...defaultSearchInput,
    destination: form.destination.trim(),
    checkin: form.checkin,
    checkout: form.checkout,
    adults: Number(form.adults),
    childrenAges,
    accommodationTypes: form.accommodationTypes as SearchInput["accommodationTypes"],
  };
}

export function CampScoutApp({
  initialInput,
}: {
  initialInput: SearchInput;
}) {
  const [form, setForm] = useState<FormState>(toFormState(initialInput));
  const [run, setRun] = useState<ScoutRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enabledSources = useMemo(
    () => sourceRegistry.filter((source) => source.enabled),
    [],
  );

  const updateType = (type: string) => {
    setForm((current) => {
      const nextTypes = current.accommodationTypes.includes(type)
        ? current.accommodationTypes.filter((item) => item !== type)
        : [...current.accommodationTypes, type];

      return {
        ...current,
        accommodationTypes: nextTypes.length
          ? nextTypes
          : [...defaultSearchInput.accommodationTypes],
      };
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/scout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parseFormState(form)),
      });

      const payload = (await response.json()) as ScoutRun | { error?: string };

      if (!response.ok || "error" in payload) {
        throw new Error(payload.error ?? "CampScout could not complete the run.");
      }

      setRun(payload);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "CampScout could not complete the run.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-slate-400 uppercase">
              Run a scouting pass
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Configure the trip search
            </h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {enabledSources.length} enabled sources
          </span>
        </div>

        <form className="mt-6 space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="destination">
              Destination
            </label>
            <input
              id="destination"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none ring-0 transition focus:border-emerald-400/50"
              value={form.destination}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  destination: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="checkin">
                Check-in
              </label>
              <input
                id="checkin"
                type="date"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400/50"
                value={form.checkin}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    checkin: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="checkout">
                Check-out
              </label>
              <input
                id="checkout"
                type="date"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400/50"
                value={form.checkout}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    checkout: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="adults">
                Adults
              </label>
              <input
                id="adults"
                type="number"
                min={1}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400/50"
                value={form.adults}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    adults: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="children">
                Children ages
              </label>
              <input
                id="children"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400/50"
                placeholder="8,5"
                value={form.children}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    children: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-200">Accommodation types</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {accommodationTypeOptions.map((type) => {
                const active = form.accommodationTypes.includes(type);

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateType(type)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      active
                        ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                        : "border-white/10 bg-slate-950/70 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Guardrails</p>
            <ul className="mt-2 space-y-1">
              <li>• Browser flow stops before reservation or payment.</li>
              <li>• CAPTCHA, login, or anti-bot friction becomes manual verification.</li>
              <li>• Screenshots are stored for each inspected source.</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
          >
            {isSubmitting ? "Running CampScout…" : "Run CampScout"}
          </button>
        </form>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6">
          <p className="text-sm font-semibold tracking-[0.2em] text-slate-400 uppercase">
            Curated source registry
          </p>
          <div className="mt-3 grid gap-3">
            {enabledSources.map((source) => (
              <div
                key={source.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{source.name}</p>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-xs uppercase text-slate-300">
                    {source.sourceType}
                  </span>
                </div>
                <p className="mt-2 break-all text-xs text-slate-400">{source.baseUrl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-slate-400 uppercase">
              Comparison dashboard
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {run ? run.runLabel : "Awaiting first run"}
            </h2>
          </div>
          {run ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {run.results.length} results
            </span>
          ) : null}
        </div>

        {!run ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-slate-950/60 p-6 text-sm leading-7 text-slate-300">
            Run CampScout to generate a comparison dashboard, result files, and
            screenshot evidence for the configured trip.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Output folder</p>
              <p className="mt-2 break-all text-slate-400">{run.outputDir}</p>
            </div>

            {run.results.map((result) => (
              <article
                key={`${result.sourceId}-${result.bookingUrl}`}
                className="rounded-3xl border border-white/10 bg-slate-950/75 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">
                      {result.accommodationName}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{result.sourceName}</p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${statusTone[result.availabilityStatus] ?? statusTone.COULD_NOT_VERIFY}`}
                  >
                    {result.availabilityStatus}
                  </span>
                </div>

                <dl className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Type</dt>
                    <dd className="mt-1 text-white">{result.accommodationType}</dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Price</dt>
                    <dd className="mt-1 text-white">
                      {result.price ? `${result.price} ${result.currency ?? ""}`.trim() : "—"}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Fees</dt>
                    <dd className="mt-1 text-white">{result.mandatoryFees ?? "—"}</dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Distance</dt>
                    <dd className="mt-1 text-white">
                      {typeof result.distanceKm === "number"
                        ? `${result.distanceKm.toFixed(1)} km`
                        : "Not verified"}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Check-in/out</dt>
                    <dd className="mt-1 text-white">
                      {result.checkInTime ?? "—"} / {result.checkOutTime ?? "—"}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      Cancellation
                    </dt>
                    <dd className="mt-1 text-white">{result.cancellationPolicy ?? "—"}</dd>
                  </div>
                </dl>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Booking URL
                    </p>
                    <a
                      className="mt-1 block break-all text-emerald-200 hover:text-emerald-100"
                      href={result.bookingUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {result.bookingUrl}
                    </a>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Notes</p>
                    <p className="mt-1 whitespace-pre-line text-slate-200">
                      {result.notes || "No extra notes."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Screenshot evidence
                    </p>
                    <ul className="mt-2 space-y-1 text-slate-300">
                      {result.screenshotPaths.map((path) => (
                        <li key={path} className="break-all text-xs">
                          {path}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
