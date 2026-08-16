import {
  useCallback,
  useRef,
  useState,
} from "react";
import * as Location from "expo-location";

import { geocodeDestination } from "../services/geocodingService";
import { getRoutes } from "../services/routeService";
import { getRoutePathSafety } from "../services/routeSafetyService";
import {
  rankRoutes,
  routesHaveSafetyData,
} from "../services/routeRankingService";

import type {
  Coordinates,
  Route,
  RoutePriority,
} from "../types";

interface RoutePlannerState {
  readonly currentLocation: Coordinates | null;
  readonly destination: string;
  readonly routes: Route[];
  readonly selectedRouteId: string | null;
  readonly priority: RoutePriority;
  readonly loading: boolean;
  readonly error: string | null;
}

interface RouteSearchInput {
  readonly destination: string;
  readonly destinationCoordinates?: Coordinates;
  readonly originCoordinates?: Coordinates;
}

function toCoordinates(
  location: Location.LocationObject,
): Coordinates | null {
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

function isValidCoordinates(
  value: Coordinates | null | undefined,
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

function getRouteErrorMessage(
  error: unknown,
): string {
  if (!(error instanceof Error)) {
    return "Unable to calculate a route right now.";
  }

  const message =
    error.message.toLowerCase();

  if (
    message.includes("destination") ||
    message.includes("geocod")
  ) {
    return "Destination not found.";
  }

  if (
    message.includes("no route") ||
    message.includes("route not found")
  ) {
    return "Unable to calculate a route to that destination.";
  }

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("timed out")
  ) {
    return "Network unavailable. Please try again.";
  }

  return (
    error.message.trim() ||
    "Unable to calculate a route right now."
  );
}

function isValidRoute(
  route: Route,
): boolean {
  return (
    Array.isArray(route.coordinates) &&
    route.coordinates.length > 0 &&
    Number.isFinite(route.distance) &&
    Number.isFinite(route.duration)
  );
}

export function useRoutePlanner() {
  const [
    state,
    setState,
  ] = useState<RoutePlannerState>({
    currentLocation: null,
    destination: "",
    routes: [],
    selectedRouteId: null,
    priority: "balanced",
    loading: false,
    error: null,
  });

  /*
   * Every route search gets a unique request ID.
   * Older async work can never overwrite a newer search.
   */
  const requestIdRef =
    useRef<number>(0);

  const setDestination =
    useCallback(
      (destination: string): void => {
        setState((previous) => ({
          ...previous,
          destination,
          error: null,
        }));
      },
      [],
    );

  const setCurrentLocation =
    useCallback(
      (
        location: Location.LocationObject,
      ): void => {
        const coordinates =
          toCoordinates(location);

        if (!coordinates) {
          return;
        }

        setState((previous) => ({
          ...previous,
          currentLocation:
            coordinates,
          error: null,
        }));
      },
      [],
    );

  const setPriority =
    useCallback(
      (
        priority: RoutePriority,
      ): void => {
        setState((previous) => {
          const rankedRoutes =
            rankRoutes(
              previous.routes,
              priority,
            );

          return {
            ...previous,
            priority,
            routes: rankedRoutes,
            selectedRouteId:
              rankedRoutes[0]?.id ??
              null,
          };
        });
      },
      [],
    );

  /*
   * Shared route pipeline.
   *
   * Used by:
   * 1. normal text destination searches
   * 2. exact-coordinate destinations such as
   *    the nearest police/medical facility
   *
   * originCoordinates is optional so existing
   * RouteScreen behavior remains unchanged.
   */
  const findRoutesForInput =
    useCallback(
      async (
        input: RouteSearchInput,
      ): Promise<Route[] | null> => {
        /*
         * Prefer an explicitly supplied origin.
         *
         * This is required for Home Fast Help because
         * Home already has the latest real GPS position.
         *
         * Normal RouteScreen searches continue using
         * the planner's existing currentLocation state.
         */
        const currentLocation =
          input.originCoordinates ??
          state.currentLocation;

        const destination =
          input.destination.trim();

        const priority =
          state.priority;

        if (!currentLocation) {
          setState((previous) => ({
            ...previous,
            error:
              "Current location is unavailable.",
          }));

          return null;
        }

        if (
          !isValidCoordinates(
            input.destinationCoordinates,
          ) &&
          !destination
        ) {
          setState((previous) => ({
            ...previous,
            error:
              "Enter a destination.",
          }));

          return null;
        }

        const requestId =
          requestIdRef.current + 1;

        requestIdRef.current =
          requestId;

        /*
         * Keep the planner state synchronized with
         * the exact origin used for this request.
         *
         * This also makes RouteResults receive the
         * correct Home GPS after Fast Help routing.
         */
        setState((previous) => ({
          ...previous,
          currentLocation,
          destination,
          loading: true,
          error: null,
          routes: [],
          selectedRouteId: null,
        }));

        try {
          /*
           * ---------------------------------------------------------
           * STEP 1
           * Resolve destination coordinates.
           *
           * Police/medical flows already provide exact
           * coordinates, so geocoding is skipped.
           * ---------------------------------------------------------
           */
          const destinationCoordinates =
            isValidCoordinates(
              input.destinationCoordinates,
            )
              ? input.destinationCoordinates
              : await geocodeDestination(
                  destination,
                );

          if (
            requestId !==
            requestIdRef.current
          ) {
            return null;
          }

          /*
           * ---------------------------------------------------------
           * STEP 2
           * Get real routes immediately.
           * ---------------------------------------------------------
           */
          const routeResults =
            await getRoutes(
              currentLocation,
              destinationCoordinates,
            );

          if (
            requestId !==
            requestIdRef.current
          ) {
            return null;
          }

          const validRoutes =
            routeResults.filter(
              isValidRoute,
            );

          if (
            validRoutes.length === 0
          ) {
            throw new Error(
              "No route found.",
            );
          }

          /*
           * ---------------------------------------------------------
           * STEP 3
           * Rank immediately.
           * ---------------------------------------------------------
           */
          const initialRoutes =
            rankRoutes(
              validRoutes,
              priority,
            );

          const firstRoute =
            initialRoutes[0];

          if (!firstRoute) {
            throw new Error(
              "No route found.",
            );
          }

          /*
           * Stop loading as soon as actual routes
           * are available.
           */
          setState((previous) => ({
            ...previous,
            currentLocation,
            routes: initialRoutes,
            selectedRouteId:
              firstRoute.id,
            loading: false,
            error: null,
          }));

          /*
           * ---------------------------------------------------------
           * STEP 4
           * Safety enrichment happens in background.
           * ---------------------------------------------------------
           */
          void Promise.allSettled(
            initialRoutes.map(
              async (
                route,
              ): Promise<Route> => {
                try {
                  const safetyResult =
                    await getRoutePathSafety(
                      route.coordinates,
                    );

                  return {
                    ...route,
                    safety:
                      safetyResult.analysis,
                  };
                } catch (
                  safetyError: unknown
                ) {
                  console.warn(
                    `Safety data unavailable for ${route.id}:`,
                    safetyError,
                  );

                  return route;
                }
              },
            ),
          ).then((results) => {
            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }

            const enrichedRoutes: Route[] =
              results.map(
                (
                  result,
                  index,
                ) => {
                  const originalRoute =
                    initialRoutes[index];

                  /*
                   * This guard should never normally
                   * trigger, but keeps strict mode safe.
                   */
                  if (!originalRoute) {
                    return result.status ===
                      "fulfilled"
                      ? result.value
                      : originalRoute;
                  }

                  if (
                    result.status ===
                    "fulfilled"
                  ) {
                    return result.value;
                  }

                  return originalRoute;
                },
              );

            const finalRoutes =
              rankRoutes(
                enrichedRoutes,
                priority,
              );

            const finalSelected =
              finalRoutes[0]?.id ??
              null;

            setState((previous) => ({
              ...previous,
              currentLocation,
              routes: finalRoutes,
              selectedRouteId:
                previous.selectedRouteId &&
                finalRoutes.some(
                  (route) =>
                    route.id ===
                    previous.selectedRouteId,
                )
                  ? previous.selectedRouteId
                  : finalSelected,
            }));
          });

          return initialRoutes;
        } catch (
          error: unknown
        ) {
          if (
            requestId !==
            requestIdRef.current
          ) {
            return null;
          }

          console.warn(
            "Route planning failed:",
            error,
          );

          setState((previous) => ({
            ...previous,
            routes: [],
            selectedRouteId: null,
            loading: false,
            error:
              getRouteErrorMessage(
                error,
              ),
          }));

          return null;
        }
      },
      [state],
    );

  /*
   * Existing text-based route search.
   *
   * Keeps RouteScreen behavior unchanged.
   */
  const findRoutes =
    useCallback(
      async (): Promise<Route[] | null> => {
        return findRoutesForInput({
          destination:
            state.destination,
        });
      },
      [
        findRoutesForInput,
        state.destination,
      ],
    );

  /*
   * Exact-coordinate route search.
   *
   * Used for:
   * Home → nearest police station → Directions
   * Home → nearest medical facility → Directions
   *
   * The optional origin parameter is the important
   * Fast Help fix:
   *
   * Home GPS → facility GPS → OSRM
   */
  const findRoutesToCoordinates =
    useCallback(
      async (
        coordinates: Coordinates,
        label: string,
        origin?: Coordinates,
      ): Promise<Route[] | null> => {
        if (
          !isValidCoordinates(
            coordinates,
          )
        ) {
          setState((previous) => ({
            ...previous,
            error:
              "Destination coordinates are unavailable.",
          }));

          return null;
        }

        if (
          origin !== undefined &&
          !isValidCoordinates(origin)
        ) {
          setState((previous) => ({
            ...previous,
            error:
              "Current location is unavailable.",
          }));

          return null;
        }

        return findRoutesForInput({
          destination:
            label.trim() ||
            "Destination",
          destinationCoordinates:
            coordinates,
          originCoordinates:
            origin,
        });
      },
      [findRoutesForInput],
    );

  const selectRoute =
    useCallback(
      (routeId: string): void => {
        setState((previous) => {
          const exists =
            previous.routes.some(
              (route) =>
                route.id === routeId,
            );

          if (!exists) {
            return previous;
          }

          return {
            ...previous,
            selectedRouteId:
              routeId,
          };
        });
      },
      [],
    );

  const clearDestination =
    useCallback(
      (): void => {
        /*
         * Invalidate every running route/safety request.
         */
        requestIdRef.current += 1;

        setState((previous) => ({
          ...previous,
          destination: "",
          routes: [],
          selectedRouteId: null,
          loading: false,
          error: null,
        }));
      },
      [],
    );

  const selectedRoute =
    state.routes.find(
      (route) =>
        route.id ===
        state.selectedRouteId,
    ) ?? null;

  const safetyAvailable =
    routesHaveSafetyData(
      state.routes,
    );

  const priorityNotice =
    state.routes.length > 0 &&
    state.priority === "safest" &&
    !safetyAvailable
      ? "Safety signals are not available for this route yet, so travel time is being used."
      : null;

  return {
    ...state,

    selectedRoute,
    safetyAvailable,
    priorityNotice,

    setDestination,
    setCurrentLocation,
    setPriority,

    findRoutes,
    findRoutesToCoordinates,

    selectRoute,
    clearDestination,
  };
}