import type { Coordinates } from "../../route/types";

export type MedicalFacilityType =
  | "hospital"
  | "clinic"
  | "doctor";

export interface NearbyMedicalFacility {
  readonly id: string;
  readonly name: string;
  readonly type: MedicalFacilityType;
  readonly latitude: number;
  readonly longitude: number;
  readonly distanceMeters: number;
  readonly address: string | null;
}

export type NearbyMedicalResult =
  | {
      readonly facility: NearbyMedicalFacility;
      readonly error: null;
    }
  | {
      readonly facility: null;
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

type MedicalLookupErrorCode =
  | "TIMEOUT"
  | "NETWORK"
  | "RATE_LIMIT"
  | "SERVER"
  | "BAD_RESPONSE";

interface MedicalLookupError
  extends Error {
  readonly code: MedicalLookupErrorCode;
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

const MEDICAL_TYPE_PRIORITY: Record<
  MedicalFacilityType,
  number
> = {
  hospital: 0,
  clinic: 1,
  doctor: 2,
};

const DISTANCE_TOLERANCE_METERS =
  150;

/* -------------------------------------------------------------------------- */
/* Coordinates                                                                */
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
/* Distance                                                                   */
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
/* OSM helpers                                                                */
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

function getMedicalType(
  tags:
    | Record<
        string,
        string | undefined
      >
    | undefined,
): MedicalFacilityType | null {
  if (!tags) {
    return null;
  }

  if (
    tags.amenity ===
    "hospital"
  ) {
    return "hospital";
  }

  if (
    tags.amenity ===
    "clinic"
  ) {
    return "clinic";
  }

  if (
    tags.amenity ===
    "doctors"
  ) {
    return "doctor";
  }

  return null;
}

function getDefaultMedicalName(
  type: MedicalFacilityType,
): string {
  switch (type) {
    case "hospital":
      return "Hospital";

    case "clinic":
      return "Medical Clinic";

    case "doctor":
      return "Doctor";
  }
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
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

function createMedicalError(
  message: string,
  code: MedicalLookupErrorCode,
): MedicalLookupError {
  const error =
    new Error(
      message,
    ) as MedicalLookupError;

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
/* Query                                                                      */
/* -------------------------------------------------------------------------- */

function buildOverpassQuery(
  location: Coordinates,
  radiusMeters: number,
): string {
  return `
[out:json][timeout:6];

(
  nwr["amenity"="hospital"](
    around:${radiusMeters},
    ${location.latitude},
    ${location.longitude}
  );

  nwr["amenity"="clinic"](
    around:${radiusMeters},
    ${location.latitude},
    ${location.longitude}
  );

  nwr["amenity"="doctors"](
    around:${radiusMeters},
    ${location.latitude},
    ${location.longitude}
  );
);

out center tags;
`;
}

/* -------------------------------------------------------------------------- */
/* Endpoint request                                                           */
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
      throw createMedicalError(
        "Medical lookup is temporarily rate limited.",
        "RATE_LIMIT",
      );
    }

    if (
      response.status >= 500
    ) {
      throw createMedicalError(
        `Medical lookup service returned ${response.status}.`,
        "SERVER",
      );
    }

    if (!response.ok) {
      throw createMedicalError(
        `Medical lookup failed with status ${response.status}.`,
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
      throw createMedicalError(
        "Medical lookup returned invalid data.",
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
      throw createMedicalError(
        "Medical lookup timed out.",
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

    throw createMedicalError(
      error instanceof Error
        ? error.message
        : "Medical lookup network request failed.",
      "NETWORK",
    );
  } finally {
    clearTimeout(
      timeoutId,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Multi-endpoint request                                                     */
/* -------------------------------------------------------------------------- */

async function fetchMedicalData(
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

  throw createMedicalError(
    "All medical data services are temporarily unavailable.",
    "NETWORK",
  );
}

/* -------------------------------------------------------------------------- */
/* Facility ranking                                                           */
/* -------------------------------------------------------------------------- */

function compareFacilities(
  first: NearbyMedicalFacility,
  second: NearbyMedicalFacility,
): number {
  const firstPriority =
    MEDICAL_TYPE_PRIORITY[
      first.type
    ];

  const secondPriority =
    MEDICAL_TYPE_PRIORITY[
      second.type
    ];

  const priorityDifference =
    firstPriority -
    secondPriority;

  const distanceDifference =
    first.distanceMeters -
    second.distanceMeters;

  /*
   * When facilities are essentially at the same
   * distance, prefer a hospital over a clinic/doctor.
   */
  if (
    Math.abs(
      distanceDifference,
    ) <=
    DISTANCE_TOLERANCE_METERS
  ) {
    return priorityDifference;
  }

  return distanceDifference;
}

/* -------------------------------------------------------------------------- */
/* Build facilities                                                           */
/* -------------------------------------------------------------------------- */

function buildFacilities(
  response: OverpassResponse,
  location: Coordinates,
  radiusMeters: number,
): NearbyMedicalFacility[] {
  return (
    response.elements ?? []
  )
    .map(
      (
        element,
      ): NearbyMedicalFacility | null => {
        const coordinates =
          getElementCoordinates(
            element,
          );

        if (!coordinates) {
          return null;
        }

        const type =
          getMedicalType(
            element.tags,
          );

        if (!type) {
          return null;
        }

        const distanceMeters =
          getDistanceMeters(
            location,
            coordinates,
          );

        if (
          !Number.isFinite(
            distanceMeters,
          ) ||
          distanceMeters >
            radiusMeters
        ) {
          return null;
        }

        const name =
          element.tags?.name?.trim();

        return {
          id:
            `${element.type}-${element.id}`,

          name:
            name &&
            name.length > 0
              ? name
              : getDefaultMedicalName(
                  type,
                ),

          type,

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
      },
    )
    .filter(
      (
        facility,
      ): facility is NearbyMedicalFacility =>
        facility !== null,
    )
    .sort(
      compareFacilities,
    );
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export async function getNearestMedicalFacility(
  location: Coordinates,
): Promise<NearbyMedicalResult> {
  if (
    !isValidCoordinates(
      location,
    )
  ) {
    return {
      facility: null,
      error:
        "Current location is unavailable.",
    };
  }

  /*
   * First: fast local search.
   */
  try {
    const response =
      await fetchMedicalData(
        location,
        PRIMARY_SEARCH_RADIUS_METERS,
      );

    const facilities =
      buildFacilities(
        response,
        location,
        PRIMARY_SEARCH_RADIUS_METERS,
      );

    const nearest =
      facilities[0];

    if (nearest) {
      return {
        facility:
          nearest,
        error: null,
      };
    }
  } catch {
    /*
     * Continue to the wider fallback search.
     */
  }

  /*
   * Second: wider search.
   */
  try {
    const response =
      await fetchMedicalData(
        location,
        FALLBACK_SEARCH_RADIUS_METERS,
      );

    const facilities =
      buildFacilities(
        response,
        location,
        FALLBACK_SEARCH_RADIUS_METERS,
      );

    const nearest =
      facilities[0];

    if (nearest) {
      return {
        facility:
          nearest,
        error: null,
      };
    }

    return {
      facility: null,
      error:
        "No hospital, clinic, or doctor was found nearby.",
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
          error as MedicalLookupError
        ).code;

      if (
        code ===
        "TIMEOUT"
      ) {
        return {
          facility: null,
          error:
            "Medical lookup timed out. Please try again.",
        };
      }
    }

    return {
      facility: null,
      error:
        "Nearby medical facilities are temporarily unavailable.",
    };
  }
}