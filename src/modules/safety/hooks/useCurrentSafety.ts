import { useEffect, useState } from "react";

import { useLiveLocation } from "../../route/hooks/useLiveLocation";
import { getRouteSafety } from "../../route/services/routeSafetyService";

import type { RouteSafetyResult } from "../../route/services/routeSafetyService";

export interface CurrentSafetyState {
  readonly location: ReturnType<
    typeof useLiveLocation
  >["location"];
  readonly locationLoading: boolean;
  readonly permissionDenied: boolean;
  readonly safetyResult: RouteSafetyResult | null;
  readonly safetyLoading: boolean;
  readonly error: string | null;
}

function isValidCoordinate(
  latitude: number,
  longitude: number,
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function useCurrentSafety(): CurrentSafetyState {
  const {
    location,
    loading: locationLoading,
    permissionDenied,
    locationUnavailable,
  } = useLiveLocation();

  const [
    safetyResult,
    setSafetyResult,
  ] = useState<RouteSafetyResult | null>(
    null,
  );

  const [
    safetyLoading,
    setSafetyLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (locationLoading) {
      return;
    }

    if (permissionDenied) {
      setSafetyResult(null);
      setSafetyLoading(false);
      setError(
        "Location permission is required to analyze nearby safety data.",
      );
      return;
    }

    if (
      locationUnavailable ||
      !location
    ) {
      setSafetyResult(null);
      setSafetyLoading(false);
      setError(
        "Current location is temporarily unavailable.",
      );
      return;
    }

    const {
      latitude,
      longitude,
    } = location.coords;

    if (
      !isValidCoordinate(
        latitude,
        longitude,
      )
    ) {
      setSafetyResult(null);
      setSafetyLoading(false);
      setError(
        "The device returned an invalid location.",
      );
      return;
    }

    let mounted = true;

    const loadSafety =
      async (): Promise<void> => {
        setSafetyLoading(true);
        setError(null);

        try {
          const result =
            await getRouteSafety({
              latitude,
              longitude,
            });

          if (!mounted) {
            return;
          }

          setSafetyResult(result);
        } catch (requestError: unknown) {
          if (!mounted) {
            return;
          }

          /*
           * Safety data is supplementary.
           * A temporary Overpass failure should not
           * break the current-location experience.
           */
          setSafetyResult(null);

          if (
            requestError instanceof Error &&
            "code" in requestError
          ) {
            const code =
              (
                requestError as {
                  code?: unknown;
                }
              ).code;

            if (
              code === "TIMEOUT" ||
              code === "NETWORK" ||
              code === "RATE_LIMIT" ||
              code === "SERVER"
            ) {
              setError(
                "Live safety data is temporarily unavailable.",
              );
              return;
            }
          }

          setError(
            "Unable to load nearby safety data.",
          );
        } finally {
          if (mounted) {
            setSafetyLoading(false);
          }
        }
      };

    void loadSafety();

    return () => {
      mounted = false;
    };
  }, [
    locationLoading,
    permissionDenied,
    locationUnavailable,
    location,
  ]);

  return {
    location,
    locationLoading,
    permissionDenied,
    safetyResult,
    safetyLoading,
    error,
  };
}