import type {
  Coordinates,
  Route,
} from "../types";

const OSRM_BASE_URL =
  "https://router.project-osrm.org";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ROUTES = 3;

const OSRM_PROFILE = "driving";
const ROUTE_OVERVIEW = "full";
const ROUTE_GEOMETRY = "geojson";

type RoutingErrorCode =
  | "INVALID_COORDINATES"
  | "TIMEOUT"
  | "NETWORK"
  | "SERVER"
  | "BAD_RESPONSE"
  | "NO_ROUTE";

export interface RoutingError extends Error {
  readonly code: RoutingErrorCode;
  readonly cause?: unknown;
}

interface OSRMGeometry {
  readonly coordinates: readonly [
    number,
    number,
  ][];
}

interface OSRMRoute {
  readonly distance: number;
  readonly duration: number;
  readonly geometry?: OSRMGeometry;
}

interface OSRMResponse {
  readonly code: string;
  readonly routes?: readonly OSRMRoute[];
  readonly message?: string;
}

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

function createRoutingError(
  message: string,
  code: RoutingErrorCode,
  cause?: unknown,
): RoutingError {
  const error =
    new Error(message) as RoutingError;

  error.name = "RoutingError";

  Object.defineProperty(error, "code", {
    value: code,
    enumerable: true,
    configurable: false,
    writable: false,
  });

  if (cause !== undefined) {
    Object.defineProperty(error, "cause", {
      value: cause,
      enumerable: false,
      configurable: false,
      writable: false,
    });
  }

  return error;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

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
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

function coordinatesAreEqual(
  first: Coordinates,
  second: Coordinates,
): boolean {
  return (
    first.latitude === second.latitude &&
    first.longitude === second.longitude
  );
}

/* -------------------------------------------------------------------------- */
/* OSRM response validation                                                   */
/* -------------------------------------------------------------------------- */

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isOSRMCoordinate(
  value: unknown,
): value is [number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 2
  ) {
    return false;
  }

  const [
    longitude,
    latitude,
  ] = value;

  return (
    isFiniteNumber(longitude) &&
    isFiniteNumber(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function isOSRMGeometry(
  value: unknown,
): value is OSRMGeometry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.coordinates) &&
    value.coordinates.length >= 2 &&
    value.coordinates.every(
      isOSRMCoordinate,
    )
  );
}

function isOSRMRoute(
  value: unknown,
): value is OSRMRoute {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.distance) &&
    isFiniteNumber(value.duration) &&
    value.distance >= 0 &&
    value.duration >= 0 &&
    isOSRMGeometry(value.geometry)
  );
}

function parseOSRMResponse(
  value: unknown,
): OSRMResponse {
  if (!isRecord(value)) {
    throw createRoutingError(
      "Routing service returned an invalid response.",
      "BAD_RESPONSE",
    );
  }

  if (
    typeof value.code !== "string"
  ) {
    throw createRoutingError(
      "Routing service returned an invalid response code.",
      "BAD_RESPONSE",
    );
  }

  if (
    value.routes !== undefined &&
    !Array.isArray(value.routes)
  ) {
    throw createRoutingError(
      "Routing service returned invalid route data.",
      "BAD_RESPONSE",
    );
  }

  const rawRoutes =
    value.routes ?? [];

  const validRoutes =
    rawRoutes.filter(
      isOSRMRoute,
    );

  if (
    validRoutes.length !==
    rawRoutes.length
  ) {
    throw createRoutingError(
      "Routing service returned malformed route geometry.",
      "BAD_RESPONSE",
    );
  }

  return {
    code: value.code,
    routes: validRoutes,
    message:
      typeof value.message === "string"
        ? value.message
        : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* URL construction                                                           */
/* -------------------------------------------------------------------------- */

function buildRouteUrl(
  start: Coordinates,
  destination: Coordinates,
): string {
  const coordinates = [
    `${start.longitude},${start.latitude}`,
    `${destination.longitude},${destination.latitude}`,
  ].join(";");

  const params = new URLSearchParams({
    overview: ROUTE_OVERVIEW,
    geometries: ROUTE_GEOMETRY,
    alternatives: "true",
    steps: "false",
  });

  return (
    `${OSRM_BASE_URL}/route/v1/` +
    `${OSRM_PROFILE}/${coordinates}?` +
    params.toString()
  );
}

/* -------------------------------------------------------------------------- */
/* Network request                                                            */
/* -------------------------------------------------------------------------- */

async function requestOSRM(
  url: string,
): Promise<OSRMResponse> {
  const controller =
    new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    let response: Response;

    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw createRoutingError(
          "Routing request timed out.",
          "TIMEOUT",
          error,
        );
      }

      throw createRoutingError(
        "Unable to reach the routing service.",
        "NETWORK",
        error,
      );
    }

    if (
      response.status >= 500 &&
      response.status <= 599
    ) {
      throw createRoutingError(
        `Routing service is temporarily unavailable (${response.status}).`,
        "SERVER",
      );
    }

    if (!response.ok) {
      throw createRoutingError(
        `Routing request failed (${response.status}).`,
        "BAD_RESPONSE",
      );
    }

    let rawData: unknown;

    try {
      rawData = await response.json();
    } catch (error: unknown) {
      throw createRoutingError(
        "Routing service returned invalid JSON.",
        "BAD_RESPONSE",
        error,
      );
    }

    return parseOSRMResponse(
      rawData,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/* -------------------------------------------------------------------------- */
/* Route conversion                                                           */
/* -------------------------------------------------------------------------- */

function toCoordinates(
  coordinate: readonly [
    number,
    number,
  ],
): Coordinates {
  const [
    longitude,
    latitude,
  ] = coordinate;

  return {
    latitude,
    longitude,
  };
}

function toRoute(
  route: OSRMRoute,
  index: number,
): Route {
  const geometry =
    route.geometry;

  if (!geometry) {
    throw createRoutingError(
      "Routing service returned a route without geometry.",
      "BAD_RESPONSE",
    );
  }

  return {
    id: `route-${index + 1}`,
    distance: route.distance,
    duration: route.duration,
    coordinates:
      geometry.coordinates.map(
        toCoordinates,
      ),
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export async function getRoutes(
  start: Coordinates,
  destination: Coordinates,
): Promise<Route[]> {
  if (
    !isValidCoordinates(start) ||
    !isValidCoordinates(destination)
  ) {
    throw createRoutingError(
      "Invalid start or destination coordinates.",
      "INVALID_COORDINATES",
    );
  }

  if (
    coordinatesAreEqual(
      start,
      destination,
    )
  ) {
    return [];
  }

  const url = buildRouteUrl(
    start,
    destination,
  );

  const data =
    await requestOSRM(url);

  if (data.code !== "Ok") {
    throw createRoutingError(
      data.message ??
        "No route was found between the selected locations.",
      "NO_ROUTE",
    );
  }

  const routes =
    data.routes ?? [];

  if (routes.length === 0) {
    throw createRoutingError(
      "No route was found between the selected locations.",
      "NO_ROUTE",
    );
  }

  const usableRoutes =
    routes
      .filter(isOSRMRoute)
      .slice(0, MAX_ROUTES);

  if (usableRoutes.length === 0) {
    throw createRoutingError(
      "Routing service returned no usable routes.",
      "BAD_RESPONSE",
    );
  }

  return usableRoutes.map(
    toRoute,
  );
}