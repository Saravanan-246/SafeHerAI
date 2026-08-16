import * as Location from "expo-location";

import type { Coordinates } from "../types";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 200;

interface GeocodingError extends Error {
  readonly code:
    | "INVALID_QUERY"
    | "NOT_FOUND"
    | "GEOCODING_FAILED"
    | "INVALID_RESULT";
}

function createGeocodingError(
  message: string,
  code: GeocodingError["code"],
): GeocodingError {
  const error = new Error(message) as GeocodingError;

  Object.defineProperty(error, "name", {
    value: "GeocodingError",
    configurable: true,
  });

  Object.defineProperty(error, "code", {
    value: code,
    enumerable: true,
    configurable: false,
    writable: false,
  });

  return error;
}

function isValidCoordinate(
  latitude: number,
  longitude: number,
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function normalizeQuery(
  query: string,
): string {
  return query.trim().replace(/\s+/g, " ");
}

export async function geocodeDestination(
  query: string,
): Promise<Coordinates> {
  if (typeof query !== "string") {
    throw createGeocodingError(
      "Destination must be a valid text value.",
      "INVALID_QUERY",
    );
  }

  const normalizedQuery =
    normalizeQuery(query);

  if (
    normalizedQuery.length <
    MIN_QUERY_LENGTH
  ) {
    throw createGeocodingError(
      "Please enter a valid destination.",
      "INVALID_QUERY",
    );
  }

  if (
    normalizedQuery.length >
    MAX_QUERY_LENGTH
  ) {
    throw createGeocodingError(
      "Destination name is too long.",
      "INVALID_QUERY",
    );
  }

  try {
    const results =
      await Location.geocodeAsync(
        normalizedQuery,
      );

    if (results.length === 0) {
      throw createGeocodingError(
        `Destination "${normalizedQuery}" could not be found.`,
        "NOT_FOUND",
      );
    }

    const result = results.find(
      (item) =>
        isValidCoordinate(
          item.latitude,
          item.longitude,
        ),
    );

    if (!result) {
      throw createGeocodingError(
        "The geocoding service returned an invalid location.",
        "INVALID_RESULT",
      );
    }

    return {
      latitude: result.latitude,
      longitude: result.longitude,
    };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error
    ) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unable to find the destination.";

    throw createGeocodingError(
      `Destination geocoding failed: ${message}`,
      "GEOCODING_FAILED",
    );
  }
}