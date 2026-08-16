import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  RouteMap,
  JourneyAnomalyBanner,
  NavigationHeader,
  NavigationPanel,
  NavigationSafetyActions,
  useNavigationJourney,
} from "../modules/route";
import type { RootStackParamList } from "../navigation/AppNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NavigationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [panelExpanded, setPanelExpanded] = useState(true);

  const {
    selectedRoute,
    destination,
    location,
    loading,
    permissionDenied,
    anomaly,
    showBanner,
    handleDismiss,
  } = useNavigationJourney();

  return (
    <View style={styles.container}>
      {/* REAL NAVIGATION MAP */}
      <View style={styles.mapLayer}>
        <RouteMap
          routes={[selectedRoute]}
          selectedRouteId={selectedRoute.id}
          location={location}
          loading={loading}
          permissionDenied={permissionDenied}
        />
      </View>

      {/* TOP OVERLAY */}
      <NavigationHeader
        destination={destination}
        onBack={() => navigation.goBack()}
      />

      {/* ANOMALY BANNER — above bottom panel, non-blocking */}
      {showBanner && (
        <View style={styles.bannerLayer}>
          <JourneyAnomalyBanner
            anomaly={anomaly}
            onDismiss={handleDismiss}
          />
        </View>
      )}

      {/* BOTTOM NAVIGATION PANEL */}
      <NavigationPanel
        duration={selectedRoute.duration}
        distance={selectedRoute.distance}
        severity={anomaly.severity}
        expanded={panelExpanded}
        onExpand={() => setPanelExpanded(true)}
        onCollapse={() => setPanelExpanded(false)}
      />

      {/* FLOATING SOS EMERGENCY BUTTON */}
      <NavigationSafetyActions panelExpanded={panelExpanded} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7E5E4",
  },

  mapLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  bannerLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 90,
    zIndex: 20,
  },
});