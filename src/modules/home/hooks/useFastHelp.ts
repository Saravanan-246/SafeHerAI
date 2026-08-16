import {
  useCallback,
  useRef,
  useState,
} from "react";

import type { LocationObject } from "expo-location";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type {
  Coordinates,
  Route,
  RoutePriority,
} from "../../route/types";

import {
  getRoutes,
} from "../../route/services/routeService";

import {
  rankRoutes,
} from "../../route/services/routeRankingService";

import type {
  RootStackParamList,
} from "../../../navigation/AppNavigator";

export type FastHelpType =
  | "police"
  | "medical";

interface FastHelpState {
  readonly loading: boolean;
  readonly selectedType:
    | FastHelpType
    | null;
  readonly error: string | null;
}

interface FastHelpDestination {
  readonly name: string;
  readonly coordinates: Coordinates;
}

/*
 * ---------------------------------------------------------------------------
 * SAFEHERAI DEMO FAST HELP
 * ---------------------------------------------------------------------------
 *
 * Fast Help uses deterministic demo facilities for the hackathon build.
 *
 * IMPORTANT:
 * These are presentation/demo coordinates.
 * They are NOT live emergency-service data.
 *
 * The routing step remains real and still uses the existing
 * getRoutes() + RouteResults flow.
 */

const DEMO_POLICE = {
  name: "Gandhimanagar Police Station",
  coordinates: {
    latitude: 11.0395,
    longitude: 76.9708,
  },
} as const;

const DEMO_MEDICAL = {
  name: "Coimbatore Medical Centre",
  coordinates: {
    latitude: 11.0305,
    longitude: 76.9765,
  },
} as const;

function toCoordinates(
  location:
    | LocationObject
    | null
    | undefined,
): Coordinates | null {
  if (!location) {
    return null;
  }

  const {
    latitude,
    longitude,
  } = location.coords;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function isValidRoute(
  route: Route,
): boolean {
  return (
    Array.isArray(
      route.coordinates,
    ) &&
    route.coordinates.length > 0 &&
    Number.isFinite(
      route.distance,
    ) &&
    Number.isFinite(
      route.duration,
    )
  );
}

function getDefaultError(
  type: FastHelpType,
): string {
  return type === "police"
    ? "Unable to calculate a route to the demo police facility."
    : "Unable to calculate a route to the demo medical facility.";
}

function getDemoDestination(
  type: FastHelpType,
): FastHelpDestination {
  if (type === "police") {
    return {
      name: DEMO_POLICE.name,
      coordinates: {
        latitude:
          DEMO_POLICE.coordinates
            .latitude,
        longitude:
          DEMO_POLICE.coordinates
            .longitude,
      },
    };
  }

  return {
    name: DEMO_MEDICAL.name,
    coordinates: {
      latitude:
        DEMO_MEDICAL.coordinates
          .latitude,
      longitude:
        DEMO_MEDICAL.coordinates
          .longitude,
    },
  };
}

export function useFastHelp(
  location:
    | LocationObject
    | null
    | undefined,
  navigation:
    NativeStackNavigationProp<
      RootStackParamList
    >,
) {
  const [
    state,
    setState,
  ] = useState<FastHelpState>({
    loading: false,
    selectedType: null,
    error: null,
  });

  /*
   * Every request gets a unique id.
   *
   * This prevents an older tap from overwriting
   * the result of a newer tap.
   */
  const requestIdRef =
    useRef(0);

  const findFastHelp =
    useCallback(
      async (
        type: FastHelpType,
      ): Promise<void> => {
        const requestId =
          requestIdRef.current + 1;

        requestIdRef.current =
          requestId;

        /*
         * Show loading immediately.
         */
        setState({
          loading: true,
          selectedType: type,
          error: null,
        });

        const currentLocation =
          toCoordinates(
            location,
          );

        if (!currentLocation) {
          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          setState({
            loading: false,
            selectedType: type,
            error:
              "Your current location is unavailable.",
          });

          return;
        }

        try {
          /*
           * --------------------------------------------------------
           * DEMO DESTINATION
           * --------------------------------------------------------
           *
           * No live Overpass lookup here.
           *
           * This removes the timeout problem while keeping
           * your real routing system.
           */
          const destination =
            getDemoDestination(
              type,
            );

          /*
           * --------------------------------------------------------
           * REAL ROUTING
           * --------------------------------------------------------
           *
           * Current GPS → demo facility
           *
           * The route itself is still generated by your existing
           * routeService and then ranked by your existing
           * routeRankingService.
           */
          const routeResults =
            await getRoutes(
              currentLocation,
              destination.coordinates,
            );

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          const routes =
            routeResults.filter(
              isValidRoute,
            );

          if (
            routes.length === 0
          ) {
            setState({
              loading: false,
              selectedType: type,
              error:
                getDefaultError(
                  type,
                ),
            });

            return;
          }

          /*
           * Keep the existing route priority contract.
           */
          const priority:
            RoutePriority =
            "balanced";

          const rankedRoutes =
            rankRoutes(
              routes,
              priority,
            );

          const selectedRoute =
            rankedRoutes[0];

          if (!selectedRoute) {
            setState({
              loading: false,
              selectedType: type,
              error:
                "No valid route was returned.",
            });

            return;
          }

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          /*
           * Stop the loading state BEFORE navigation.
           */
          setState({
            loading: false,
            selectedType: null,
            error: null,
          });

          navigation.navigate(
            "RouteResults",
            {
              destination:
                destination.name,

              currentLocation,

              routes:
                rankedRoutes,

              selectedRouteId:
                selectedRoute.id,

              priority,
            },
          );
        } catch (
          error: unknown
        ) {
          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          const message =
            error instanceof Error &&
            error.message.trim().length > 0
              ? error.message.trim()
              : getDefaultError(
                  type,
                );

          setState({
            loading: false,
            selectedType: type,
            error: message,
          });
        }
      },
      [
        location,
        navigation,
      ],
    );

  const clearError =
    useCallback(
      (): void => {
        /*
         * Invalidate any request still running.
         */
        requestIdRef.current += 1;

        setState({
          loading: false,
          selectedType: null,
          error: null,
        });
      },
      [],
    );

  return {
    loading:
      state.loading,

    selectedType:
      state.selectedType,

    error:
      state.error,

    findFastHelp,
    clearError,
  };
}