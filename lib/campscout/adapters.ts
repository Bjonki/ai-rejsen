import path from "node:path";
import type { BrowserContext, Page } from "playwright";
import type {
  AccommodationSource,
  AvailabilityStatus,
  ScoutResult,
  SearchInput,
} from "@/lib/campscout/schema";
import { buildScreenshotRelativePath, safeFilename } from "@/lib/campscout/utils";

type AdapterContext = {
  browserContext: BrowserContext;
  runId: string;
  screenshotDir: string;
};

type SearchRequest = {
  source: AccommodationSource;
  input: SearchInput;
  context: AdapterContext;
};

export interface AvailabilityAdapter {
  id: string;
  canHandle(source: AccommodationSource): boolean;
  search(request: SearchRequest): Promise<ScoutResult>;
}

const ACCEPT_BUTTON_LABELS = [
  "Accept",
  "Accept all",
  "Allow all",
  "I agree",
  "OK",
  "Got it",
];

const SEARCH_BUTTON_PATTERNS = [
  /search/i,
  /check availability/i,
  /book/i,
  /find/i,
  /show stays/i,
];

const BOOKING_LINK_PATTERNS = [
  /book/i,
  /reserve/i,
  /reservation/i,
  /availability/i,
  /accommodation/i,
  /cabin/i,
  /camp/i,
  /room/i,
  /pitch/i,
  /glamping/i,
];

function extractCurrencyAndPrice(text: string) {
  const leadingCurrency = text.match(/(SEK|EUR|DKK|NOK|USD)\s?(\d[\d.,]*)/i);
  if (leadingCurrency) {
    return {
      currency: leadingCurrency[1]?.toUpperCase() ?? null,
      price: leadingCurrency[2] ?? null,
    };
  }

  const trailingCurrency = text.match(/(\d[\d.,]*)\s?(SEK|EUR|DKK|NOK|USD|kr)/i);
  if (trailingCurrency) {
    return {
      currency: trailingCurrency[2]?.toUpperCase() ?? null,
      price: trailingCurrency[1] ?? null,
    };
  }

  return { price: null, currency: null };
}

function extractPolicy(text: string, keyword: RegExp) {
  const sentence = text
    .split(/(?<=[.!?])\s+/)
    .find((entry) => keyword.test(entry) && entry.length <= 240);

  return sentence ?? null;
}

function extractTime(text: string, label: RegExp) {
  const match = text.match(
    new RegExp(
      `${label.source}[^\\d]{0,20}(\\d{1,2}(?::|\\.)\\d{2}|\\d{1,2}\\s?(?:am|pm))`,
      "i",
    ),
  );

  return match?.[1] ?? null;
}

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function inferAccommodationType(source: AccommodationSource, text: string) {
  if (/glamping/i.test(text)) {
    return "glamping";
  }
  if (/cabin|hut|stuga/i.test(text)) {
    return "cabin";
  }
  if (/tent|pitch|camping/i.test(text)) {
    return "tent-pitch";
  }
  if (/family room/i.test(text)) {
    return "family-room";
  }
  if (source.sourceType === "aggregator") {
    return "mixed";
  }

  return "unknown";
}

function inferAvailabilityStatus(
  source: AccommodationSource,
  text: string,
): AvailabilityStatus {
  if (
    source.requiresManualReview ||
    /captcha|access denied|forbidden|sign in|log in|robot|verify you are human/i.test(
      text,
    )
  ) {
    return "MANUAL_VERIFICATION_REQUIRED";
  }

  if (
    /sold out|no availability|not available|fully booked|no rooms available/i.test(
      text,
    )
  ) {
    return "VERIFIED_UNAVAILABLE";
  }

  if (
    /available|book now|reserve now|choose room|choose cabin|select pitch|show prices/i.test(
      text,
    )
  ) {
    return "VERIFIED_AVAILABLE";
  }

  return "COULD_NOT_VERIFY";
}

async function maybeAcceptCookies(page: Page) {
  for (const label of ACCEPT_BUTTON_LABELS) {
    const button = page.getByRole("button", { name: label });
    if ((await button.count()) > 0) {
      try {
        await button.first().click({ timeout: 1000 });
        return;
      } catch {
        // ignore
      }
    }
  }
}

async function fillFirstVisible(
  page: Page,
  selectors: string[],
  value: string | number,
) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) === 0) {
      continue;
    }

    try {
      await locator.fill(String(value), { timeout: 1000 });
      return true;
    } catch {
      // ignore and continue
    }
  }

  return false;
}

async function maybeFillSearch(page: Page, input: SearchInput) {
  const notes: string[] = [];

  const checkinFilled = await fillFirstVisible(
    page,
    [
      'input[type="date"][name*="check"]',
      'input[type="date"][name*="arrival"]',
      'input[type="date"][name*="from"]',
      'input[type="date"]',
      'input[name*="check"][placeholder*="check"]',
    ],
    input.checkin,
  );

  const checkoutFilled = await fillFirstVisible(
    page,
    [
      'input[type="date"][name*="out"]',
      'input[type="date"][name*="departure"]',
      'input[type="date"][name*="to"]',
      'input[name*="depart"]',
      'input[name*="checkout"]',
    ],
    input.checkout,
  );

  const adultsFilled = await fillFirstVisible(
    page,
    [
      'input[type="number"][name*="adult"]',
      'select[name*="adult"]',
      'input[name*="guest"]',
      'select[name*="guest"]',
    ],
    input.adults,
  );

  if (!checkinFilled) {
    notes.push("Check-in field was not confidently detected.");
  }
  if (!checkoutFilled) {
    notes.push("Check-out field was not confidently detected.");
  }
  if (!adultsFilled) {
    notes.push("Guest-count field was not confidently detected.");
  }

  for (const pattern of SEARCH_BUTTON_PATTERNS) {
    const button = page.getByRole("button", { name: pattern });
    if ((await button.count()) > 0) {
      try {
        await button.first().click({ timeout: 1500 });
        await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
        notes.push("Triggered a visible search button.");
        return notes;
      } catch {
        // ignore
      }
    }
  }

  notes.push("No safe search button was triggered automatically.");
  return notes;
}

async function captureScreenshot({
  page,
  source,
  context,
}: {
  page: Page;
  source: AccommodationSource;
  context: AdapterContext;
}) {
  const filename = safeFilename(source.id);
  const absolutePath = path.join(context.screenshotDir, filename);
  await page.screenshot({ path: absolutePath, fullPage: true });
  return buildScreenshotRelativePath(context.runId, filename);
}

async function extractDiscoveredUrls(page: Page) {
  const links = await page
    .locator("a[href]")
    .evaluateAll((elements) =>
      elements
        .map((element) => {
          const href = element.getAttribute("href");
          const text = element.textContent?.trim() ?? "";
          return { href, text };
        })
        .filter(
          (entry) =>
            typeof entry.href === "string" &&
            entry.href.length > 0 &&
            entry.href.startsWith("http"),
        ),
    )
    .catch(() => [] as { href: string | null; text: string }[]);

  return dedupe(
    links
      .filter((entry) =>
        BOOKING_LINK_PATTERNS.some(
          (pattern) => pattern.test(entry.href ?? "") || pattern.test(entry.text),
        ),
      )
      .map((entry) => entry.href ?? ""),
  ).slice(0, 8);
}

class ManualOnlyAdapter implements AvailabilityAdapter {
  id = "manual-only";

  canHandle(source: AccommodationSource) {
    return source.adapter === this.id || source.sourceType === "manual";
  }

  async search({ source, context }: SearchRequest): Promise<ScoutResult> {
    const page = await context.browserContext.newPage();

    try {
      await page.goto(source.baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      await maybeAcceptCookies(page);
      const screenshot = await captureScreenshot({ page, source, context });

      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.sourceType,
        accommodationName: source.name,
        accommodationType: "discovery-only",
        availabilityStatus: "MANUAL_VERIFICATION_REQUIRED",
        price: null,
        currency: null,
        mandatoryFees: null,
        cancellationPolicy: null,
        distanceKm: source.distanceKm ?? null,
        checkInTime: null,
        checkOutTime: null,
        bookingUrl: source.baseUrl,
        notes:
          "Source is flagged for manual discovery only. CampScout captured evidence but did not attempt availability verification.",
        screenshotPaths: [screenshot],
        discoveredUrls: [],
        checkedAt: new Date().toISOString(),
      };
    } finally {
      await page.close();
    }
  }
}

class DirectoryAdapter implements AvailabilityAdapter {
  id = "directory";

  canHandle(source: AccommodationSource) {
    return source.adapter === this.id || source.sourceType === "tourism-directory";
  }

  async search({ source, context }: SearchRequest): Promise<ScoutResult> {
    const page = await context.browserContext.newPage();

    try {
      await page.goto(source.baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      await maybeAcceptCookies(page);
      const text = (await page.locator("body").innerText().catch(() => "")).slice(0, 10000);
      const discoveredUrls = await extractDiscoveredUrls(page);
      const screenshot = await captureScreenshot({ page, source, context });

      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.sourceType,
        accommodationName: source.name,
        accommodationType: inferAccommodationType(source, text),
        availabilityStatus: "MANUAL_VERIFICATION_REQUIRED",
        price: null,
        currency: null,
        mandatoryFees: extractPolicy(text, /fee|tax|cleaning/i),
        cancellationPolicy: extractPolicy(text, /cancel|refundable/i),
        distanceKm: source.distanceKm ?? null,
        checkInTime: extractTime(text, /check[\s-]?in/i),
        checkOutTime: extractTime(text, /check[\s-]?out/i),
        bookingUrl: discoveredUrls[0] ?? source.baseUrl,
        notes:
          discoveredUrls.length > 0
            ? `Discovery-only source. Found ${discoveredUrls.length} booking-related URLs for manual follow-up.`
            : "Discovery-only source. No booking URL could be confidently extracted.",
        screenshotPaths: [screenshot],
        discoveredUrls,
        checkedAt: new Date().toISOString(),
      };
    } finally {
      await page.close();
    }
  }
}

class GenericSiteAdapter implements AvailabilityAdapter {
  id = "generic-site";

  canHandle(source: AccommodationSource) {
    return source.adapter === this.id || source.sourceType !== "manual";
  }

  async search({ source, input, context }: SearchRequest): Promise<ScoutResult> {
    const page = await context.browserContext.newPage();

    try {
      await page.goto(source.baseUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
      await maybeAcceptCookies(page);
      const automationNotes = await maybeFillSearch(page, input);
      const discoveredUrls = await extractDiscoveredUrls(page);
      const text = (await page.locator("body").innerText().catch(() => "")).slice(0, 15000);
      const priceInfo = extractCurrencyAndPrice(text);
      const screenshot = await captureScreenshot({ page, source, context });
      const availabilityStatus = inferAvailabilityStatus(source, text);

      const notes = [
        ...automationNotes,
        source.requiresManualReview
          ? "Source is marked as manual-review-first in the registry."
          : null,
        discoveredUrls.length > 0
          ? `Found ${discoveredUrls.length} booking-related URLs during discovery.`
          : "No booking-related URLs were extracted from the inspected page.",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.sourceType,
        accommodationName: source.name,
        accommodationType: inferAccommodationType(source, text),
        availabilityStatus,
        price: priceInfo.price,
        currency: priceInfo.currency,
        mandatoryFees: extractPolicy(text, /fee|tax|cleaning|service charge/i),
        cancellationPolicy: extractPolicy(text, /cancel|refund|non-refundable/i),
        distanceKm: source.distanceKm ?? null,
        checkInTime: extractTime(text, /check[\s-]?in/i),
        checkOutTime: extractTime(text, /check[\s-]?out/i),
        bookingUrl: discoveredUrls[0] ?? source.baseUrl,
        notes,
        screenshotPaths: [screenshot],
        discoveredUrls,
        checkedAt: new Date().toISOString(),
      };
    } finally {
      await page.close();
    }
  }
}

const adapters: AvailabilityAdapter[] = [
  new ManualOnlyAdapter(),
  new DirectoryAdapter(),
  new GenericSiteAdapter(),
];

export function resolveAdapter(source: AccommodationSource) {
  return (
    adapters.find((adapter) => adapter.canHandle(source)) ?? new GenericSiteAdapter()
  );
}
