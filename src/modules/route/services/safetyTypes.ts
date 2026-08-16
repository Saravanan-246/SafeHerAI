import type {
  Coordinates,
  SafetyAnalysis,
} from "../types";

/* ─────────────────────────────────────────────────────────────────────────────
 * Public types
 * ───────────────────────────────────────────────────────────────────────────── */

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

/*
 * Re-export shared route types so consumers can import them from
 * the safety module when convenient.
 */
export type {
  Coordinates,
  SafetyAnalysis,
} from "../types";