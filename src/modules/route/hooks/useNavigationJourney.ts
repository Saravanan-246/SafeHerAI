import { useMemo, useRef, useState, useCallback } from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import * as Location from "expo-location";

import { useLiveLocation } from "./useLiveLocation";
import { useJourneyAnomaly } from "./useJourneyAnomaly";
import type { AnomalyResult } from "../services/journeyAnomalyService";
import type { Route } from "../types";
import type { RootStackParamList } from "../../../navigation/AppNavigator";

type NavigationRouteProp = RouteProp<RootStackParamList, "Navigation">;

export interface NavigationJourneyState {
  selectedRoute: Route;
  destination: string;
  location: Location.LocationObject | null;
  loading: boolean;
  permissionDenied: boolean;
  startedAt: number;
  anomaly: AnomalyResult;
  showBanner: boolean;
  handleDismiss: () => void;
}

export function useNavigationJourney(): NavigationJourneyState {
  const route = useRoute<NavigationRouteProp>();
  const { selectedRoute, destination } = route.params;

  /*
   * GPS for anomaly detection and route mapping.
   * Single active location watcher on this screen.
   */
  const { location, loading, permissionDenied } = useLiveLocation();

  /*
   * Journey start time: stable for the lifetime of this screen mount.
   */
  const startedAt = useMemo(() => Date.now(), []);

  const anomaly = useJourneyAnomaly({
    route: selectedRoute,
    location,
    startedAt,
  });

  /*
   * Prevent the same anomaly label from re-showing after the user
   * dismisses it. Only a genuinely new label (different text) will
   * cause the banner to reappear.
   */
  const dismissedLabelRef = useRef<string | null>(null);
  const [bannerVisible, setBannerVisible] = useState(true);

  // Reset banner visibility when the anomaly label changes (new anomaly type).
  const prevLabelRef = useRef<string | null>(null);
  if (anomaly.label !== prevLabelRef.current) {
    prevLabelRef.current = anomaly.label;
    if (anomaly.label !== dismissedLabelRef.current) {
      setBannerVisible(true);
    }
  }

  const handleDismiss = useCallback(() => {
    dismissedLabelRef.current = anomaly.label;
    setBannerVisible(false);
  }, [anomaly.label]);

  const showBanner =
    anomaly.hasAnomaly &&
    bannerVisible &&
    anomaly.label !== dismissedLabelRef.current;

  return {
    selectedRoute,
    destination,
    location,
    loading,
    permissionDenied,
    startedAt,
    anomaly,
    showBanner,
    handleDismiss,
  };
}
