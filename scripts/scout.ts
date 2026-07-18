import { defaultSearchInput } from "@/lib/campscout/defaults";
import { runScout, summarizeRun } from "@/lib/campscout/run-scout";

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = {
    destination: args.destination ?? defaultSearchInput.destination,
    checkin: args.checkin ?? defaultSearchInput.checkin,
    checkout: args.checkout ?? defaultSearchInput.checkout,
    adults: args.adults ? Number(args.adults) : defaultSearchInput.adults,
    childrenAges: args.children
      ? args.children
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
          .map((value) => Number(value))
      : defaultSearchInput.childrenAges,
    accommodationTypes: args.types
      ? args.types
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : defaultSearchInput.accommodationTypes,
    searchRadiusKm: args.radius
      ? args.radius
          .split(",")
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isFinite(value))
      : defaultSearchInput.searchRadiusKm,
    maxSources: args["max-sources"]
      ? Number(args["max-sources"])
      : defaultSearchInput.maxSources,
  };

  const run = await runScout(input, {
    headless: args.headed !== "true",
  });

  console.log(JSON.stringify(summarizeRun(run), null, 2));
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "CampScout failed unexpectedly.",
  );
  process.exitCode = 1;
});
