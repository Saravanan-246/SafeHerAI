import type { Coordinates } from "../types";

/* ─────────────────────────────────────────────────────────────────────────────
 * Public types
 * ───────────────────────────────────────────────────────────────────────────── */

export type AnomalySeverity =
  | "none"
  | "warning"
  | "alert";

export interface JourneySnapshot {
  /** Unix timestamp in milliseconds. */
  readonly timestamp: number;

  readonly latitude: number;
  readonly longitude: number;

  /** Platform speed in metres per second. */
  readonly speed: number | null;
}

export interface JourneyContext {
  /** Coordinates from the selected route polyline. */
  readonly routeCoordinates: readonly Coordinates[];

  /** Expected travel time in seconds. */
  readonly expectedDurationSeconds: number;

  /** Unix timestamp in milliseconds when the journey started. */
  readonly startedAt: number;

  /** Ordered GPS samples collected during the journey. */
  readonly snapshots: readonly JourneySnapshot[];
}

export interface AnomalyResult {
  readonly hasAnomaly: boolean;
  readonly severity: AnomalySeverity;

  /** Human-readable descriptions of triggered rules. */
  readonly reasons: readonly string[];

  /**
   * User-facing label.
   *
   * Intentionally limited to:
   * - "Journey anomaly detected"
   * - "Possible distress pattern detected"
   */
  readonly label: string | null;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Configuration
 * ───────────────────────────────────────────────────────────────────────────── */

const EARTH_RADIUS_METRES = 6_371_000;

/**
 * GPS distance from the planned route before considering a snapshot
 * to be off-route.
 */
const DEVIATION_THRESHOLD_METRES = 300;

/**
 * Number of consecutive off-route samples required.
 *
 * With a 10-second snapshot interval:
 * 3 samples ≈ 30 seconds.
 */
const DEVIATION_CONSECUTIVE_SAMPLES = 3;

/**
 * Snapshot collection interval.
 *
 * Keep this synchronized with useJourneyAnomaly.ts.
 */
const SNAPSHOT_INTERVAL_SECONDS = 10;

/**
 * Speed below this value is considered stationary.
 *
 * 0.5 m/s ≈ 1.8 km/h.
 */
const STOP_SPEED_THRESHOLD_MS = 0.5;

/**
 * 18 × 10 seconds = 3 minutes.
 */
const STOP_CONSECUTIVE_SAMPLES = 18;

/**
 * Speeds above 55 m/s (198 km/h) are treated as implausible
 * GPS readings rather than evidence of a threat.
 */
const IMPLAUSIBLE_SPEED_THRESHOLD_MS = 55;

/**
 * Journey is considered abnormally long after this multiplier
 * of the expected duration.
 */
const DURATION_MULTIPLIER = 2.5;

/**
 * Suppress duration anomaly after this much route progress.
 */
const DURATION_MAX_PROGRESS_FRACTION = 0.6;

/**
 * Maximum number of recent snapshots used for speed anomaly detection.
 */
const UNUSUAL_SPEED_WINDOW = 5;

/* ─────────────────────────────────────────────────────────────────────────────
 * Validation helpers
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
  coordinate: Coordinates | undefined,
): coordinate is Coordinates {
  if (!coordinate) {
    return false;
  }

  return (
    isFiniteNumber(coordinate.latitude) &&
    isFiniteNumber(coordinate.longitude) &&
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180
  );
}

function isValidSnapshot(
  snapshot: JourneySnapshot,
): boolean {
  return (
    isFiniteNumber(snapshot.timestamp) &&
    isFiniteNumber(snapshot.latitude) &&
    isFiniteNumber(snapshot.longitude) &&
    snapshot.latitude >= -90 &&
    snapshot.latitude <= 90 &&
    snapshot.longitude >= -180 &&
    snapshot.longitude <= 180 &&
    (
      snapshot.speed === null ||
      (
        isFiniteNumber(snapshot.speed) &&
        snapshot.speed >= 0
      )
    )
  );
}

function isValidJourneyContext(
  context: JourneyContext,
  nowMs: number,
): boolean {
  if (
    !Number.isFinite(context.expectedDurationSeconds) ||
    context.expectedDurationSeconds <= 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(context.startedAt) ||
    context.startedAt > nowMs
  ) {
    return false;
  }

  return (
    context.routeCoordinates.every(
      isValidCoordinate,
    ) &&
    context.snapshots.every(
      isValidSnapshot,
    )
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Geometry helpers
 * ───────────────────────────────────────────────────────────────────────────── */

function toRadians(
  degrees: number,
): number {
  return (
    (degrees * Math.PI) / 180
  );
}

/**
 * Haversine great-circle distance between two points.
 */
function haversineMetres(
  a: {
    latitude: number;
    longitude: number;
  },
  b: {
    latitude: number;
    longitude: number;
  },
): number {
  const latitude1 =
    toRadians(a.latitude);

  const latitude2 =
    toRadians(b.latitude);

  const deltaLatitude =
    toRadians(
      b.latitude - a.latitude,
    );

  const deltaLongitude =
    toRadians(
      b.longitude - a.longitude,
    );

  const sinLatitude =
    Math.sin(deltaLatitude / 2);

  const sinLongitude =
    Math.sin(deltaLongitude / 2);

  const haversine =
    sinLatitude ** 2 +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      sinLongitude ** 2;

  const clamped =
    Math.min(
      1,
      Math.max(0, haversine),
    );

  return (
    2 *
    EARTH_RADIUS_METRES *
    Math.atan2(
      Math.sqrt(clamped),
      Math.sqrt(1 - clamped),
    )
  );
}

interface NearestRoutePoint {
  readonly index: number;
  readonly distanceMetres: number;
}

/**
 * Finds the nearest route coordinate to a GPS position.
 */
function nearestRoutePoint(
  position: {
    latitude: number;
    longitude: number;
  },
  route: readonly Coordinates[],
): NearestRoutePoint {
  let bestIndex = 0;
  let bestDistance = Infinity;

  for (
    let index = 0;
    index < route.length;
    index += 1
  ) {
    const routePoint = route[index];

    if (!routePoint) {
      continue;
    }

    const distance =
      haversineMetres(
        position,
        routePoint,
      );

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return {
    index: bestIndex,
    distanceMetres: bestDistance,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Detection rules
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Rule 1 — Route deviation.
 *
 * Requires the latest N samples to all be outside the configured
 * route deviation threshold.
 */
function checkRouteDeviation(
  snapshots: readonly JourneySnapshot[],
  routeCoordinates: readonly Coordinates[],
): boolean {
  if (routeCoordinates.length === 0) {
    return false;
  }

  const tail =
    snapshots.slice(
      -DEVIATION_CONSECUTIVE_SAMPLES,
    );

  if (
    tail.length <
    DEVIATION_CONSECUTIVE_SAMPLES
  ) {
    return false;
  }

  return tail.every((snapshot) => {
    const nearest =
      nearestRoutePoint(
        snapshot,
        routeCoordinates,
      );

    return (
      nearest.distanceMetres >
      DEVIATION_THRESHOLD_METRES
    );
  });
}

/**
 * Rule 2 — Unexpected stop.
 *
 * Only snapshots with an actual speed reading are considered.
 * Missing speed values never count as stationary.
 */
function checkUnexpectedStop(
  snapshots: readonly JourneySnapshot[],
): boolean {
  const recentWithSpeed =
    snapshots
      .filter(
        (
          snapshot,
        ): snapshot is JourneySnapshot & {
          readonly speed: number;
        } =>
          snapshot.speed !== null &&
          Number.isFinite(snapshot.speed),
      )
      .slice(-STOP_CONSECUTIVE_SAMPLES);

  if (
    recentWithSpeed.length <
    STOP_CONSECUTIVE_SAMPLES
  ) {
    return false;
  }

  return recentWithSpeed.every(
    (snapshot) =>
      snapshot.speed <
      STOP_SPEED_THRESHOLD_MS,
  );
}

/**
 * Rule 3 — Unusual speed.
 *
 * This is treated as a sensor/GPS anomaly.
 * It is never classified as a threat by itself.
 */
function checkUnusualSpeed(
  snapshots: readonly JourneySnapshot[],
): boolean {
  return snapshots
    .slice(-UNUSUAL_SPEED_WINDOW)
    .some(
      (snapshot) =>
        snapshot.speed !== null &&
        snapshot.speed >
          IMPLAUSIBLE_SPEED_THRESHOLD_MS,
    );
}

/**
 * Rule 4 — Abnormal journey duration.
 *
 * Fires when:
 *   elapsed >= expectedDuration × multiplier
 *
 * and the user has not reached the configured route progress.
 */
function checkAbnormalDuration(
  snapshots: readonly JourneySnapshot[],
  routeCoordinates: readonly Coordinates[],
  startedAt: number,
  expectedDurationSeconds: number,
  nowMs: number,
): boolean {
  const elapsedSeconds =
    Math.max(
      0,
      nowMs - startedAt,
    ) / 1_000;

  const durationThreshold =
    expectedDurationSeconds *
    DURATION_MULTIPLIER;

  if (
    elapsedSeconds <
    durationThreshold
  ) {
    return false;
  }

  /*
   * If there is no usable route or GPS position,
   * fall back to duration alone.
   */
  if (
    routeCoordinates.length < 2 ||
    snapshots.length === 0
  ) {
    return true;
  }

  const latestSnapshot =
    snapshots[snapshots.length - 1];

  if (!latestSnapshot) {
    return true;
  }

  const {
    index,
  } = nearestRoutePoint(
    latestSnapshot,
    routeCoordinates,
  );

  const progressFraction =
    index /
    (routeCoordinates.length - 1);

  return (
    progressFraction <
    DURATION_MAX_PROGRESS_FRACTION
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Result helpers
 * ───────────────────────────────────────────────────────────────────────────── */

function createCleanResult(): AnomalyResult {
  return {
    hasAnomaly: false,
    severity: "none",
    reasons: [],
    label: null,
  };
}

function createAnomalyResult(
  reasons: readonly string[],
): AnomalyResult {
  if (reasons.length === 0) {
    return createCleanResult();
  }

  const severity: AnomalySeverity =
    reasons.length >= 2
      ? "alert"
      : "warning";

  return {
    hasAnomaly: true,
    severity,
    reasons: [...reasons],
    label:
      severity === "alert"
        ? "Possible distress pattern detected"
        : "Journey anomaly detected",
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Public API
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Analyses an active journey using transparent rule-based detection.
 *
 * Design principles:
 * - No ML inference.
 * - No crime classification.
 * - No threat/intent classification.
 * - GPS anomalies are treated as sensor anomalies.
 * - Multiple independent anomalies increase severity.
 * - nowMs is injectable for deterministic testing.
 */
export function analyzeJourney(
  context: JourneyContext,
  nowMs: number = Date.now(),
): AnomalyResult {
  if (
    !Number.isFinite(nowMs) ||
    nowMs < 0
  ) {
    return createCleanResult();
  }

  if (
    !isValidJourneyContext(
      context,
      nowMs,
    )
  ) {
    return createCleanResult();
  }

  const {
    routeCoordinates,
    expectedDurationSeconds,
    startedAt,
    snapshots,
  } = context;

  /*
   * Require enough samples before evaluating
   * journey-state anomalies.
   *
   * This prevents immediate false alerts after departure.
   */
  if (
    snapshots.length <
    DEVIATION_CONSECUTIVE_SAMPLES
  ) {
    return createCleanResult();
  }

  const reasons: string[] = [];

  /* ── Rule 1: Route deviation ── */

  if (
    checkRouteDeviation(
      snapshots,
      routeCoordinates,
    )
  ) {
    reasons.push(
      `Route deviation: position has been more than ${DEVIATION_THRESHOLD_METRES} m ` +
        `from the planned route for a sustained period.`,
    );
  }

  /* ── Rule 2: Unexpected stop ── */

  if (
    checkUnexpectedStop(
      snapshots,
    )
  ) {
    const stopMinutes =
      Math.round(
        (
          STOP_CONSECUTIVE_SAMPLES *
          SNAPSHOT_INTERVAL_SECONDS
        ) / 60,
      );

    reasons.push(
      `Unexpected stop: no significant movement detected for approximately ` +
        `${stopMinutes} minutes during an active journey.`,
    );
  }

  /* ── Rule 3: Unusual speed ── */

  if (
    checkUnusualSpeed(
      snapshots,
    )
  ) {
    reasons.push(
      `Unusual speed reading: GPS reported a speed above ` +
        `${IMPLAUSIBLE_SPEED_THRESHOLD_MS} m/s, which may indicate a sensor anomaly.`,
    );
  }

  /* ── Rule 4: Abnormal duration ── */

  if (
    checkAbnormalDuration(
      snapshots,
      routeCoordinates,
      startedAt,
      expectedDurationSeconds,
      nowMs,
    )
  ) {
    const expectedMinutes =
      Math.round(
        expectedDurationSeconds / 60,
      );

    reasons.push(
      `Abnormal journey duration: trip is taking significantly longer ` +
        `than the estimated ${expectedMinutes} minutes.`,
    );
  }

  return createAnomalyResult(
    reasons,
  );
}