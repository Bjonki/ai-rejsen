import path from "node:path";
import { mkdir } from "node:fs/promises";
import type { SearchInput } from "@/lib/campscout/schema";

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function createRunId(input: SearchInput) {
  const destinationSlug = slugify(input.destination) || "destination";
  return `${destinationSlug}-${input.checkin}`;
}

export function formatGuestSummary(input: SearchInput) {
  const children =
    input.childrenAges.length > 0
      ? `, ${input.childrenAges.length} children (${input.childrenAges.join(", ")})`
      : "";

  return `${input.adults} adults${children}`;
}

export function getOutputPaths(runId: string) {
  const relativeDir = path.posix.join("/results", runId);
  const publicDir = path.join(process.cwd(), "public", "results", runId);
  const screenshotDir = path.join(publicDir, "screenshots");

  return {
    relativeDir,
    publicDir,
    screenshotDir,
  };
}

export async function ensureRunDirectories(runId: string) {
  const paths = getOutputPaths(runId);
  await mkdir(paths.screenshotDir, { recursive: true });
  return paths;
}

export function buildScreenshotRelativePath(runId: string, filename: string) {
  return path.posix.join("/results", runId, "screenshots", filename);
}

export function safeFilename(value: string) {
  return `${slugify(value) || "item"}.png`;
}
