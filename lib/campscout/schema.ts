import { z } from "zod";

export const accommodationTypeOptions = [
  "tent-pitch",
  "cabin",
  "glamping",
  "family-room",
] as const;

export const availabilityStatusOptions = [
  "VERIFIED_AVAILABLE",
  "VERIFIED_UNAVAILABLE",
  "COULD_NOT_VERIFY",
  "MANUAL_VERIFICATION_REQUIRED",
] as const;

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected ISO date format YYYY-MM-DD.");

export const sourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  baseUrl: z.url(),
  sourceType: z.enum(["direct", "aggregator", "tourism-directory", "manual"]),
  enabled: z.boolean(),
  requiresManualReview: z.boolean().optional(),
  adapter: z.string().optional(),
  locationHint: z.string().optional(),
  distanceKm: z.number().nonnegative().optional(),
});

export const searchInputSchema = z
  .object({
    destination: z.string().min(1),
    checkin: dateSchema,
    checkout: dateSchema,
    adults: z.number().int().min(1).max(12),
    childrenAges: z.array(z.number().int().min(0).max(17)).max(8),
    accommodationTypes: z
      .array(z.enum(accommodationTypeOptions))
      .min(1)
      .max(accommodationTypeOptions.length),
    searchRadiusKm: z.array(z.number().positive()).min(1).max(5),
    maxSources: z.number().int().positive().max(20).default(8),
  })
  .refine((value) => value.checkout > value.checkin, {
    message: "Checkout must be after checkin.",
    path: ["checkout"],
  });

export const scoutResultSchema = z.object({
  sourceId: z.string(),
  sourceName: z.string(),
  sourceType: sourceSchema.shape.sourceType,
  accommodationName: z.string(),
  accommodationType: z.string(),
  availabilityStatus: z.enum(availabilityStatusOptions),
  price: z.string().nullable(),
  currency: z.string().nullable(),
  mandatoryFees: z.string().nullable(),
  cancellationPolicy: z.string().nullable(),
  distanceKm: z.number().nullable(),
  checkInTime: z.string().nullable(),
  checkOutTime: z.string().nullable(),
  bookingUrl: z.string(),
  notes: z.string(),
  screenshotPaths: z.array(z.string()),
  discoveredUrls: z.array(z.string()),
  checkedAt: z.string(),
});

export const scoutRunSchema = z.object({
  runId: z.string(),
  runLabel: z.string(),
  generatedAt: z.string(),
  outputDir: z.string(),
  input: searchInputSchema,
  results: z.array(scoutResultSchema),
});

export type AccommodationType = (typeof accommodationTypeOptions)[number];
export type AvailabilityStatus = (typeof availabilityStatusOptions)[number];
export type AccommodationSource = z.infer<typeof sourceSchema>;
export type SearchInput = z.infer<typeof searchInputSchema>;
export type ScoutResult = z.infer<typeof scoutResultSchema>;
export type ScoutRun = z.infer<typeof scoutRunSchema>;
