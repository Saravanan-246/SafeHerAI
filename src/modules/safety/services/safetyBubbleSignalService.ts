import type { Coordinates } from "../../route/types";

import {
  getNearestMedicalFacility,
} from "./nearbyMedicalService";

import {
  getNearestPoliceStation,
} from "./nearbyPoliceService";

export interface SafetyBubbleSignals {
  readonly policeAccess:
    | number
    | undefined;

  readonly medicalAccess:
    | number
    | undefined;

  readonly emergencyAccess:
    | number
    | undefined;

  readonly policeName:
    | string
    | null;

  readonly policeDistanceMeters:
    | number
    | null;

  readonly policeAddress:
    | string
    | null;

  readonly medicalName:
    | string
    | null;

  readonly medicalDistanceMeters:
    | number
    | null;

  readonly medicalAddress:
    | string
    | null;

  readonly policeAvailable:
    boolean;

  readonly medicalAvailable:
    boolean;
}

const BEST_DISTANCE_METERS = 100;
const MAX_DISTANCE_METERS = 5_000;

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
    Number.isFinite(
      value.latitude,
    ) &&
    Number.isFinite(
      value.longitude,
    ) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

function getProximityScore(
  distanceMeters: number,
): number {
  if (
    !Number.isFinite(
      distanceMeters,
    ) ||
    distanceMeters < 0
  ) {
    return 0;
  }

  if (
    distanceMeters <=
    BEST_DISTANCE_METERS
  ) {
    return 100;
  }

  if (
    distanceMeters >=
    MAX_DISTANCE_METERS
  ) {
    return 0;
  }

  const score =
    ((MAX_DISTANCE_METERS -
      distanceMeters) /
      (MAX_DISTANCE_METERS -
        BEST_DISTANCE_METERS)) *
    100;

  return Math.round(
    Math.max(
      0,
      Math.min(
        100,
        score,
      ),
    ),
  );
}

function getEmergencyAccessScore(
  medicalAccess:
    | number
    | undefined,
): number | undefined {
  if (
    medicalAccess ===
    undefined
  ) {
    return undefined;
  }

  return medicalAccess;
}

export async function getSafetyBubbleSignals(
  location: Coordinates,
): Promise<SafetyBubbleSignals> {
  if (
    !isValidCoordinates(
      location,
    )
  ) {
    return {
      policeAccess: undefined,
      medicalAccess: undefined,
      emergencyAccess: undefined,

      policeName: null,
      policeDistanceMeters: null,
      policeAddress: null,

      medicalName: null,
      medicalDistanceMeters: null,
      medicalAddress: null,

      policeAvailable: false,
      medicalAvailable: false,
    };
  }

  /*
   * Run both lookups independently.
   *
   * One failing service must not destroy the
   * other valid safety signal.
   */
  const [
    policeResult,
    medicalResult,
  ] = await Promise.allSettled([
    getNearestPoliceStation(
      location,
    ),
    getNearestMedicalFacility(
      location,
    ),
  ]);

  const police =
    policeResult.status ===
    "fulfilled"
      ? policeResult.value.station
      : null;

  const medical =
    medicalResult.status ===
    "fulfilled"
      ? medicalResult.value.facility
      : null;

  const policeAccess =
    police
      ? getProximityScore(
          police.distanceMeters,
        )
      : undefined;

  const medicalAccess =
    medical
      ? getProximityScore(
          medical.distanceMeters,
        )
      : undefined;

  return {
    policeAccess,

    medicalAccess,

    emergencyAccess:
      getEmergencyAccessScore(
        medicalAccess,
      ),

    policeName:
      police?.name ?? null,

    policeDistanceMeters:
      police?.distanceMeters ??
      null,

    policeAddress:
      police?.address ?? null,

    medicalName:
      medical?.name ?? null,

    medicalDistanceMeters:
      medical?.distanceMeters ??
      null,

    medicalAddress:
      medical?.address ?? null,

    policeAvailable:
      police !== null,

    medicalAvailable:
      medical !== null,
  };
}