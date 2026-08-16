import { useEffect, useRef, useState } from "react";
import type * as Location from "expo-location";

import type { Route } from "../types";
import {
  analyzeJourney,
} from "../services/journeyAnomalyService";
import type {
  AnomalyResult,
  JourneySnapshot,
} from "../services/journeyAnomalyService";

/* ─────────────────────────────────────────────────────────────────────────────
 * Timing constants
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * How often (ms) to record a GPS snapshot into the journey history.
 * 10 s gives enough resolution for all four detection rules while
 * keeping memory usage low for long journeys.
 */
const SNAPSHOT_INTERVAL_MS = 10_000;

/**
 * How often (ms) to run the full anomaly analysis.
 * 30 s is fine because the rules themselves require many consecutive
 * samples before firing — running more often adds no signal.
 */
const ANALYSIS_INTERVAL_MS = 30_000;

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

export interface UseJourneyAnomalyOptions {
  /**
   * The route the user is actively following.
   * Pass null to disable detection; the hook returns a clean result.
   */
  route: Route | null;
  /**
   * Current GPS position supplied by the parent component.
   *
   * The hook intentionally does NOT create its own location subscription.
   * This avoids duplicate watchPosition listeners when the parent (e.g.
   * NavigationScreen) already holds one via useLiveLocation().
   */
  location: Location.LocationObject | null;
  /**
   * Unix timestamp (ms) when the journey was started.
   * Changing this value resets all accumulated snapshots and analysis state.
   */
  startedAt: number;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Hook
 * ───────────────────────────────────────────────────────────────────────────── */

const CLEAN_RESULT: AnomalyResult = {
  hasAnomaly: false,
  severity: "none",
  reasons: [],
  label: null,
};

/**
 * Detects journey anomalies from live GPS using transparent rule-based logic.
 *
 * What this hook does:
 *   - Accumulates GPS snapshots from the caller-supplied `location` prop.
 *   - Runs analyzeJourney() periodically against the snapshot history.
 *   - Resets all state when `startedAt` or `route.id` changes.
 *
 * What this hook does NOT do:
 *   - Create its own GPS subscription (no duplicate listeners).
 *   - Automatically escalate to SOS or trigger alerts.
 *   - Classify threats, crimes or intent.
 *
 * @returns AnomalyResult — the caller decides how (and whether) to surface it.
 */
export function useJourneyAnomaly({
  route,
  location,
  startedAt,
}: UseJourneyAnomalyOptions): AnomalyResult {
  const [result, setResult] = useState<AnomalyResult>(CLEAN_RESULT);

  // Mutable refs so snapshot accumulation never triggers re-renders.
  const snapshotsRef = useRef<JourneySnapshot[]>([]);
  const lastSnapshotAtRef = useRef<number>(0);
  const lastAnalysisAtRef = useRef<number>(0);

  /* ── Reset on new journey ── */
  useEffect(() => {
    snapshotsRef.current = [];
    lastSnapshotAtRef.current = 0;
    lastAnalysisAtRef.current = 0;
    setResult(CLEAN_RESULT);
  // route?.id intentional: a new route object with the same id is the same journey.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, route?.id]);

  /* ── Accumulate snapshots + periodic analysis ── */
  useEffect(() => {
    if (!route || !location) return;

    const now = Date.now();

    // Throttle snapshot collection.
    if (now - lastSnapshotAtRef.current < SNAPSHOT_INTERVAL_MS) return;

    lastSnapshotAtRef.current = now;

    const snapshot: JourneySnapshot = {
      timestamp: now,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      // expo-location returns null when the platform doesn't supply speed.
      speed: location.coords.speed ?? null,
    };

    // Append immutably so analyzeJourney always sees a consistent array.
    snapshotsRef.current = [...snapshotsRef.current, snapshot];

    // Only run the full analysis at the coarser interval.
    if (now - lastAnalysisAtRef.current < ANALYSIS_INTERVAL_MS) return;

    lastAnalysisAtRef.current = now;

    const analysisResult = analyzeJourney(
      {
        routeCoordinates: route.coordinates,
        expectedDurationSeconds: route.duration,
        startedAt,
        snapshots: snapshotsRef.current,
      },
      now
    );

    setResult(analysisResult);
  }, [location, route, startedAt]);

  // Short-circuit when detection is disabled.
  if (!route) return CLEAN_RESULT;

  return result;
}
