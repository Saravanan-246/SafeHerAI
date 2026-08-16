import type { Coordinates } from "../../route/types";

export type CrimeExposure =
  | "low"
  | "moderate"
  | "high"
  | "unavailable";

export type CrimeGeographyLevel =
  | "city"
  | "division"
  | "range"
  | "locality"
  | "ward";

export type CrimeClassificationSource =
  | "source-described"
  | "derived"
  | "unavailable";

export interface CrimeAreaRecord {
  /**
   * Stable identifier.
   */
  readonly areaId: string;

  /**
   * Human-readable geographic name.
   */
  readonly areaName: string;

  /**
   * Geographic level represented by this record.
   */
  readonly level: CrimeGeographyLevel;

  /**
   * Parent geographic area.
   *
   * Example:
   * Singanallur Range → North Division
   */
  readonly parentAreaName: string | null;

  /**
   * Representative coordinate used only as an
   * area matching anchor.
   *
   * It is NOT a crime location.
   */
  readonly center: Coordinates;

  /**
   * Approximate coverage radius for matching.
   *
   * This represents the source's geographic scope,
   * not an exact crime boundary.
   */
  readonly radiusMeters: number;

  /**
   * Historical/source-backed exposure classification.
   *
   * "unavailable" is valid when the source contains
   * evidence but does not justify a risk classification.
   */
  readonly exposure: CrimeExposure;

  /**
   * Explains how the classification was obtained.
   */
  readonly classificationSource:
    CrimeClassificationSource;

  /**
   * Source title / organization.
   */
  readonly source: string;

  /**
   * Reporting period.
   */
  readonly period: string;

  /**
   * Optional evidence count.
   *
   * Null when the source does not expose a count.
   */
  readonly evidenceCount: number | null;

  /**
   * Optional source note explaining the evidence.
   */
  readonly evidenceNote: string | null;
}

export interface CrimeLookupResult {
  readonly exposure: CrimeExposure;

  readonly areaName: string | null;

  readonly level:
    | CrimeGeographyLevel
    | null;

  readonly parentAreaName: string | null;

  readonly source: string | null;

  readonly period: string | null;

  readonly evidenceCount: number | null;

  readonly evidenceNote: string | null;

  readonly classificationSource:
    | CrimeClassificationSource
    | null;

  /**
   * Distance from current GPS to the selected
   * area's representative coordinate.
   */
  readonly distanceMeters: number | null;
}