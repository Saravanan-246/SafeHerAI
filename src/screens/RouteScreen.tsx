import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Platform,
  StyleSheet,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  useNavigation,
} from "@react-navigation/native";

import type {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import * as Location from "expo-location";

import {
  RouteMap,
  RouteSearch,
} from "../modules/route";

import {
  geocodeDestination,
} from "../modules/route/services/geocodingService";

import {
  getRoutes,
} from "../modules/route/services/routeService";

import {
  getRoutePathSafety,
} from "../modules/route/services/routeSafetyService";

import {
  rankRoutes,
} from "../modules/route/services/routeRankingService";

import type {
  Coordinates,
  Route,
  RoutePriority,
} from "../modules/route/types";

import type {
  RootStackParamList,
} from "../navigation/AppNavigator";

import { theme } from "../theme/theme";

import LocationPermissionCard from "../components/LocationPermissionCard";

import RouteFindingLoader from "../components/RouteFindingLoader";

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type LocationStatus =
  | "checking"
  | "ready"
  | "permissionDenied"
  | "servicesDisabled"
  | "unavailable";

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

function getRouteErrorMessage(
  error: unknown,
): string {
  if (!(error instanceof Error)) {
    return "Unable to calculate a route right now.";
  }

  const message =
    error.message.toLowerCase();

  if (
    message.includes("destination")
  ) {
    return "Destination not found.";
  }

  if (
    message.includes("no route") ||
    message.includes("route found")
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
    error.message ||
    "Unable to calculate a route right now."
  );
}

export default function RouteScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NavigationProp>();

  /*
   * ---------------------------------------------------------
   * Route state
   * ---------------------------------------------------------
   */

  const [
    currentLocation,
    setCurrentLocation,
  ] = useState<Coordinates | null>(null);

  const [
    destination,
    setDestination,
  ] = useState<string>("");

  const [
    routes,
    setRoutes,
  ] = useState<Route[]>([]);

  const [
    selectedRouteId,
    setSelectedRouteId,
  ] = useState<string | null>(null);

  const [
    priority,
    setPriority,
  ] = useState<RoutePriority>("balanced");

  const [
    loading,
    setLoading,
  ] = useState<boolean>(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * Location state
   * ---------------------------------------------------------
   */

  const [
    locationStatus,
    setLocationStatus,
  ] = useState<LocationStatus>(
    "checking",
  );

  /*
   * ---------------------------------------------------------
   * Receive location from RouteMap
   * ---------------------------------------------------------
   */

  const handleLocationReady =
    useCallback(
      (
        location: Location.LocationObject,
      ): void => {
        const coordinates =
          toCoordinates(location);

        if (!coordinates) {
          setLocationStatus(
            "unavailable",
          );
          return;
        }

        setCurrentLocation(
          coordinates,
        );

        setLocationStatus(
          "ready",
        );
      },
      [],
    );

  /*
   * ---------------------------------------------------------
   * Enable / request location
   * ---------------------------------------------------------
   */

  const handleEnableLocation =
    useCallback(
      async (): Promise<void> => {
        try {
          setLocationStatus(
            "checking",
          );

          /*
           * Check GPS services.
           */

          let servicesEnabled =
            await Location.hasServicesEnabledAsync();

          /*
           * Android network provider.
           */

          if (
            !servicesEnabled &&
            Platform.OS === "android"
          ) {
            try {
              await Location.enableNetworkProviderAsync();
            } catch {
              // User dismissed the dialog.
            }

            try {
              servicesEnabled =
                await Location.hasServicesEnabledAsync();
            } catch {
              servicesEnabled = false;
            }
          }

          if (!servicesEnabled) {
            setLocationStatus(
              "servicesDisabled",
            );

            Alert.alert(
              "Location Services Required",
              "Turn on Location/GPS on your device and try again.",
            );

            return;
          }

          /*
           * Check/request foreground permission.
           */

          let permission =
            await Location.getForegroundPermissionsAsync();

          if (
            permission.status !==
            Location.PermissionStatus.GRANTED
          ) {
            permission =
              await Location.requestForegroundPermissionsAsync();
          }

          if (
            permission.status !==
            Location.PermissionStatus.GRANTED
          ) {
            setLocationStatus(
              "permissionDenied",
            );

            Alert.alert(
              "Location Permission Required",
              "Allow location access for SafeHer AI.",
            );

            return;
          }

          /*
           * Fast path:
           * use last known location first.
           */

          try {
            const lastKnown =
              await Location.getLastKnownPositionAsync(
                {
                  maxAge: 120_000,
                  requiredAccuracy: 500,
                },
              );

            if (lastKnown) {
              handleLocationReady(
                lastKnown,
              );
            }
          } catch {
            // Continue to fresh GPS.
          }

          /*
           * Fresh location.
           */

          const location =
            await Location.getCurrentPositionAsync(
              {
                accuracy:
                  Location.Accuracy.Balanced,
                mayShowUserSettingsDialog: true,
              },
            );

          handleLocationReady(
            location,
          );
        } catch (
          locationError: unknown
        ) {
          setLocationStatus(
            "unavailable",
          );

          Alert.alert(
            "Location Unavailable",
            locationError instanceof Error
              ? locationError.message
              : "Unable to get your current location.",
          );
        }
      },
      [handleLocationReady],
    );

  /*
   * ---------------------------------------------------------
   * Retry location
   * ---------------------------------------------------------
   */

  const handleRetryLocation =
    useCallback(
      async (): Promise<void> => {
        await handleEnableLocation();
      },
      [handleEnableLocation],
    );

  /*
   * ---------------------------------------------------------
   * Automatically request location
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (
      currentLocation === null &&
      locationStatus === "checking"
    ) {
      void handleEnableLocation();
    }
  }, [
    currentLocation,
    locationStatus,
    handleEnableLocation,
  ]);

  /*
   * ---------------------------------------------------------
   * Find routes
   * ---------------------------------------------------------
   */

  const handleFindRoutes =
    useCallback(
      async (): Promise<void> => {
        if (!currentLocation) {
          Alert.alert(
            "Location unavailable",
            "Allow location access before finding a route.",
          );

          return;
        }

        const trimmedDestination =
          destination.trim();

        if (!trimmedDestination) {
          Alert.alert(
            "Choose a destination",
            "Enter where you want to go.",
          );

          return;
        }

        /*
         * Start professional loading UI.
         */

        setLoading(true);
        setError(null);

        try {
          /*
           * 1. Convert destination into coordinates.
           */

          const destinationCoordinates =
            await geocodeDestination(
              trimmedDestination,
            );

          /*
           * 2. Get real routes.
           */

          const routeResults =
            await getRoutes(
              currentLocation,
              destinationCoordinates,
            );

          if (
            routeResults.length === 0
          ) {
            throw new Error(
              "No route found.",
            );
          }

          /*
           * 3. Safety analysis.
           *
           * All route safety requests run
           * in parallel.
           */

          const routesWithSafety =
            await Promise.all(
              routeResults.map(
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
                    /*
                     * Safety failure must NOT
                     * break route finding.
                     */

                    console.warn(
                      `Safety data unavailable for ${route.id}:`,
                      safetyError,
                    );

                    return {
                      ...route,
                      safety: undefined,
                    };
                  }
                },
              ),
            );

          /*
           * 4. Rank routes.
           */

          const rankedRoutes =
            rankRoutes(
              routesWithSafety,
              priority,
            );

          if (
            rankedRoutes.length === 0
          ) {
            throw new Error(
              "No route found.",
            );
          }

          /*
           * 5. Select best ranked route.
           */

          const firstRoute =
            rankedRoutes[0];

          if (!firstRoute) {
            throw new Error(
              "No valid route returned.",
            );
          }

          /*
           * 6. Save route state.
           */

          setRoutes(
            rankedRoutes,
          );

          setSelectedRouteId(
            firstRoute.id,
          );

          /*
           * 7. Stop loader.
           */

          setLoading(false);

          /*
           * 8. Navigate to results.
           */

          navigation.navigate(
            "RouteResults",
            {
              destination:
                trimmedDestination,

              currentLocation,

              routes:
                rankedRoutes,

              selectedRouteId:
                firstRoute.id,

              priority,
            },
          );
        } catch (
          routeError: unknown
        ) {
          console.warn(
            "Route planning failed:",
            routeError,
          );

          const message =
            getRouteErrorMessage(
              routeError,
            );

          setRoutes([]);

          setSelectedRouteId(
            null,
          );

          setLoading(false);

          setError(message);

          Alert.alert(
            "Route Error",
            message,
          );
        }
      },
      [
        currentLocation,
        destination,
        navigation,
        priority,
      ],
    );

  /*
   * ---------------------------------------------------------
   * Clear destination
   * ---------------------------------------------------------
   */

  const handleClearDestination =
    useCallback(
      (): void => {
        setDestination("");

        setRoutes([]);

        setSelectedRouteId(
          null,
        );

        setError(null);
      },
      [],
    );

  /*
   * ---------------------------------------------------------
   * Location UI
   * ---------------------------------------------------------
   */

  const hasLocation =
    currentLocation !== null;

  const showLocationCard =
    !hasLocation &&
    locationStatus !== "ready";

  /*
   * ---------------------------------------------------------
   * Render
   * ---------------------------------------------------------
   */

  return (
    <View
      style={styles.container}
    >
      <RouteMap
        routes={routes}
        selectedRouteId={
          selectedRouteId
        }
        onLocationReady={
          handleLocationReady
        }
      />

      <SafeAreaView
        pointerEvents="box-none"
        style={styles.searchLayer}
      >
        <RouteSearch
          value={destination}
          onChangeText={
            setDestination
          }
          onSearch={
            handleFindRoutes
          }
          onClear={
            handleClearDestination
          }
          fromReady={
            hasLocation
          }
          loading={loading}
          error={error}
        />
      </SafeAreaView>

      {showLocationCard && (
        <View
          pointerEvents="box-none"
          style={
            styles.locationCardLayer
          }
        >
          <LocationPermissionCard
            permissionDenied={
              locationStatus ===
              "permissionDenied"
            }
            servicesDisabled={
              locationStatus ===
              "servicesDisabled"
            }
            locationUnavailable={
              locationStatus ===
                "checking" ||
              locationStatus ===
                "unavailable"
            }
            onEnableLocation={
              handleEnableLocation
            }
            onRetry={
              handleRetryLocation
            }
          />
        </View>
      )}

      {loading && (
        <RouteFindingLoader
          visible={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
  },

  searchLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal:
      theme.spacing.lg,
  },

  locationCardLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    zIndex: 20,
  },
});