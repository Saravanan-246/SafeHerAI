import type {
  Route,
  RoutePriority,
  SafetyAnalysis,
} from "../types";

/* ─────────────────────────────────────────────────────────────────────────────
 * Configuration
 * ───────────────────────────────────────────────────────────────────────────── */

const SCORE_MIN = 0;
const SCORE_MAX = 100;

const BALANCED_TRAVEL_WEIGHT = 0.35;
const BALANCED_DISTANCE_WEIGHT = 0.15;
const BALANCED_SAFETY_WEIGHT = 0.5;

const FALLBACK_TRAVEL_WEIGHT = 0.7;
const FALLBACK_DISTANCE_WEIGHT = 0.3;

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

interface ScoredRoute {
  readonly route: Route;
  readonly score: number;
  readonly safetyScore: number | undefined;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Numeric helpers
 * ───────────────────────────────────────────────────────────────────────────── */

function clamp(
  value: number,
  min: number = SCORE_MIN,
  max: number = SCORE_MAX,
): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  if (min > max) {
    return min;
  }

  return Math.max(
    min,
    Math.min(max, value),
  );
}

function getFiniteValues(
  values: readonly number[],
): number[] {
  return values.filter(
    (value): value is number =>
      Number.isFinite(value),
  );
}

/**
 * Converts a lower-is-better metric into a 0–100 score.
 *
 * Lower value = higher score.
 */
function lowerIsBetterScore(
  value: number,
  min: number,
  max: number,
): number {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max)
  ) {
    return SCORE_MIN;
  }

  if (max <= min) {
    return SCORE_MAX;
  }

  return clamp(
    ((max - value) /
      (max - min)) *
      SCORE_MAX,
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Route metric scoring
 * ───────────────────────────────────────────────────────────────────────────── */

function getTravelScore(
  route: Route,
  routes: readonly Route[],
): number {
  const durations =
    getFiniteValues(
      routes.map(
        ({ duration }) => duration,
      ),
    );

  if (
    durations.length === 0 ||
    !Number.isFinite(route.duration)
  ) {
    return SCORE_MIN;
  }

  return lowerIsBetterScore(
    route.duration,
    Math.min(...durations),
    Math.max(...durations),
  );
}

function getDistanceScore(
  route: Route,
  routes: readonly Route[],
): number {
  const distances =
    getFiniteValues(
      routes.map(
        ({ distance }) => distance,
      ),
    );

  if (
    distances.length === 0 ||
    !Number.isFinite(route.distance)
  ) {
    return SCORE_MIN;
  }

  return lowerIsBetterScore(
    route.distance,
    Math.min(...distances),
    Math.max(...distances),
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Safety scoring
 * ───────────────────────────────────────────────────────────────────────────── */

function getSafetyFactors(
  safety: SafetyAnalysis,
): number[] {
  return [
    safety.crimeExposure,
    safety.activity,
    safety.lighting,
    safety.policeAccess,
    safety.medicalAccess,
    safety.emergencyAccess,
    safety.historicalRisk,
  ].filter(
    (value): value is number =>
      typeof value === "number" &&
      Number.isFinite(value),
  );
}

function getSafetyScore(
  safety: SafetyAnalysis,
): number {
  const available =
    getSafetyFactors(safety);

  if (available.length === 0) {
    return SCORE_MIN;
  }

  const average =
    available.reduce(
      (sum, value) =>
        sum + clamp(value),
      0,
    ) / available.length;

  return Math.round(
    clamp(average),
  );
}

function hasUsableSafetyData(
  route: Route,
): boolean {
  const safety =
    route.safety;

  if (!safety) {
    return false;
  }

  return (
    getSafetyFactors(safety).length >
    0
  );
}

export function routesHaveSafetyData(
  routes: readonly Route[],
): boolean {
  return routes.some(
    hasUsableSafetyData,
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Combined route scoring
 * ───────────────────────────────────────────────────────────────────────────── */

function getRouteScore(
  route: Route,
  routes: readonly Route[],
  priority: RoutePriority,
  safetyAvailable: boolean,
): number {
  const travelScore =
    getTravelScore(
      route,
      routes,
    );

  const distanceScore =
    getDistanceScore(
      route,
      routes,
    );

  const safetyScore =
    route.safety &&
    hasUsableSafetyData(route)
      ? getSafetyScore(route.safety)
      : undefined;

  switch (priority) {
    case "fast":
      return clamp(
        travelScore,
      );

    case "safest":
      return clamp(
        safetyAvailable
          ? safetyScore ?? SCORE_MIN
          : travelScore,
      );

    case "balanced": {
      if (!safetyAvailable) {
        return clamp(
          travelScore *
            FALLBACK_TRAVEL_WEIGHT +
            distanceScore *
              FALLBACK_DISTANCE_WEIGHT,
        );
      }

      return clamp(
        travelScore *
          BALANCED_TRAVEL_WEIGHT +
          distanceScore *
            BALANCED_DISTANCE_WEIGHT +
          (safetyScore ?? SCORE_MIN) *
            BALANCED_SAFETY_WEIGHT,
      );
    }

    default: {
      const exhaustiveCheck: never =
        priority;

      return exhaustiveCheck;
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Public API
 * ───────────────────────────────────────────────────────────────────────────── */

export function rankRoutes(
  routes: readonly Route[],
  priority: RoutePriority,
): Route[] {
  if (routes.length === 0) {
    return [];
  }

  const safetyAvailable =
    routesHaveSafetyData(
      routes,
    );

  const scoredRoutes: ScoredRoute[] =
    routes.map((route) => ({
      route,
      score: getRouteScore(
        route,
        routes,
        priority,
        safetyAvailable,
      ),
      safetyScore:
        route.safety &&
        hasUsableSafetyData(route)
          ? getSafetyScore(
              route.safety,
            )
          : undefined,
    }));

  scoredRoutes.sort(
    (first, second) => {
      if (
        second.score !==
        first.score
      ) {
        return (
          second.score -
          first.score
        );
      }

      /*
       * Deterministic tie-breaker:
       * when scores are equal, prefer the
       * shorter travel duration.
       */
      if (
        first.route.duration !==
        second.route.duration
      ) {
        return (
          first.route.duration -
          second.route.duration
        );
      }

      /*
       * Final tie-breaker:
       * prefer the shorter physical distance.
       */
      return (
        first.route.distance -
        second.route.distance
      );
    },
  );

  return scoredRoutes.map(
    (
      {
        route,
        safetyScore,
      },
      index,
    ): Route => ({
      ...route,
      safetyScore,
      rank: index + 1,
      recommended: index === 0,
    }),
  );
}