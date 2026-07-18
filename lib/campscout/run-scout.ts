import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { buildMarkdownReport } from "@/lib/campscout/report";
import { defaultSearchInput, sourceRegistry } from "@/lib/campscout/defaults";
import { resolveAdapter } from "@/lib/campscout/adapters";
import { scoutRunSchema, searchInputSchema, type ScoutRun } from "@/lib/campscout/schema";
import { createRunId, ensureRunDirectories, formatGuestSummary } from "@/lib/campscout/utils";

export async function runScout(
  rawInput: Partial<Parameters<typeof searchInputSchema.parse>[0]>,
  options?: {
    headless?: boolean;
  },
) {
  const input = searchInputSchema.parse({
    ...defaultSearchInput,
    ...rawInput,
  });
  const runId = createRunId(input);
  const outputPaths = await ensureRunDirectories(runId);
  const browser = await chromium.launch({
    headless: options?.headless ?? true,
  });

  try {
    const browserContext = await browser.newContext({
      locale: "en-GB",
      timezoneId: "Europe/Stockholm",
      viewport: { width: 1440, height: 1024 },
    });

    const sources = sourceRegistry
      .filter((source) => source.enabled)
      .slice(0, input.maxSources);
    const results = [];

    for (const source of sources) {
      const adapter = resolveAdapter(source);
      const result = await adapter.search({
        source,
        input,
        context: {
          browserContext,
          runId,
          screenshotDir: outputPaths.screenshotDir,
        },
      });
      results.push(result);
    }

    await browserContext.close();

    const run: ScoutRun = scoutRunSchema.parse({
      runId,
      runLabel: `${input.destination} · ${input.checkin} → ${input.checkout}`,
      generatedAt: new Date().toISOString(),
      outputDir: outputPaths.relativeDir,
      input,
      results,
    });

    await writeFile(
      `${outputPaths.publicDir}/results.json`,
      JSON.stringify(run, null, 2),
      "utf8",
    );
    await writeFile(
      `${outputPaths.publicDir}/report.md`,
      buildMarkdownReport(run),
      "utf8",
    );

    return run;
  } finally {
    await browser.close();
  }
}

export function summarizeRun(run: ScoutRun) {
  const counts = run.results.reduce<Record<string, number>>((accumulator, result) => {
    accumulator[result.availabilityStatus] =
      (accumulator[result.availabilityStatus] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    runId: run.runId,
    outputDir: run.outputDir,
    destination: run.input.destination,
    dates: `${run.input.checkin} -> ${run.input.checkout}`,
    guests: formatGuestSummary(run.input),
    counts,
  };
}
