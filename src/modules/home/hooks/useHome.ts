import {
  useCallback,
  useMemo,
} from "react";
import {
  useNavigation,
} from "@react-navigation/native";
import type {
  BottomTabNavigationProp,
} from "@react-navigation/bottom-tabs";
import type {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import { useCurrentSafety } from "../../safety/hooks/useCurrentSafety";

import type {
  MainTabParamList,
  RootStackParamList,
} from "../../../navigation/AppNavigator";

type HomeTabNavigationProp =
  BottomTabNavigationProp<
    MainTabParamList,
    "Home"
  >;

type HomeRootNavigationProp =
  NativeStackNavigationProp<
    RootStackParamList
  >;

export function useHome() {
  const tabNavigation =
    useNavigation<HomeTabNavigationProp>();

  const rootNavigation =
    useNavigation<HomeRootNavigationProp>();

  const {
    location,
    locationLoading,
    permissionDenied,
    safetyResult,
    safetyLoading,
  } = useCurrentSafety();

  /**
   * Convert the live GPS location into the
   * coordinate shape used by SafetyBubble
   * and route services.
   *
   * Never create fallback/fake coordinates.
   */
  const currentLocation = useMemo(() => {
    if (!location) {
      return undefined;
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
      return undefined;
    }

    return {
      latitude,
      longitude,
    };
  }, [location]);

  /**
   * Open normal Route tab.
   */
  const openRoute = useCallback((): void => {
    tabNavigation.navigate("Route");
  }, [tabNavigation]);

  /**
   * Open Alerts tab.
   */
  const openAlerts = useCallback((): void => {
    tabNavigation.navigate("Alerts");
  }, [tabNavigation]);

  /**
   * Open the root SafetyBubble screen and pass
   * the user's real current GPS coordinates.
   */
  const openSafetyBubble = useCallback((): void => {
    rootNavigation.navigate("SafetyBubble", {
      currentLocation,
    });
  }, [
    rootNavigation,
    currentLocation,
  ]);

  /**
   * Open Profile tab.
   */
  const openProfile = useCallback((): void => {
    tabNavigation.navigate("Profile");
  }, [tabNavigation]);

  /**
   * Home safety-card entry point.
   *
   * Keep this separate from openRoute so the
   * nearby emergency flow can be added without
   * changing the existing Route tab behavior.
   */
  const openNearbySafety =
    useCallback((): void => {
      rootNavigation.navigate(
        "SafetyBubble",
        {
          currentLocation,
        },
      );
    }, [
      rootNavigation,
      currentLocation,
    ]);

  return {
    location,
    currentLocation,

    locationLoading,
    permissionDenied,

    safetyResult,
    safetyLoading,

    actions: {
      openRoute,
      openAlerts,
      openSafetyBubble,
      openProfile,
      openNearbySafety,
    },
  };
}