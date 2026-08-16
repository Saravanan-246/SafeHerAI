import type { Coordinates } from "../../route/types";

export interface NearbyPoliceStation {
  readonly id: string;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly distanceMeters: number;
  readonly address: string | null;
}

export type NearbyPoliceResult =
  | {
      readonly station: NearbyPoliceStation;
      readonly error: null;
    }
  | {
      readonly station: null;
      readonly error: string;
    };

interface OverpassElement {
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

  readonly tags?: Record<
    string,
    string | undefined
  >;
}

interface OverpassResponse {
  readonly elements?: readonly OverpassElement[];
}

type PoliceLookupErrorCode =
  | "TIMEOUT"
  | "NETWORK"
  | "RATE_LIMIT"
  | "SERVER"
  | "BAD_RESPONSE";

interface PoliceLookupError
  extends Error {
  readonly code: PoliceLookupErrorCode;
}

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const PRIMARY_SEARCH_RADIUS_METERS =
  5_000;

const FALLBACK_SEARCH_RADIUS_METERS =
  10_000;

const REQUEST_TIMEOUT_MS =
  7_000;

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
] as const;

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

function isValidCoordinates(
  value:
    | Coordinates
    | null
    | undefined,
): value is Coordinates {
  if (!value) {
    return false;
  }

  return (
    Number.isFinite(
      value.latitude,
    ) &&
    Number.isFinite(
      value.longitude,
    ) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

/* -------------------------------------------------------------------------- */
/* Distance                                                                    */
/* -------------------------------------------------------------------------- */

function getDistanceMeters(
  from: Coordinates,
  to: Coordinates,
): number {
  const earthRadius =
    6_371_000;

  const latitudeDelta =
    ((to.latitude -
      from.latitude) *
      Math.PI) /
    180;

  const longitudeDelta =
    ((to.longitude -
      from.longitude) *
      Math.PI) /
    180;

  const fromLatitude =
    (from.latitude *
      Math.PI) /
    180;

  const toLatitude =
    (to.latitude *
      Math.PI) /
    180;

  const sinLatitude =
    Math.sin(
      latitudeDelta / 2,
    );

  const sinLongitude =
    Math.sin(
      longitudeDelta / 2,
    );

  const a =
    sinLatitude *
      sinLatitude +
    Math.cos(
      fromLatitude,
    ) *
      Math.cos(
        toLatitude,
      ) *
      sinLongitude *
      sinLongitude;

  const clampedA =
    Math.max(
      0,
      Math.min(1, a),
    );

  const c =
    2 *
    Math.atan2(
      Math.sqrt(
        clampedA,
      ),
      Math.sqrt(
        1 - clampedA,
      ),
    );

  return (
    earthRadius * c
  );
}

/* -------------------------------------------------------------------------- */
/* OSM helpers                                                                 */
/* -------------------------------------------------------------------------- */

function getElementCoordinates(
  element: OverpassElement,
): Coordinates | null {
  if (
    typeof element.lat ===
      "number" &&
    typeof element.lon ===
      "number" &&
    Number.isFinite(
      element.lat,
    ) &&
    Number.isFinite(
      element.lon,
    )
  ) {
    return {
      latitude:
        element.lat,
      longitude:
        element.lon,
    };
  }

  if (
    element.center &&
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

function getAddress(
  tags:
    | Record<
        string,
        string | undefined
      >
    | undefined,
): string | null {
  if (!tags) {
    return null;
  }

  const parts = [
    tags[
      "addr:housenumber"
    ],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:district"],
  ].filter(
    (
      value,
    ): value is string =>
      typeof value ===
        "string" &&
      value.trim().length > 0,
  );

  return parts.length > 0
    ? parts.join(" ")
    : null;
}

function getStationName(
  tags:
    | Record<
        string,
        string | undefined
      >
    | undefined,
): string {
  if (!tags) {
    return "Police Station";
  }

  const candidates = [
    tags.name,
    tags["name:en"],
    tags.official_name,
    tags.alt_name,
  ];

  const name =
    candidates.find(
      (
        value,
      ): value is string =>
        typeof value ===
          "string" &&
        value.trim().length > 0,
    );

  return (
    name?.trim() ??
    "Police Station"
  );
}

function isPoliceElement(
  element: OverpassElement,
): boolean {
  const tags =
    element.tags;

  if (!tags) {
    return false;
  }

  if (
    tags.amenity ===
    "police"
  ) {
    return true;
  }

  if (
    typeof tags.police ===
      "string"
  ) {
    const value =
      tags.police
        .trim()
        .toLowerCase();

    return (
      value === "station" ||
      value === "office" ||
      value === "yes"
    );
  }

  return (
    tags.office ===
      "government" &&
    tags.government ===
      "police"
  );
}

function isOverpassResponse(
  value: unknown,
): value is OverpassResponse {
  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    return false;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  return (
    record.elements ===
      undefined ||
    Array.isArray(
      record.elements,
    )
  );
}

/* -------------------------------------------------------------------------- */
/* Error helpers                                                               */
/* -------------------------------------------------------------------------- */

function createPoliceError(
  message: string,
  code: PoliceLookupErrorCode,
): PoliceLookupError {
  const error =
    new Error(
      message,
    ) as PoliceLookupError;

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

/* -------------------------------------------------------------------------- */
/* Query                                                                       */
/* -------------------------------------------------------------------------- */

function buildOverpassQuery(
  location: Coordinates,
  radiusMeters: number,
): string {
  return `
[out:json][timeout:6];

(
  nwr[
    amenity=police
  ](
    around:${radiusMeters},
    ${location.latitude},
    ${location.longitude}
  );

  nwr[
    police=station
  ](
    around:${radiusMeters},
    ${location.latitude},
    ${location.longitude}
  );

  nwr[
    police=office
  ](
    around:${radiusMeters},
    ${location.latitude},
    ${location.longitude}
  );

  nwr[
    office=government
  ][
    government=police
  ](
    around:${radiusMeters},
    ${location.latitude},
    ${location.longitude}
  );
);

out center tags;
`;
}

/* -------------------------------------------------------------------------- */
/* Single Overpass request                                                      */
/* -------------------------------------------------------------------------- */

async function fetchFromEndpoint(
  endpoint: string,
  query: string,
): Promise<OverpassResponse> {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () => {
        controller.abort();
      },
      REQUEST_TIMEOUT_MS,
    );

  try {
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
            new URLSearchParams({
              data: query,
            }).toString(),
          signal:
            controller.signal,
        },
      );

    if (
      response.status ===
      429
    ) {
      throw createPoliceError(
        "Police lookup is temporarily rate limited.",
        "RATE_LIMIT",
      );
    }

    if (
      response.status >= 500
    ) {
      throw createPoliceError(
        `Police lookup service returned ${response.status}.`,
        "SERVER",
      );
    }

    if (!response.ok) {
      throw createPoliceError(
        `Police lookup failed with status ${response.status}.`,
        "BAD_RESPONSE",
      );
    }

    const data: unknown =
      await response.json();

    if (
      !isOverpassResponse(
        data,
      )
    ) {
      throw createPoliceError(
        "Police lookup returned invalid data.",
        "BAD_RESPONSE",
      );
    }

    return data;
  } catch (
    error: unknown
  ) {
    if (
      error instanceof
        Error &&
      error.name ===
        "AbortError"
    ) {
      throw createPoliceError(
        "Police lookup timed out.",
        "TIMEOUT",
      );
    }

    if (
      error instanceof
        Error &&
      "code" in error
    ) {
      throw error;
    }

    throw createPoliceError(
      error instanceof Error
        ? error.message
        : "Police lookup network request failed.",
      "NETWORK",
    );
  } finally {
    clearTimeout(
      timeoutId,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Multi-endpoint lookup                                                       */
/* -------------------------------------------------------------------------- */

async function fetchPoliceData(
  location: Coordinates,
  radiusMeters: number,
): Promise<OverpassResponse> {
  const query =
    buildOverpassQuery(
      location,
      radiusMeters,
    );

  let lastError:
    | unknown
    | null = null;

  for (
    const endpoint of
    OVERPASS_ENDPOINTS
  ) {
    try {
      return await fetchFromEndpoint(
        endpoint,
        query,
      );
    } catch (
      error: unknown
    ) {
      lastError = error;
    }
  }

  if (
    lastError instanceof
      Error &&
    "code" in lastError
  ) {
    throw lastError;
  }

  throw createPoliceError(
    "All police data services are temporarily unavailable.",
    "NETWORK",
  );
}

/* -------------------------------------------------------------------------- */
/* Station mapping                                                             */
/* -------------------------------------------------------------------------- */

function buildStation(
  element: OverpassElement,
  currentLocation: Coordinates,
): NearbyPoliceStation | null {
  const coordinates =
    getElementCoordinates(
      element,
    );

  if (!coordinates) {
    return null;
  }

  const distanceMeters =
    getDistanceMeters(
      currentLocation,
      coordinates,
    );

  if (
    !Number.isFinite(
      distanceMeters,
    )
  ) {
    return null;
  }

  return {
    id:
      `${element.type}-${element.id}`,

    name:
      getStationName(
        element.tags,
      ),

    latitude:
      coordinates.latitude,

    longitude:
      coordinates.longitude,

    distanceMeters,

    address:
      getAddress(
        element.tags,
      ),
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export async function getNearestPoliceStation(
  location: Coordinates,
): Promise<NearbyPoliceResult> {
  if (
    !isValidCoordinates(
      location,
    )
  ) {
    return {
      station: null,
      error:
        "Current location is unavailable.",
    };
  }

  /*
   * First try the smaller, faster search.
   */
  try {
    const response =
      await fetchPoliceData(
        location,
        PRIMARY_SEARCH_RADIUS_METERS,
      );

    const stations =
      (response.elements ?? [])
        .filter(
          isPoliceElement,
        )
        .map(
          (element) =>
            buildStation(
              element,
              location,
            ),
        )
        .filter(
          (
            station,
          ): station is NearbyPoliceStation =>
            station !== null,
        )
        .sort(
          (first, second) =>
            first.distanceMeters -
            second.distanceMeters,
        );

    const nearest =
      stations[0];

    if (nearest) {
      return {
        station: nearest,
        error: null,
      };
    }
  } catch {
    /*
     * Continue to the wider fallback search.
     */
  }

  /*
   * Second try: wider search.
   *
   * This happens only after the 5 km lookup
   * fails or returns no station.
   */
  try {
    const response =
      await fetchPoliceData(
        location,
        FALLBACK_SEARCH_RADIUS_METERS,
      );

    const stations =
      (response.elements ?? [])
        .filter(
          isPoliceElement,
        )
        .map(
          (element) =>
            buildStation(
              element,
              location,
            ),
        )
        .filter(
          (
            station,
          ): station is NearbyPoliceStation =>
            station !== null,
        )
        .sort(
          (first, second) =>
            first.distanceMeters -
            second.distanceMeters,
        );

    const nearest =
      stations[0];

    if (nearest) {
      return {
        station: nearest,
        error: null,
      };
    }

    return {
      station: null,
      error:
        "No police station was found nearby.",
    };
  } catch (
    error: unknown
  ) {
    if (
      error instanceof
        Error &&
      "code" in error
    ) {
      const code =
        (
          error as PoliceLookupError
        ).code;

      if (
        code ===
        "TIMEOUT"
      ) {
        return {
          station: null,
          error:
            "Police lookup timed out. Please try again.",
        };
      }
    }

    return {
      station: null,
      error:
        "Nearby police stations are temporarily unavailable.",
    };
  }
}