import type { AccommodationSource, SearchInput } from "@/lib/campscout/schema";
import { accommodationTypeOptions } from "@/lib/campscout/schema";

export { accommodationTypeOptions };

export const defaultSearchInput: SearchInput = {
  destination: "Vallåsen Bike Park, Sweden",
  checkin: "2026-07-20",
  checkout: "2026-07-21",
  adults: 2,
  childrenAges: [8, 5],
  accommodationTypes: [
    "tent-pitch",
    "cabin",
    "glamping",
    "family-room",
  ],
  searchRadiusKm: [10, 25, 50],
  maxSources: 8,
};

export const sourceRegistry: AccommodationSource[] = [
  {
    id: "vallasen-official",
    name: "Vallåsen official site",
    baseUrl: "https://www.vallasen.se/",
    sourceType: "direct",
    enabled: true,
    adapter: "generic-site",
    locationHint: "Vallåsen Bike Park",
    distanceKm: 0,
  },
  {
    id: "destination-laholm",
    name: "Destination Laholm accommodation listings",
    baseUrl: "https://www.destinationlaholm.se/",
    sourceType: "tourism-directory",
    enabled: true,
    adapter: "directory",
    locationHint: "Laholm area",
  },
  {
    id: "camping-se",
    name: "Camping.se",
    baseUrl: "https://camping.se/",
    sourceType: "aggregator",
    enabled: true,
    adapter: "generic-site",
    locationHint: "Halland / Skåne",
  },
  {
    id: "booking",
    name: "Booking.com",
    baseUrl: "https://www.booking.com/",
    sourceType: "aggregator",
    enabled: true,
    adapter: "generic-site",
    locationHint: "Vallåsen / Våxtorp / Laholm",
  },
  {
    id: "hotels",
    name: "Hotels.com",
    baseUrl: "https://www.hotels.com/",
    sourceType: "aggregator",
    enabled: true,
    adapter: "generic-site",
    locationHint: "Vallåsen / Våxtorp / Laholm",
  },
  {
    id: "expedia",
    name: "Expedia",
    baseUrl: "https://www.expedia.com/",
    sourceType: "aggregator",
    enabled: true,
    adapter: "generic-site",
    locationHint: "Vallåsen / Våxtorp / Laholm",
  },
  {
    id: "airbnb",
    name: "Airbnb",
    baseUrl: "https://www.airbnb.com/",
    sourceType: "aggregator",
    enabled: true,
    requiresManualReview: true,
    adapter: "generic-site",
    locationHint: "Vallåsen / Våxtorp / Laholm",
  },
  {
    id: "google-maps-discovery",
    name: "Google Maps discovery",
    baseUrl:
      "https://www.google.com/maps/search/accommodation+near+Vall%C3%A5sen+Bike+Park/",
    sourceType: "manual",
    enabled: true,
    requiresManualReview: true,
    adapter: "manual-only",
    locationHint: "Discovery only",
  },
];
