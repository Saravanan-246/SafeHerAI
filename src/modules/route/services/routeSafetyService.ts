import type {
  Coordinates,
  SafetyAnalysis,
} from "../types";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const;

const SEARCH_RADIUS_METERS = 1500;

/**
 * Keep the client timeout slightly above the Overpass query timeout.
 *
 * One endpoint can fail without making the entire Safety Bubble fail
 * immediately because a second endpoint is available.
 */
const FETCH_TIMEOUT_MS = 7_000;

const ROUTE_SAMPLE_COUNT = 3;

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

export type SafetyErrorCode =
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "SERVER"
  | "NETWORK"
  | "INVALID_COORDINATES"
  | "BAD_RESPONSE";

export interface SafetyServiceError
  extends Error {
  readonly code: SafetyErrorCode;
}

export type NearbyPlaceType =
  | "Police"
  | "Medical"
  | "Pharmacy"
  | "Activity";

export interface NearbyPlace {
  readonly id: string;
  readonly name: string;
  readonly type: NearbyPlaceType;
  readonly coordinates: Coordinates;
  readonly distance: number;
  readonly openingHours?: string;
  readonly emergency?: string;
}

export interface RouteSafetyResult {
  readonly analysis: SafetyAnalysis;
  readonly places: readonly NearbyPlace[];
}

/* -------------------------------------------------------------------------- */
/* Overpass response types                                                    */
/* -------------------------------------------------------------------------- */

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
  readonly elements?: readonly OSMElement[];
}

/* -------------------------------------------------------------------------- */
/* Error helpers                                                              */
/* -------------------------------------------------------------------------- */

function createSafetyError(
  message: string,
  code: SafetyErrorCode,
): SafetyServiceError {
  const error = new Error(
    message,
  ) as SafetyServiceError;

  Object.defineProperty(
    error,
    "code",
    {
      value: code,
      enumerable: true,
      writable: false,
      configurable: false,
    },
  );

  return error;
}

function getStatusErrorCode(
  status: number,
): SafetyErrorCode {
  if (status === 429) {
    return "RATE_LIMIT";
  }

  if (
    status >= 500 &&
    status <= 599
  ) {
    return "SERVER";
  }

  return "BAD_RESPONSE";
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof Error &&
    error.name === "AbortError"
  );
}

/* -------------------------------------------------------------------------- */
/* Coordinate helpers                                                         */
/* -------------------------------------------------------------------------- */

export function isValidCoordinate(
  coordinate:
    | Coordinates
    | null
    | undefined,
): coordinate is Coordinates {
  if (!coordinate) {
    return false;
  }

  const {
    latitude,
    longitude,
  } = coordinate;

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/* -------------------------------------------------------------------------- */
/* Empty safety                                                               */
/* -------------------------------------------------------------------------- */

function emptyAnalysis(): SafetyAnalysis {
  return {
    crimeExposure: undefined,
    activity: undefined,
    lighting: undefined,
    policeAccess: undefined,
    medicalAccess: undefined,
    emergencyAccess: undefined,
    historicalRisk: undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

function getElementCoordinates(
  element: OSMElement,
): Coordinates | null {
  if (
    typeof element.lat === "number" &&
    typeof element.lon === "number" &&
    Number.isFinite(element.lat) &&
    Number.isFinite(element.lon)
  ) {
    return {
      latitude: element.lat,
      longitude: element.lon,
    };
  }

  if (
    typeof element.center?.lat ===
      "number" &&
    typeof element.center?.lon ===
      "number" &&
    Number.isFinite(
      element.center.lat,
    ) &&
    Number.isFinite(
      element.center.lon,
    )
  ) {
    return {
      latitude:
        element.center.lat,
      longitude:
        element.center.lon,
    };
  }

  return null;
}

function getDistanceMeters(
  from: Coordinates,
  to: Coordinates,
): number {
  const EARTH_RADIUS_METERS =
    6_371_000;

  const lat1 =
    (from.latitude * Math.PI) /
    180;

  const lat2 =
    (to.latitude * Math.PI) /
    180;

  const deltaLat =
    ((to.latitude -
      from.latitude) *
      Math.PI) /
    180;

  const deltaLon =
    ((to.longitude -
      from.longitude) *
      Math.PI) /
    180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  const clampedA = Math.max(
    0,
    Math.min(1, a),
  );

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(
      Math.sqrt(clampedA),
      Math.sqrt(1 - clampedA),
    )
  );
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                    */
/* -------------------------------------------------------------------------- */

function getProximityScore(
  distanceMeters: number,
): number {
  const BEST_DISTANCE_METERS =
    100;

  if (
    distanceMeters <=
    BEST_DISTANCE_METERS
  ) {
    return 100;
  }

  if (
    distanceMeters >=
    SEARCH_RADIUS_METERS
  ) {
    return 0;
  }

  const score =
    ((SEARCH_RADIUS_METERS -
      distanceMeters) /
      (SEARCH_RADIUS_METERS -
        BEST_DISTANCE_METERS)) *
    100;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score),
    ),
  );
}

/* -------------------------------------------------------------------------- */
/* OSM classification                                                          */
/* -------------------------------------------------------------------------- */

function getPlaceType(
  tags: Record<string, string>,
): NearbyPlaceType | null {
  if (
    tags.amenity === "police"
  ) {
    return "Police";
  }

  if (
    tags.amenity === "hospital" ||
    tags.amenity === "clinic" ||
    tags.amenity === "doctors"
  ) {
    return "Medical";
  }

  if (
    tags.amenity === "pharmacy"
  ) {
    return "Pharmacy";
  }

  if (
    tags.shop ||
    tags.amenity === "restaurant" ||
    tags.amenity === "cafe" ||
    tags.highway === "bus_stop"
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
  }
}

/* -------------------------------------------------------------------------- */
/* Query                                                                      */
/* -------------------------------------------------------------------------- */

function buildOverpassQuery(
  location: Coordinates,
): string {
  const {
    latitude,
    longitude,
  } = location;

  return `
[out:json][timeout:6];

(
  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[amenity=police];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[amenity=hospital];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[amenity=clinic];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[amenity=doctors];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[amenity=pharmacy];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[amenity=restaurant];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[amenity=cafe];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[shop];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[highway=bus_stop];
);

out center;
`;
}

/* -------------------------------------------------------------------------- */
/* Single endpoint request                                                    */
/* -------------------------------------------------------------------------- */

async function fetchFromEndpoint(
  endpoint: string,
  location: Coordinates,
): Promise<OSMResponse> {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () => {
        controller.abort();
      },
      FETCH_TIMEOUT_MS,
    );

  try {
    const query =
      buildOverpassQuery(
        location,
      );

    const response =
      await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            Accept:
              "application/json",
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body:
            `data=${encodeURIComponent(
              query,
            )}`,
          signal:
            controller.signal,
        },
      );

    if (!response.ok) {
      throw createSafetyError(
        `Safety data request failed (${response.status}).`,
        getStatusErrorCode(
          response.status,
        ),
      );
    }

    const data: unknown =
      await response.json();

    if (
      typeof data !== "object" ||
      data === null
    ) {
      throw createSafetyError(
        "Safety data response was invalid.",
        "BAD_RESPONSE",
      );
    }

    const responseData =
      data as OSMResponse;

    if (
      responseData.elements !==
        undefined &&
      !Array.isArray(
        responseData.elements,
      )
    ) {
      throw createSafetyError(
        "Safety data response was invalid.",
        "BAD_RESPONSE",
      );
    }

    return responseData;
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw createSafetyError(
        "Safety data request timed out.",
        "TIMEOUT",
      );
    }

    if (
      error instanceof Error &&
      "code" in error
    ) {
      throw error;
    }

    const message =
      error instanceof Error &&
      error.message.trim().length > 0
        ? error.message
        : "Safety data network request failed.";

    throw createSafetyError(
      `Safety data network request failed: ${message}`,
      "NETWORK",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/* -------------------------------------------------------------------------- */
/* Multi-endpoint fallback                                                    */
/* -------------------------------------------------------------------------- */

async function fetchOverpassData(
  location: Coordinates,
): Promise<OSMResponse> {
  if (
    !isValidCoordinate(
      location,
    )
  ) {
    throw createSafetyError(
      "Invalid coordinates provided for safety analysis.",
      "INVALID_COORDINATES",
    );
  }

  let lastError:
    | unknown
    | null = null;

  for (
    const endpoint of OVERPASS_ENDPOINTS
  ) {
    try {
      return await fetchFromEndpoint(
        endpoint,
        location,
      );
    } catch (error: unknown) {
      lastError = error;
    }
  }

  if (
    lastError instanceof Error &&
    "code" in lastError
  ) {
    throw lastError;
  }

  throw createSafetyError(
    "All safety data services are temporarily unavailable.",
    "NETWORK",
  );
}

/* -------------------------------------------------------------------------- */
/* Nearby places                                                              */
/* -------------------------------------------------------------------------- */

async function fetchNearbyPlaces(
  location: Coordinates,
): Promise<NearbyPlace[]> {
  if (
    !isValidCoordinate(
      location,
    )
  ) {
    throw createSafetyError(
      "Invalid coordinates provided for safety analysis.",
      "INVALID_COORDINATES",
    );
  }

  const data =
    await fetchOverpassData(
      location,
    );

  const places: NearbyPlace[] =
    [];

  for (
    const element of
    data.elements ?? []
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
      getDistanceMeters(
        location,
        coordinates,
      );

    if (
      !Number.isFinite(distance) ||
      distance >
        SEARCH_RADIUS_METERS
    ) {
      continue;
    }

    places.push({
      id:
        `${element.type}-${element.id}`,

      name:
        tags.name ??
        getFallbackName(type),

      type,

      coordinates,

      distance:
        Math.round(distance),

      ...(tags.opening_hours
        ? {
            openingHours:
              tags.opening_hours,
          }
        : {}),

      ...(tags.emergency
        ? {
            emergency:
              tags.emergency,
          }
        : {}),
    });
  }

  /*
   * Remove duplicates.
   */
  const uniquePlaces =
    new Map<
      string,
      NearbyPlace
    >();

  for (
    const place of places
  ) {
    uniquePlaces.set(
      place.id,
      place,
    );
  }

  return Array.from(
    uniquePlaces.values(),
  ).sort(
    (first, second) =>
      first.distance -
      second.distance,
  );
}

/* -------------------------------------------------------------------------- */
/* Safety analysis                                                            */
/* -------------------------------------------------------------------------- */

function calculateSafety(
  places: readonly NearbyPlace[],
): SafetyAnalysis {
  const police =
    places.filter(
      (place) =>
        place.type === "Police",
    );

  const medical =
    places.filter(
      (place) =>
        place.type === "Medical" ||
        place.type ===
          "Pharmacy",
    );

  const activity =
    places.filter(
      (place) =>
        place.type ===
        "Activity",
    );

  const nearestPolice =
    police[0]?.distance;

  const nearestMedical =
    medical[0]?.distance;

  const policeAccess =
    nearestPolice !== undefined
      ? getProximityScore(
          nearestPolice,
        )
      : undefined;

  const medicalAccess =
    nearestMedical !== undefined
      ? getProximityScore(
          nearestMedical,
        )
      : undefined;

  const activityScore =
    activity.length > 0
      ? Math.min(
          100,
          activity.length * 7,
        )
      : undefined;

  const emergencyFacilityCount =
    medical.filter(
      (place) =>
        place.emergency
          ?.trim()
          .toLowerCase() ===
        "yes",
    ).length;

  const emergencyAccess =
    emergencyFacilityCount > 0
      ? 100
      : medicalAccess;

  return {
    policeAccess,
    medicalAccess,
    activity:
      activityScore,
    emergencyAccess,

    /*
     * These remain unavailable until
     * verified datasets are connected.
     */
    crimeExposure:
      undefined,

    lighting:
      undefined,

    historicalRisk:
      undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Current-area safety                                                        */
/* -------------------------------------------------------------------------- */

export async function getRouteSafety(
  location: Coordinates,
): Promise<RouteSafetyResult> {
  if (
    !isValidCoordinate(
      location,
    )
  ) {
    throw createSafetyError(
      "Invalid coordinates provided for safety analysis.",
      "INVALID_COORDINATES",
    );
  }

  const places =
    await fetchNearbyPlaces(
      location,
    );

  return {
    analysis:
      calculateSafety(
        places,
      ),

    places,
  };
}

/* -------------------------------------------------------------------------- */
/* Route sampling                                                             */
/* -------------------------------------------------------------------------- */

function sampleRouteCoordinates(
  coordinates: readonly Coordinates[],
  count: number,
): Coordinates[] {
  const valid =
    coordinates.filter(
      isValidCoordinate,
    );

  if (valid.length === 0) {
    return [];
  }

  if (valid.length <= count) {
    return [...valid];
  }

  if (count <= 1) {
    const first =
      valid[0];

    return first
      ? [first]
      : [];
  }

  const sampled:
    Coordinates[] = [];

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const position =
      Math.round(
        (index /
          (count - 1)) *
          (valid.length - 1),
      );

    const point =
      valid[position];

    if (point) {
      sampled.push(point);
    }
  }

  return sampled;
}

/* -------------------------------------------------------------------------- */
/* Route aggregation                                                          */
/* -------------------------------------------------------------------------- */

function averageSafetyFactor(
  analyses:
    readonly SafetyAnalysis[],
  key: keyof SafetyAnalysis,
): number | undefined {
  const values =
    analyses
      .map(
        (analysis) =>
          analysis[key],
      )
      .filter(
        (
          value,
        ): value is number =>
          typeof value ===
            "number" &&
          Number.isFinite(
            value,
          ),
      );

  if (values.length === 0) {
    return undefined;
  }

  return Math.round(
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    ) / values.length,
  );
}

function aggregateSafetyAnalyses(
  analyses:
    readonly SafetyAnalysis[],
): SafetyAnalysis {
  const usable =
    analyses.filter(
      (analysis) =>
        Object.values(
          analysis,
        ).some(
          (value) =>
            typeof value ===
              "number" &&
            Number.isFinite(
              value,
            ),
        ),
    );

  if (usable.length === 0) {
    return emptyAnalysis();
  }

  return {
    policeAccess:
      averageSafetyFactor(
        usable,
        "policeAccess",
      ),

    medicalAccess:
      averageSafetyFactor(
        usable,
        "medicalAccess",
      ),

    activity:
      averageSafetyFactor(
        usable,
        "activity",
      ),

    emergencyAccess:
      averageSafetyFactor(
        usable,
        "emergencyAccess",
      ),

    /*
     * Never invent these values.
     */
    crimeExposure:
      undefined,

    lighting:
      undefined,

    historicalRisk:
      undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Route safety                                                               */
/* -------------------------------------------------------------------------- */

export async function getRoutePathSafety(
  routeCoordinates: Coordinates[],
): Promise<RouteSafetyResult> {
  const samplePoints =
    sampleRouteCoordinates(
      routeCoordinates,
      ROUTE_SAMPLE_COUNT,
    );

  if (samplePoints.length === 0) {
    return {
      analysis:
        emptyAnalysis(),
      places: [],
    };
  }

  const pointResults:
    Array<{
      readonly analysis: SafetyAnalysis;
      readonly places: NearbyPlace[];
    }> = [];

  let failureCount = 0;

  let lastError:
    | unknown
    | null = null;

  /*
   * Keep route sample requests sequential.
   * This is deliberately conservative with
   * public Overpass infrastructure.
   */
  for (
    const point of samplePoints
  ) {
    try {
      const places =
        await fetchNearbyPlaces(
          point,
        );

      pointResults.push({
        analysis:
          calculateSafety(
            places,
          ),

        places,
      });
    } catch (
      error: unknown
    ) {
      failureCount += 1;
      lastError = error;
    }
  }

  /*
   * Every route sample failed.
   */
  if (
    failureCount ===
    samplePoints.length
  ) {
    if (
      lastError instanceof Error &&
      "code" in lastError
    ) {
      throw lastError;
    }

    throw createSafetyError(
      "Safety data request failed for all route sample points.",
      "NETWORK",
    );
  }

  /*
   * At least one sample succeeded.
   */
  const analyses =
    pointResults.map(
      (result) =>
        result.analysis,
    );

  const aggregatedAnalysis =
    aggregateSafetyAnalyses(
      analyses,
    );

  /*
   * Merge all places and remove duplicates.
   */
  const uniquePlaces =
    new Map<
      string,
      NearbyPlace
    >();

  for (
    const result of pointResults
  ) {
    for (
      const place of
      result.places
    ) {
      if (
        !uniquePlaces.has(
          place.id,
        )
      ) {
        uniquePlaces.set(
          place.id,
          place,
        );
      }
    }
  }

  const places =
    Array.from(
      uniquePlaces.values(),
    ).sort(
      (first, second) =>
        first.distance -
        second.distance,
    );

  return {
    analysis:
      aggregatedAnalysis,

    places,
  };
}