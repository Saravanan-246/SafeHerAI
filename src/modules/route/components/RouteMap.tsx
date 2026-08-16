import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import * as Location from "expo-location";

import { useLiveLocation } from "../hooks/useLiveLocation";
import type { Route } from "../types";

interface RouteMapProps {
  routes?: Route[];
  selectedRouteId?: string | null;

  onLocationReady?: (location: Location.LocationObject) => void;

  location?: Location.LocationObject | null;
  loading?: boolean;
  permissionDenied?: boolean;
  servicesDisabled?: boolean;
  locationUnavailable?: boolean;
  locationError?: string | null;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export default function RouteMap({
  routes = [],
  selectedRouteId = null,
  onLocationReady,

  location: propLocation,
  loading: propLoading,
  permissionDenied: propPermissionDenied,
  servicesDisabled: propServicesDisabled,
  locationUnavailable: propLocationUnavailable,
  locationError: propLocationError,
}: RouteMapProps): React.JSX.Element {
  const mapRef = useRef<MapView | null>(null);
  const locationReported = useRef<boolean>(false);
  const isMapReady = useRef<boolean>(false);

  /*
   * RouteScreen does not provide a location prop,
   * so RouteMap owns the GPS watcher there.
   *
   * NavigationScreen provides its own location,
   * so RouteMap disables its internal watcher.
   */
  const localLiveLocation = useLiveLocation({
    enabled: propLocation === undefined,
  });

  const location =
    propLocation !== undefined ? propLocation : localLiveLocation.location;

  const loading =
    propLoading !== undefined ? propLoading : localLiveLocation.loading;

  const permissionDenied =
    propPermissionDenied !== undefined
      ? propPermissionDenied
      : localLiveLocation.permissionDenied;

  const servicesDisabled =
    propServicesDisabled !== undefined
      ? propServicesDisabled
      : localLiveLocation.servicesDisabled;

  const locationUnavailable =
    propLocationUnavailable !== undefined
      ? propLocationUnavailable
      : localLiveLocation.locationUnavailable;

  const locationError =
    propLocationError !== undefined
      ? propLocationError
      : localLiveLocation.locationError;

  const selectedRoute = useMemo(() => {
    if (!routes || routes.length === 0) return null;
    return (
      routes.find((route) => route.id === selectedRouteId) ?? routes[0] ?? null
    );
  }, [routes, selectedRouteId]);

  const userCoordinate = useMemo(() => {
    if (!location?.coords) {
      return null;
    }

    const latitude = location.coords.latitude;
    const longitude = location.coords.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude,
      longitude,
    };
  }, [location]);

  // Use refs to prevent recreating callbacks on every GPS update
  const userCoordinateRef = useRef(userCoordinate);
  const selectedRouteRef = useRef(selectedRoute);

  useEffect(() => {
    userCoordinateRef.current = userCoordinate;
  }, [userCoordinate]);

  useEffect(() => {
    selectedRouteRef.current = selectedRoute;
  }, [selectedRoute]);

  const destination = useMemo(() => {
    const coordinates = selectedRoute?.coordinates;

    if (!coordinates || coordinates.length === 0) {
      return null;
    }

    return coordinates[coordinates.length - 1];
  }, [selectedRoute]);

  /*
   * Map initialization:
   * Keep a stable initialRegion so MapView mounts exactly once.
   */
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  useEffect(() => {
    if (!initialRegion && userCoordinate) {
      setInitialRegion({
        latitude: userCoordinate.latitude,
        longitude: userCoordinate.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      });
    }
  }, [userCoordinate, initialRegion]);

  /*
   * Notify the parent only when the first valid GPS fix arrives.
   */
  useEffect(() => {
    if (!location || locationReported.current) {
      return;
    }

    const latitude = location.coords?.latitude;
    const longitude = location.coords?.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    locationReported.current = true;
    onLocationReady?.(location);
  }, [location, onLocationReady]);

  /*
   * Fit the active route into the map.
   * Completely decoupled from reactive dependencies to prevent stuttering.
   */
  const fitSelectedRoute = useCallback((animated: boolean = true): void => {
    const route = selectedRouteRef.current;

    if (!isMapReady.current || !mapRef.current || !route?.coordinates || route.coordinates.length === 0) {
      return;
    }

    const coordinates = [...route.coordinates];
    if (userCoordinateRef.current) {
      coordinates.unshift(userCoordinateRef.current);
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 140,
        right: 32,
        bottom: 190,
        left: 32,
      },
      animated,
    });
  }, []);

  const handleMapReady = useCallback((): void => {
    isMapReady.current = true;
    fitSelectedRoute(false);
  }, [fitSelectedRoute]);

  useEffect(() => {
    if (!selectedRoute?.id) {
      return;
    }

    fitSelectedRoute(true);
  }, [selectedRoute?.id, fitSelectedRoute]);

  const centerOnUser = useCallback((): void => {
    if (!userCoordinateRef.current || !mapRef.current) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: userCoordinateRef.current.latitude,
        longitude: userCoordinateRef.current.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      350,
    );
  }, []);

  /*
   * Memoize complex UI elements to avoid bridge recreation on location updates.
   */
  const routePolylines = useMemo(() => {
    if (!routes || routes.length === 0) return null;

    return routes.map((route) => {
      if (!route.coordinates || route.coordinates.length === 0) {
        return null;
      }

      const selected = route.id === selectedRoute?.id;

      return (
        <Polyline
          key={route.id}
          coordinates={route.coordinates}
          strokeColor={selected ? "#F97316" : "rgba(87,83,78,0.28)"}
          strokeWidth={selected ? 6 : 4}
          zIndex={selected ? 20 : 10}
          lineCap="round"
          lineJoin="round"
        />
      );
    });
  }, [routes, selectedRoute?.id]);

  const destinationMarker = useMemo(() => {
    if (!destination) return null;

    return (
      <Marker
        coordinate={destination}
        title="Destination"
        accessibilityLabel="Destination"
      >
        <View style={styles.destinationMarker}>
          <Ionicons name="location" size={17} color="#FFFFFF" />
        </View>
      </Marker>
    );
  }, [destination]);

  /*
   * Location State UI resolution
   */
  let stateProps: MapStateProps | null = null;

  if (permissionDenied) {
    stateProps = {
      message:
        "Location permission was denied. Enable location permission to use Safe Route.",
    };
  } else if (servicesDisabled) {
    stateProps = {
      message:
        "Location services are turned off. Enable device location services to continue.",
      icon: "location-outline",
    };
  } else if (loading) {
    stateProps = { loading: true };
  } else if (!userCoordinate || locationUnavailable) {
    stateProps = {
      message: locationError ?? "Current location is temporarily unavailable.",
      icon: "navigate-outline",
    };
  }

  return (
    <View style={styles.container}>
      {initialRegion ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          onMapReady={handleMapReady}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass
          showsBuildings
          showsTraffic={false}
          rotateEnabled
          pitchEnabled
          zoomEnabled
          scrollEnabled
        >
          {routePolylines}

          {userCoordinate && (
            <Marker
              coordinate={userCoordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              flat
            >
              <View style={styles.userHalo}>
                <View style={styles.userDot} />
              </View>
            </Marker>
          )}

          {destinationMarker}
        </MapView>
      ) : (
        <View style={styles.emptyMapFallback} />
      )}

      {stateProps && (
        <View
          style={[
            styles.overlayContainer,
            !initialRegion && styles.overlaySolid,
          ]}
          pointerEvents="box-none"
        >
          <MapState {...stateProps} />
        </View>
      )}

      {initialRegion && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={centerOnUser}
          accessibilityRole="button"
          accessibilityLabel="Center on current location"
          style={styles.locationButton}
        >
          <Ionicons name="locate" size={20} color="#F97316" />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface MapStateProps {
  loading?: boolean;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

function MapState({
  loading = false,
  message,
  icon = "location-outline",
}: MapStateProps): React.JSX.Element {
  return (
    <View style={styles.state}>
      <View style={styles.stateCard}>
        <View style={styles.stateIcon}>
          {loading ? (
            <ActivityIndicator size="small" color="#F97316" />
          ) : (
            <Ionicons name={icon} size={20} color="#F97316" />
          )}
        </View>

        <Text style={styles.stateTitle}>
          {loading ? "Finding your location" : "Location unavailable"}
        </Text>

        <Text style={styles.stateText}>
          {loading
            ? "Preparing your route map..."
            : message ?? "Current location is unavailable."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7E5E4",
  },
  emptyMapFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E7E5E4",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "rgba(231, 229, 228, 0.4)", // Slight transparency over real map
    zIndex: 100,
  },
  overlaySolid: {
    backgroundColor: "#E7E5E4", // Solid color if map hasn't loaded yet
  },
  userHalo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.18)",
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3B82F6",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  destinationMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3F3A35",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 4,
  },
  locationButton: {
    position: "absolute",
    right: 16,
    bottom: 180,
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEAE4",
    elevation: 5,
    zIndex: 50,
  },
  state: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  stateCard: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1ECE7",
    elevation: 4,
  },
  stateIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    marginBottom: 12,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3F3A35",
    textAlign: "center",
  },
  stateText: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    color: "#A8A29E",
    textAlign: "center",
  },
});