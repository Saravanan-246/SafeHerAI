import type {
  NearbyPlace,
  SafetyAnalysis,
} from "./safetyTypes";

/* ─────────────────────────────────────────────────────────────────────────────
 * Configuration
 * ───────────────────────────────────────────────────────────────────────────── */

const BEST_DISTANCE_METRES = 100;
const WORST_DISTANCE_METRES = 1_500;

const MAX_SCORE = 100;

const ACTIVITY_SCORE_PER_PLACE = 7;
const MAX_ACTIVITY_SCORE = 100;

/* ─────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────────────────────── */

function clamp(
  value: number,
  min: number = 0,
  max: number = MAX_SCORE,
): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(
    min,
    Math.min(max, value),
  );
}

function isValidDistance(
  distance: number,
): boolean {
  return (
    Number.isFinite(distance) &&
    distance >= 0
  );
}

function getNearestDistance(
  places: readonly NearbyPlace[],
): number | undefined {
  const distances =
    places
      .map(
        ({ distance }) =>
          distance,
      )
      .filter(
        (distance): distance is number =>
          isValidDistance(
            distance,
          ),
      );

  if (distances.length === 0) {
    return undefined;
  }

  return Math.min(
    ...distances,
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Proximity scoring
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Converts distance to a 0–100 proximity score.
 *
 * <= 100 m  → 100
 * >= 1500 m → 0
 *
 * Between those values the score decreases linearly.
 */
export function getProximityScore(
  distance: number,
): number {
  if (
    !isValidDistance(
      distance,
    )
  ) {
    return 0;
  }

  if (
    distance <=
    BEST_DISTANCE_METRES
  ) {
    return MAX_SCORE;
  }

  if (
    distance >=
    WORST_DISTANCE_METRES
  ) {
    return 0;
  }

  const score =
    (
      (
        WORST_DISTANCE_METRES -
        distance
      ) /
      (
        WORST_DISTANCE_METRES -
        BEST_DISTANCE_METRES
      )
    ) *
    MAX_SCORE;

  return Math.round(
    clamp(score),
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Safety analysis
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Calculates safety factors from nearby OpenStreetMap facilities.
 *
 * Important:
 * - Missing facility data remains undefined.
 * - No missing value is treated as zero.
 * - "Activity" represents nearby human activity/facility presence,
 *   not crime risk.
 * - No crime prediction is performed.
 */
export function calculateSafety(
  places: readonly NearbyPlace[],
): SafetyAnalysis {
  if (places.length === 0) {
    return {
      policeAccess: undefined,
      medicalAccess: undefined,
      activity: undefined,
      emergencyAccess: undefined,
      crimeExposure: undefined,
      lighting: undefined,
      historicalRisk: undefined,
    };
  }

  const police =
    places.filter(
      (place) =>
        place.type === "Police",
    );

  const medical =
    places.filter(
      (place) =>
        place.type === "Medical" ||
        place.type === "Pharmacy",
    );

  const activity =
    places.filter(
      (place) =>
        place.type === "Activity",
    );

  /* ── Police access ── */

  const nearestPolice =
    getNearestDistance(
      police,
    );

  const policeAccess =
    nearestPolice !== undefined
      ? getProximityScore(
          nearestPolice,
        )
      : undefined;

  /* ── Medical access ── */

  const nearestMedical =
    getNearestDistance(
      medical,
    );

  const medicalAccess =
    nearestMedical !== undefined
      ? getProximityScore(
          nearestMedical,
        )
      : undefined;

  /* ── Activity / public presence ── */

  const validActivityCount =
    activity.filter(
      (place) =>
        isValidDistance(
          place.distance,
        ),
    ).length;

  const activityScore =
    validActivityCount > 0
      ? Math.min(
          MAX_ACTIVITY_SCORE,
          validActivityCount *
            ACTIVITY_SCORE_PER_PLACE,
        )
      : undefined;

  /* ── Emergency access ── */

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
      ? MAX_SCORE
      : medicalAccess;

  /*
   * These factors require additional datasets.
   *
   * Do not fabricate values from OSM facility data.
   */
  return {
    policeAccess,
    medicalAccess,
    activity: activityScore,
    emergencyAccess,

    crimeExposure: undefined,
    lighting: undefined,
    historicalRisk: undefined,
  };
}