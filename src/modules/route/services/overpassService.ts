import type { Coordinates } from "../types";
import type {
  NearbyPlace,
  NearbyPlaceType,
} from "./safetyTypes";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const;

const SEARCH_RADIUS_METERS = 1_500;
const QUERY_TIMEOUT_SECONDS = 10;
const FETCH_TIMEOUT_MS = 8_000;

type SafetyErrorCode =
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "SERVER"
  | "NETWORK"
  | "INVALID_COORDINATES"
  | "BAD_RESPONSE";

export interface SafetyError extends Error {
  readonly code: SafetyErrorCode;
  readonly cause?: unknown;
}

interface OSMElement {
  readonly type:
    | "node"
    | "way"
    | "relation";
  readonly id: number;
  readonly lat?: number;
  readonly lon?: number;
  readonly center?: {
    readonly lat: number;
    readonly lon: number;
  };
  readonly tags?: Record<string, string>;
}

interface OSMResponse {
  readonly elements: OSMElement[];
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Error helpers
 * ───────────────────────────────────────────────────────────────────────────── */

export function createSafetyError(
  message: string,
  code: SafetyErrorCode,
  cause?: unknown,
): SafetyError {
  const error =
    new Error(message) as SafetyError;

  error.name = "SafetyError";

  Object.defineProperty(
    error,
    "code",
    {
      value: code,
      enumerable: true,
    },
  );

  if (cause !== undefined) {
    Object.defineProperty(
      error,
      "cause",
      {
        value: cause,
        enumerable: false,
      },
    );
  }

  return error;
}

function isSafetyError(
  error: unknown,
): error is SafetyError {
  return (
    error instanceof Error &&
    "code" in error
  );
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof Error &&
    error.name === "AbortError"
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Coordinate validation
 * ───────────────────────────────────────────────────────────────────────────── */

export function isValidCoordinate(
  coordinate:
    | Coordinates
    | null
    | undefined,
): coordinate is Coordinates {
  return (
    coordinate !== null &&
    coordinate !== undefined &&
    typeof coordinate.latitude ===
      "number" &&
    typeof coordinate.longitude ===
      "number" &&
    Number.isFinite(
      coordinate.latitude,
    ) &&
    Number.isFinite(
      coordinate.longitude,
    ) &&
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * OSM parsing
 * ───────────────────────────────────────────────────────────────────────────── */

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isOSMElement(
  value: unknown,
): value is OSMElement {
  if (!isRecord(value)) {
    return false;
  }

  const type =
    value.type;

  const id =
    value.id;

  if (
    type !== "node" &&
    type !== "way" &&
    type !== "relation"
  ) {
    return false;
  }

  if (
    typeof id !== "number" ||
    !Number.isSafeInteger(id)
  ) {
    return false;
  }

  if (
    value.lat !== undefined &&
    typeof value.lat !== "number"
  ) {
    return false;
  }

  if (
    value.lon !== undefined &&
    typeof value.lon !== "number"
  ) {
    return false;
  }

  if (
    value.center !== undefined
  ) {
    if (!isRecord(value.center)) {
      return false;
    }

    if (
      typeof value.center.lat !==
        "number" ||
      typeof value.center.lon !==
        "number"
    ) {
      return false;
    }
  }

  if (
    value.tags !== undefined
  ) {
    if (!isRecord(value.tags)) {
      return false;
    }

    for (
      const tag of
        Object.values(value.tags)
    ) {
      if (
        typeof tag !== "string"
      ) {
        return false;
      }
    }
  }

  return true;
}

function parseOSMResponse(
  value: unknown,
): OSMResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(
      value.elements,
    )
  ) {
    throw createSafetyError(
      "Safety data response format was invalid.",
      "BAD_RESPONSE",
    );
  }

  const elements =
    value.elements.filter(
      isOSMElement,
    );

  if (
    elements.length !==
    value.elements.length
  ) {
    throw createSafetyError(
      "Safety data contained invalid map elements.",
      "BAD_RESPONSE",
    );
  }

  return {
    elements,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * OSM helpers
 * ───────────────────────────────────────────────────────────────────────────── */

function getElementCoordinates(
  element: OSMElement,
): Coordinates | null {
  if (
    typeof element.lat === "number" &&
    typeof element.lon === "number"
  ) {
    const coordinate = {
      latitude: element.lat,
      longitude: element.lon,
    };

    return isValidCoordinate(
      coordinate,
    )
      ? coordinate
      : null;
  }

  if (
    element.center &&
    typeof element.center.lat ===
      "number" &&
    typeof element.center.lon ===
      "number"
  ) {
    const coordinate = {
      latitude:
        element.center.lat,
      longitude:
        element.center.lon,
    };

    return isValidCoordinate(
      coordinate,
    )
      ? coordinate
      : null;
  }

  return null;
}

function getPlaceType(
  tags: Record<string, string>,
): NearbyPlaceType | null {
  const amenity =
    tags.amenity;

  const healthcare =
    tags.healthcare;

  if (
    amenity === "police"
  ) {
    return "Police";
  }

  if (
    amenity === "hospital" ||
    amenity === "clinic" ||
    amenity === "doctors" ||
    amenity === "dentist" ||
    healthcare === "hospital" ||
    healthcare === "clinic" ||
    healthcare === "doctor" ||
    healthcare === "dentist"
  ) {
    return "Medical";
  }

  if (
    amenity === "pharmacy" ||
    healthcare === "pharmacy"
  ) {
    return "Pharmacy";
  }

  if (
    tags.shop ||
    amenity === "restaurant" ||
    amenity === "cafe" ||
    amenity === "fast_food" ||
    tags.highway === "bus_stop" ||
    tags.public_transport ===
      "platform" ||
    tags.public_transport ===
      "station"
  ) {
    return "Activity";
  }

  return null;
}

function getFallbackName(
  type: NearbyPlaceType,
): string {
  switch (type) {
    case "Police":
      return "Police facility";

    case "Medical":
      return "Medical facility";

    case "Pharmacy":
      return "Pharmacy";

    case "Activity":
      return "Nearby activity";

    default: {
      const exhaustiveCheck: never =
        type;

      return exhaustiveCheck;
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Distance
 * ───────────────────────────────────────────────────────────────────────────── */

function getDistanceMeters(
  from: Coordinates,
  to: Coordinates,
): number {
  const earthRadius =
    6_371_000;

  const latitude1 =
    (from.latitude * Math.PI) /
    180;

  const latitude2 =
    (to.latitude * Math.PI) /
    180;

  const deltaLatitude =
    ((to.latitude -
      from.latitude) *
      Math.PI) /
    180;

  const deltaLongitude =
    ((to.longitude -
      from.longitude) *
      Math.PI) /
    180;

  const sinLatitude =
    Math.sin(
      deltaLatitude / 2,
    );

  const sinLongitude =
    Math.sin(
      deltaLongitude / 2,
    );

  const value =
    sinLatitude ** 2 +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      sinLongitude ** 2;

  const clamped =
    Math.min(
      1,
      Math.max(0, value),
    );

  return (
    2 *
    earthRadius *
    Math.atan2(
      Math.sqrt(clamped),
      Math.sqrt(1 - clamped),
    )
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Query
 * ───────────────────────────────────────────────────────────────────────────── */

function buildQuery(
  location: Coordinates,
): string {
  return `
[out:json][timeout:${QUERY_TIMEOUT_SECONDS}];

(
  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${location.latitude},
    ${location.longitude}
  )[amenity~"^(police|hospital|clinic|doctors|dentist|pharmacy|restaurant|cafe|fast_food)$"];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${location.latitude},
    ${location.longitude}
  )[healthcare~"^(hospital|clinic|doctor|dentist|pharmacy)$"];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${location.latitude},
    ${location.longitude}
  )[shop];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${location.latitude},
    ${location.longitude}
  )[highway=bus_stop];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${location.latitude},
    ${location.longitude}
  )[public_transport~"^(platform|station)$"];
);

out center;
`;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Request
 * ───────────────────────────────────────────────────────────────────────────── */

async function requestOverpass(
  endpoint: string,
  location: Coordinates,
): Promise<OSMResponse> {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () => controller.abort(),
      FETCH_TIMEOUT_MS,
    );

  try {
    const response =
      await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
            Accept:
              "application/json",
          },
          body:
            `data=${encodeURIComponent(
              buildQuery(location),
            )}`,
          signal:
            controller.signal,
        },
      );

    if (
      response.status === 429
    ) {
      throw createSafetyError(
        "Safety data service is temporarily rate limited.",
        "RATE_LIMIT",
      );
    }

    if (
      response.status >= 500 &&
      response.status <= 599
    ) {
      throw createSafetyError(
        `Safety data service is temporarily unavailable (${response.status}).`,
        "SERVER",
      );
    }

    if (!response.ok) {
      throw createSafetyError(
        `Safety data request failed (${response.status}).`,
        "BAD_RESPONSE",
      );
    }

    let rawData: unknown;

    try {
      rawData =
        await response.json();
    } catch (error) {
      throw createSafetyError(
        "Safety data response was not valid JSON.",
        "BAD_RESPONSE",
        error,
      );
    }

    return parseOSMResponse(
      rawData,
    );
  } catch (error) {
    if (
      isAbortError(error)
    ) {
      throw createSafetyError(
        "Safety data request timed out.",
        "TIMEOUT",
        error,
      );
    }

    if (
      isSafetyError(error)
    ) {
      throw error;
    }

    throw createSafetyError(
      "Safety data network request failed.",
      "NETWORK",
      error,
    );
  } finally {
    clearTimeout(
      timeoutId,
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Endpoint fallback
 * ───────────────────────────────────────────────────────────────────────────── */

async function fetchOSMData(
  location: Coordinates,
): Promise<OSMResponse> {
  let lastError:
    | SafetyError
    | null = null;

  for (
    const endpoint of
      OVERPASS_ENDPOINTS
  ) {
    try {
      return await requestOverpass(
        endpoint,
        location,
      );
    } catch (error) {
      lastError =
        isSafetyError(error)
          ? error
          : createSafetyError(
              "Safety data request failed.",
              "NETWORK",
              error,
            );
    }
  }

  throw (
    lastError ??
    createSafetyError(
      "Safety data service is temporarily unavailable.",
      "NETWORK",
    )
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Public API
 * ───────────────────────────────────────────────────────────────────────────── */

export async function fetchNearbyPlaces(
  location: Coordinates,
): Promise<NearbyPlace[]> {
  if (
    !isValidCoordinate(location)
  ) {
    throw createSafetyError(
      "Invalid coordinates provided for safety analysis.",
      "INVALID_COORDINATES",
    );
  }

  const data =
    await fetchOSMData(
      location,
    );

  const places =
    new Map<
      string,
      NearbyPlace
    >();

  for (
    const element of
      data.elements
  ) {
    const coordinates =
      getElementCoordinates(
        element,
      );

    if (!coordinates) {
      continue;
    }

    const tags =
      element.tags ?? {};

    const type =
      getPlaceType(tags);

    if (!type) {
      continue;
    }

    const distance =
      Math.round(
        getDistanceMeters(
          location,
          coordinates,
        ),
      );

    if (
      distance >
      SEARCH_RADIUS_METERS
    ) {
      continue;
    }

    const id =
      `${element.type}-${element.id}`;

    const place: NearbyPlace = {
      id,
      name:
        tags.name?.trim() ||
        getFallbackName(type),
      type,
      coordinates,
      distance,
      openingHours:
        tags.opening_hours?.trim() ||
        undefined,
      emergency:
        tags.emergency?.trim() ||
        undefined,
    };

    places.set(
      id,
      place,
    );
  }

  return Array.from(
    places.values(),
  ).sort(
    (
      first,
      second,
    ) => {
      if (
        first.distance !==
        second.distance
      ) {
        return (
          first.distance -
          second.distance
        );
      }

      return first.name.localeCompare(
        second.name,
      );
    },
  );
}