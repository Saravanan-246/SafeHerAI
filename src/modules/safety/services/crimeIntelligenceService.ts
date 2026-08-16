import type { Coordinates } from "../../route/types";

import { CRIME_AREA_RECORDS } from "../data/crimeAreas";

import type {
  CrimeAreaRecord,
  CrimeLookupResult,
} from "../types/crimeTypes";

const EARTH_RADIUS_METERS = 6_371_000;

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
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

function getDistanceMeters(
  from: Coordinates,
  to: Coordinates,
): number {
  const latitudeDelta =
    ((to.latitude - from.latitude) *
      Math.PI) /
    180;

  const longitudeDelta =
    ((to.longitude - from.longitude) *
      Math.PI) /
    180;

  const fromLatitude =
    (from.latitude * Math.PI) /
    180;

  const toLatitude =
    (to.latitude * Math.PI) /
    180;

  const sinLatitude =
    Math.sin(latitudeDelta / 2);

  const sinLongitude =
    Math.sin(longitudeDelta / 2);

  const a =
    sinLatitude * sinLatitude +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      sinLongitude *
      sinLongitude;

  const clampedA = Math.max(
    0,
    Math.min(1, a),
  );

  const c =
    2 *
    Math.atan2(
      Math.sqrt(clampedA),
      Math.sqrt(1 - clampedA),
    );

  return (
    EARTH_RADIUS_METERS * c
  );
}

function createUnavailableResult(): CrimeLookupResult {
  return {
    exposure: "unavailable",
    areaName: null,
    level: null,
    parentAreaName: null,
    source: null,
    period: null,
    evidenceCount: null,
    evidenceNote: null,
    classificationSource: null,
    distanceMeters: null,
  };
}

function isValidCrimeArea(
  area: CrimeAreaRecord,
): boolean {
  return (
    area.areaId.trim().length > 0 &&
    area.areaName.trim().length > 0 &&
    isValidCoordinates(
      area.center,
    ) &&
    Number.isFinite(
      area.radiusMeters,
    ) &&
    area.radiusMeters > 0 &&
    area.source.trim().length > 0 &&
    area.period.trim().length > 0
  );
}

function findMatchingCrimeArea(
  location: Coordinates,
): {
  readonly record: CrimeAreaRecord;
  readonly distanceMeters: number;
} | null {
  let bestMatch:
    | {
        readonly record: CrimeAreaRecord;
        readonly distanceMeters: number;
      }
    | null = null;

  for (
    const record of CRIME_AREA_RECORDS
  ) {
    if (
      !isValidCrimeArea(record)
    ) {
      continue;
    }

    const distanceMeters =
      getDistanceMeters(
        location,
        record.center,
      );

    if (
      !Number.isFinite(
        distanceMeters,
      )
    ) {
      continue;
    }

    if (
      distanceMeters >
      record.radiusMeters
    ) {
      continue;
    }

    /*
     * Prefer the more specific geographic level.
     *
     * locality/ward
     *   > range
     *   > division
     *   > city
     */
    if (bestMatch === null) {
      bestMatch = {
        record,
        distanceMeters,
      };
      continue;
    }

    const currentLevel =
      getGeographyPriority(
        record.level,
      );

    const previousLevel =
      getGeographyPriority(
        bestMatch.record.level,
      );

    if (
      currentLevel >
        previousLevel ||
      (
        currentLevel ===
          previousLevel &&
        distanceMeters <
          bestMatch.distanceMeters
      )
    ) {
      bestMatch = {
        record,
        distanceMeters,
      };
    }
  }

  return bestMatch;
}

function getGeographyPriority(
  level:
    | CrimeAreaRecord["level"],
): number {
  switch (level) {
    case "city":
      return 1;

    case "division":
      return 2;

    case "range":
      return 3;

    case "locality":
      return 4;

    case "ward":
      return 5;
  }
}

export function getCrimeExposure(
  location: Coordinates,
): CrimeLookupResult {
  if (
    !isValidCoordinates(
      location,
    )
  ) {
    return createUnavailableResult();
  }

  if (
    CRIME_AREA_RECORDS.length ===
    0
  ) {
    return createUnavailableResult();
  }

  const match =
    findMatchingCrimeArea(
      location,
    );

  if (!match) {
    return createUnavailableResult();
  }

  const {
    record,
    distanceMeters,
  } = match;

  return {
    exposure:
      record.exposure,

    areaName:
      record.areaName,

    level:
      record.level,

    parentAreaName:
      record.parentAreaName,

    source:
      record.source,

    period:
      record.period,

    evidenceCount:
      record.evidenceCount,

    evidenceNote:
      record.evidenceNote,

    classificationSource:
      record.classificationSource,

    distanceMeters,
  };
}

export function isWithinCrimeArea(
  location: Coordinates,
  area: CrimeAreaRecord,
): boolean {
  if (
    !isValidCoordinates(
      location,
    ) ||
    !isValidCrimeArea(area)
  ) {
    return false;
  }

  return (
    getDistanceMeters(
      location,
      area.center,
    ) <=
    area.radiusMeters
  );
}

export function getDistanceBetweenCrimePoints(
  from: Coordinates,
  to: Coordinates,
): number {
  if (
    !isValidCoordinates(from) ||
    !isValidCoordinates(to)
  ) {
    return NaN;
  }

  return getDistanceMeters(
    from,
    to,
  );
}