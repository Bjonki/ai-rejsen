import { describe, expect, it } from "vitest";
import { buildMarkdownReport } from "@/lib/campscout/report";
import { defaultSearchInput } from "@/lib/campscout/defaults";
import { createRunId, formatGuestSummary, slugify } from "@/lib/campscout/utils";

describe("CampScout helpers", () => {
  it("creates a stable run id from destination and date", () => {
    expect(createRunId(defaultSearchInput)).toBe("vallasen-bike-park-sweden-2026-07-20");
  });

  it("formats guest summaries with child ages", () => {
    expect(formatGuestSummary(defaultSearchInput)).toBe("2 adults, 2 children (8, 5)");
  });

  it("slugifies accented text", () => {
    expect(slugify("Vallåsen Bike Park")).toBe("vallasen-bike-park");
  });

  it("renders markdown rows for results", () => {
    const markdown = buildMarkdownReport({
      runId: "demo",
      runLabel: "Demo run",
      generatedAt: "2026-07-18T00:00:00.000Z",
      outputDir: "/results/demo",
      input: defaultSearchInput,
      results: [
        {
          sourceId: "booking",
          sourceName: "Booking.com",
          sourceType: "aggregator",
          accommodationName: "Sample cabin",
          accommodationType: "cabin",
          availabilityStatus: "COULD_NOT_VERIFY",
          price: "1499",
          currency: "SEK",
          mandatoryFees: null,
          cancellationPolicy: null,
          distanceKm: null,
          checkInTime: null,
          checkOutTime: null,
          bookingUrl: "https://example.com",
          notes: "Manual follow-up needed.",
          screenshotPaths: ["/results/demo/screenshots/booking.png"],
          discoveredUrls: [],
          checkedAt: "2026-07-18T00:00:00.000Z",
        },
      ],
    });

    expect(markdown).toContain("CampScout report");
    expect(markdown).toContain("Sample cabin");
    expect(markdown).toContain("/results/demo/screenshots/booking.png");
  });
});
