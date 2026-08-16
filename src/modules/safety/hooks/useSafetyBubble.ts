import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  Coordinates,
  Route,
} from "../../route/types";

import type {
  RouteSafetyResult,
} from "../../route/services/safetyTypes";

interface UseSafetyBubbleOptions {
  readonly selectedRoute?: Route | null;
  readonly currentLocation?: Coordinates | null;
  readonly destination?: string | null;
}

export interface SafetyBubbleState {
  readonly safetyResult:
    | RouteSafetyResult
    | null;

  readonly loading: boolean;

  readonly error: string | null;

  readonly refresh: () => void;
}

/*
 * ---------------------------------------------------------------------------
 * SAFEHERAI DEMO MODE
 * ---------------------------------------------------------------------------
 *
 * This hook intentionally uses deterministic demo data.
 *
 * The values below are DEMO VALUES for presentation/testing.
 * They are NOT live police, medical, crime, or public-safety statistics.
 *
 * Keeping this switch here lets the rest of the application continue using
 * the same SafetyBubbleState contract without depending on a public API
 * during the hackathon demo.
 */

const DEMO_MODE = true;

const DEMO_POLICE_COORDINATES = {
  latitude: 11.0395,
  longitude: 76.9708,
} as const;

const DEMO_MEDICAL_COORDINATES = {
  latitude: 11.0305,
  longitude: 76.9765,
} as const;

function createDemoResult(): RouteSafetyResult {
  return {
    analysis: {
      policeAccess: 91,
      medicalAccess: 86,
      activity: 72,
      emergencyAccess: 88,

      /*
       * DEMO ONLY.
       *
       * This is a presentation signal, not a live crime score.
       */
      crimeExposure: 60,

      /*
       * No verified lighting dataset is being claimed.
       */
      lighting: undefined,

      /*
       * No separate historical-risk calculation is claimed.
       */
      historicalRisk: undefined,
    },

    /*
     * Supplying places here lets the existing Safety Bubble UI
     * continue displaying nearby protection without making another
     * network request for the demo.
     */
    places: [
      {
        id: "demo-police-gandhimanagar",
        name: "Gandhimanagar Police Station",
        type: "Police",
        coordinates:
          DEMO_POLICE_COORDINATES,
        distance: 1200,
      },

      {
        id: "demo-medical-coimbatore",
        name: "Coimbatore Medical Centre",
        type: "Medical",
        coordinates:
          DEMO_MEDICAL_COORDINATES,
        distance: 1600,
      },

      {
        id: "demo-activity-01",
        name: "Nearby Public Activity",
        type: "Activity",
        coordinates: {
          latitude: 11.0352,
          longitude: 76.9731,
        },
        distance: 420,
      },

      {
        id: "demo-activity-02",
        name: "Nearby Commercial Area",
        type: "Activity",
        coordinates: {
          latitude: 11.0368,
          longitude: 76.9689,
        },
        distance: 680,
      },

      {
        id: "demo-activity-03",
        name: "Nearby Transit Point",
        type: "Activity",
        coordinates: {
          latitude: 11.0339,
          longitude: 76.9752,
        },
        distance: 910,
      },

      {
        id: "demo-medical-emergency",
        name: "Emergency Medical Facility",
        type: "Medical",
        coordinates: {
          latitude: 11.0314,
          longitude: 76.9776,
        },
        distance: 1750,
        emergency: "yes",
      },
    ],
  };
}

function isValidCoordinate(
  coordinate:
    | Coordinates
    | null
    | undefined,
): coordinate is Coordinates {
  if (!coordinate) {
    return false;
  }

  return (
    Number.isFinite(
      coordinate.latitude,
    ) &&
    Number.isFinite(
      coordinate.longitude,
    ) &&
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180
  );
}

export function useSafetyBubble(
  options: UseSafetyBubbleOptions,
): SafetyBubbleState {
  const {
    selectedRoute = null,
    currentLocation = null,
    destination = null,
  } = options;

  /*
   * Keep the parameters intentionally consumed so the hook remains
   * compatible with the existing Safety Bubble screen and navigation flow.
   */
  void selectedRoute;
  void destination;

  const [
    safetyResult,
    setSafetyResult,
  ] = useState<RouteSafetyResult | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState<boolean>(
    DEMO_MODE
      ? false
      : true,
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const loadDemoSafety =
    useCallback((): void => {
      /*
       * The current location is still required by the application.
       * We do not invent a GPS location when permissions/location are absent.
       */
      if (
        !isValidCoordinate(
          currentLocation,
        )
      ) {
        setSafetyResult(null);
        setError(
          "Current location is unavailable.",
        );
        setLoading(false);
        return;
      }

      /*
       * Instant deterministic demo result.
       */
      setSafetyResult(
        createDemoResult(),
      );

      setError(null);
      setLoading(false);
    }, [
      currentLocation,
    ]);

  useEffect(() => {
    if (DEMO_MODE) {
      loadDemoSafety();
      return;
    }

    /*
     * Live mode intentionally left behind the DEMO_MODE switch.
     *
     * This keeps the hackathon build stable while preserving the hook
     * contract for the future live implementation.
     */
    setSafetyResult(null);
    setError(
      "Live safety mode is disabled for the current demo build.",
    );
    setLoading(false);
  }, [
    loadDemoSafety,
  ]);

  const refresh =
    useCallback((): void => {
      loadDemoSafety();
    }, [
      loadDemoSafety,
    ]);

  return {
    safetyResult,
    loading,
    error,
    refresh,
  };
}