import type { CrimeAreaRecord } from "../types/crimeTypes";

/**
 * Source-backed Coimbatore crime intelligence.
 *
 * IMPORTANT:
 * These are AREA-LEVEL historical signals.
 *
 * They are NOT:
 * - live crime rates
 * - exact street crime
 * - exact incident locations
 *
 * The model intentionally becomes more specific only
 * when reliable source-backed data is available.
 *
 * Current verified sources include:
 * - Tamil Nadu Police / Coimbatore City police structure
 * - Coimbatore crime reporting describing division/range
 *   differences for 2024 / early 2025
 */

const COIMBATORE_CITY_SOURCE =
  "Tamil Nadu Police Crime Review 2023";

const COIMBATORE_CITY_PERIOD =
  "2023";

const COIMBATORE_CITY_CENTER = {
  latitude: 11.0168,
  longitude: 76.9558,
} as const;

/**
 * Verified area-level records.
 *
 * NOTE:
 * The coordinates/radii here are geographic matching anchors,
 * not crime boundaries.
 */
export const CRIME_AREA_RECORDS:
  readonly CrimeAreaRecord[] = [
  {
    areaId:
      "coimbatore-city",

    areaName:
      "Coimbatore City",

    level:
      "city",

    parentAreaName:
      null,

    center:
      COIMBATORE_CITY_CENTER,

    radiusMeters:
      7_500,

    /**
     * The 2023 police source provides historical crime
     * counts but does not itself define LOW/MODERATE/HIGH.
     *
     * Keep the exposure unavailable rather than inventing
     * a classification from the raw count.
     */
    exposure:
      "unavailable",

    classificationSource:
      "unavailable",

    source:
      COIMBATORE_CITY_SOURCE,

    period:
      COIMBATORE_CITY_PERIOD,

    evidenceCount:
      141,

    evidenceNote:
      "The 2023 police crime review reports 141 grave crimes for Coimbatore City. This record is historical area-level evidence, not a live crime rate.",
  },

  /*
   * ------------------------------------------------------------
   * NORTH DIVISION
   * ------------------------------------------------------------
   *
   * Public reporting from April 2025 described crime in the
   * north division as roughly twice the south division for the
   * compared periods and identified Singanallur range as the
   * crime-prone range within that division.
   *
   * Because the source is descriptive rather than a normalized
   * official risk score, the exposure is kept "unavailable"
   * at the broad division level.
   *
   * The source note remains useful to the Bubble as evidence.
   */
  {
    areaId:
      "coimbatore-north-division",

    areaName:
      "North Division",

    level:
      "division",

    parentAreaName:
      "Coimbatore City",

    /*
     * Approximate geographic anchor for matching.
     *
     * This is a division-level lookup anchor and should not
     * be presented to users as a boundary or crime point.
     */
    center: {
      latitude: 11.0450,
      longitude: 76.9700,
    },

    radiusMeters:
      6_500,

    exposure:
      "unavailable",

    classificationSource:
      "source-described",

    source:
      "Times of India — Coimbatore City crime analysis",

    period:
      "2024 / Q1 2025 comparison",

    evidenceCount:
      null,

    evidenceNote:
      "Public reporting described the North Division as having nearly twice the crime of the South Division in the compared periods and highlighted higher incidence across several crime categories.",
  },

  /*
   * ------------------------------------------------------------
   * SOUTH DIVISION
   * ------------------------------------------------------------
   */
  {
    areaId:
      "coimbatore-south-division",

    areaName:
      "South Division",

    level:
      "division",

    parentAreaName:
      "Coimbatore City",

    center: {
      latitude: 10.9950,
      longitude: 76.9500,
    },

    radiusMeters:
      6_000,

    exposure:
      "unavailable",

    classificationSource:
      "source-described",

    source:
      "Times of India — Coimbatore City crime analysis",

    period:
      "2024 / Q1 2025 comparison",

    evidenceCount:
      null,

    evidenceNote:
      "Public reporting described the South Division as having fewer reported cases than the North Division in the compared periods.",
  },

  /*
   * ------------------------------------------------------------
   * SINGANALLUR RANGE
   * ------------------------------------------------------------
   *
   * This is currently our most useful finer-grained signal.
   *
   * Public reporting specifically described Singanallur range
   * as the more crime-prone range within the North Division.
   *
   * We keep this as a source-described signal instead of
   * manufacturing a numerical crime percentage.
   */
  {
    areaId:
      "coimbatore-singanallur-range",

    areaName:
      "Singanallur Range",

    level:
      "range",

    parentAreaName:
      "North Division",

    center: {
      latitude: 11.0002,
      longitude: 77.0046,
    },

    radiusMeters:
      4_000,

    exposure:
      "high",

    classificationSource:
      "source-described",

    source:
      "Times of India — Coimbatore City crime analysis",

    period:
      "2024 / Q1 2025 comparison",

    evidenceCount:
      null,

    evidenceNote:
      "The report identifies the Singanallur range as the crime-prone area within the North Division compared with the other ranges discussed.",
  },
] as const;