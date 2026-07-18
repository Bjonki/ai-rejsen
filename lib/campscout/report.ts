import type { ScoutRun } from "@/lib/campscout/schema";
import { formatGuestSummary } from "@/lib/campscout/utils";

function escapeCell(value: string | null | undefined) {
  return (value ?? "—").replace(/\|/g, "\\|").replace(/\n/g, "<br/>");
}

export function buildMarkdownReport(run: ScoutRun) {
  const lines = [
    `# CampScout report — ${run.runLabel}`,
    "",
    `- Generated: ${run.generatedAt}`,
    `- Destination: ${run.input.destination}`,
    `- Dates: ${run.input.checkin} → ${run.input.checkout}`,
    `- Guests: ${formatGuestSummary(run.input)}`,
    `- Accommodation types: ${run.input.accommodationTypes.join(", ")}`,
    `- Search radii: ${run.input.searchRadiusKm.join(", ")} km`,
    "",
    "| Source | Accommodation | Status | Type | Price | Distance | Booking URL | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const result of run.results) {
    lines.push(
      `| ${escapeCell(result.sourceName)} | ${escapeCell(result.accommodationName)} | ${escapeCell(result.availabilityStatus)} | ${escapeCell(result.accommodationType)} | ${escapeCell(
        result.price ? `${result.price} ${result.currency ?? ""}`.trim() : null,
      )} | ${escapeCell(
        typeof result.distanceKm === "number"
          ? `${result.distanceKm.toFixed(1)} km`
          : null,
      )} | ${escapeCell(result.bookingUrl)} | ${escapeCell(result.notes)} |`,
    );
  }

  lines.push("", "## Screenshot evidence", "");

  for (const result of run.results) {
    lines.push(`### ${result.accommodationName}`, "");
    for (const screenshot of result.screenshotPaths) {
      lines.push(`- ${screenshot}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}
