import type {
  Coordinates,
  SafetyAnalysis,
} from "../types";

import type {
  NearbyPlace,
} from "./safetyTypes";

/* ─────────────────────────────────────────────────────────────────────────────
 * Configuration
 * ───────────────────────────────────────────────────────────────────────────── */

const MIN_SAMPLE_COUNT = 1;

/* ─────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────────────────────── */

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isValidCoordinate(
  coordinate: Coordinates | null | undefined,
): coordinate is Coordinates {
  if (!coordinate) {
    return false;
  }

  return (
    isFiniteNumber(
      coordinate.latitude,
    ) &&
    isFiniteNumber(
      coordinate.longitude,
    ) &&
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180
  );
}

function emptySafetyAnalysis(): SafetyAnalysis {
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

function getNumericValues(
  analyses: readonly SafetyAnalysis[],
  key: keyof SafetyAnalysis,
): number[] {
  return analyses
    .map(
      (analysis) =>
        analysis[key],
    )
    .filter(
      (value): value is number =>
        isFiniteNumber(value),
    );
}

function averageFactor(
  analyses: readonly SafetyAnalysis[],
  key: keyof SafetyAnalysis,
): number | undefined {
  const values =
    getNumericValues(
      analyses,
      key,
    );

  if (values.length === 0) {
    return undefined;
  }

  const average =
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    ) / values.length;

  return Math.round(average);
}

function hasUsableSafetyData(
  analysis: SafetyAnalysis,
): boolean {
  return Object.values(
    analysis,
  ).some(
    (value) =>
      isFiniteNumber(value),
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Route sampling
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Samples up to `count` evenly distributed coordinates from a route.
 *
 * The first and last route coordinates are always included when
 * at least two samples are requested.
 */
export function sampleRouteCoordinates(
  coordinates: readonly Coordinates[],
  count: number,
): Coordinates[] {
  if (
    coordinates.length === 0 ||
    !Number.isFinite(count) ||
    count < MIN_SAMPLE_COUNT
  ) {
    return [];
  }

  const requestedCount =
    Math.floor(count);

  const validCoordinates =
    coordinates.filter(
      isValidCoordinate,
    );

  if (
    validCoordinates.length === 0
  ) {
    return [];
  }

  if (
    validCoordinates.length <=
    requestedCount
  ) {
    return [...validCoordinates];
  }

  if (requestedCount === 1) {
    return [
      validCoordinates[
        Math.floor(
          validCoordinates.length / 2,
        )
      ],
    ];
  }

  const sampled: Coordinates[] = [];
  const usedIndexes =
    new Set<number>();

  for (
    let index = 0;
    index < requestedCount;
    index += 1
  ) {
    const ratio =
      index /
      (requestedCount - 1);

    const sampledIndex =
      Math.round(
        ratio *
          (validCoordinates.length - 1),
      );

    if (
      usedIndexes.has(
        sampledIndex,
      )
    ) {
      continue;
    }

    const coordinate =
      validCoordinates[
        sampledIndex
      ];

    if (!coordinate) {
      continue;
    }

    usedIndexes.add(
      sampledIndex,
    );

    sampled.push(
      coordinate,
    );
  }

  return sampled;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Safety aggregation
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Aggregates multiple safety analyses by independently averaging
 * each available numeric factor.
 *
 * Missing factors are ignored instead of being treated as zero.
 */
export function aggregateSafetyAnalyses(
  analyses: readonly SafetyAnalysis[],
): SafetyAnalysis {
  const usable =
    analyses.filter(
      hasUsableSafetyData,
    );

  if (usable.length === 0) {
    return emptySafetyAnalysis();
  }

  return {
    crimeExposure:
      averageFactor(
        usable,
        "crimeExposure",
      ),

    activity:
      averageFactor(
        usable,
        "activity",
      ),

    lighting:
      averageFactor(
        usable,
        "lighting",
      ),

    policeAccess:
      averageFactor(
        usable,
        "policeAccess",
      ),

    medicalAccess:
      averageFactor(
        usable,
        "medicalAccess",
      ),

    emergencyAccess:
      averageFactor(
        usable,
        "emergencyAccess",
      ),

    historicalRisk:
      averageFactor(
        usable,
        "historicalRisk",
      ),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Nearby-place deduplication
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Removes duplicate nearby places collected from multiple route
 * sampling points.
 *
 * The OSM/service ID is preferred. A normalized fallback key is used
 * when an ID is unavailable or duplicated unexpectedly.
 */
export function deduplicateNearbyPlaces(
  places: readonly NearbyPlace[],
): NearbyPlace[] {
  if (places.length === 0) {
    return [];
  }

  const unique =
    new Map<string, NearbyPlace>();

  for (const place of places) {
    if (!place?.id) {
      continue;
    }

    const existing =
      unique.get(place.id);

    if (
      !existing ||
      place.distance <
        existing.distance
    ) {
      unique.set(
        place.id,
        place,
      );
    }
  }

  return Array.from(
    unique.values(),
  ).sort(
    (first, second) => {
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