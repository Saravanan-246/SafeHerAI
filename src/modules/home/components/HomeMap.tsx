import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  type Details,
  type MapStyleElement,
  type Region,
} from "react-native-maps";
import * as Haptics from "expo-haptics";

import { theme } from "../../../theme/theme";

interface HomeMapProps {
  readonly latitude?: number;
  readonly longitude?: number;
  readonly heading?: number;
  readonly loading?: boolean;
  readonly permissionDenied?: boolean;
  readonly locationUnavailable?: boolean;
  readonly locationError?: string | null;
  readonly onRecenter?: () => void;
  readonly onMapLayersPress?: () => void;
}

interface MapCoordinate {
  readonly latitude: number;
  readonly longitude: number;
}

const DEFAULT_ZOOM = 16.8;
const SAFETY_RADIUS_METERS = 120;

const MAP = {
  background: "#E9EDE9",
  white: "#FFFFFF",

  text: "#292524",
  muted: "#68716B",
  border: "#DDD9D3",

  primary: "#F97316",

  safetyArea: "rgba(249, 115, 22, 0.045)",
  safetyBorder: "rgba(249, 115, 22, 0.13)",

  userHalo: "rgba(249, 115, 22, 0.12)",
} as const;

export default function HomeMap({
  latitude,
  longitude,
  heading: _heading = 0,
  loading = false,
  permissionDenied = false,
  locationUnavailable = false,
  locationError = null,
  onRecenter,
}: HomeMapProps): React.JSX.Element {
  const mapRef = useRef<MapView | null>(null);
  const mapReadyRef = useRef(false);

  const [initialLocation, setInitialLocation] =
    useState<MapCoordinate | null>(null);

  const [isFollowingUser, setIsFollowingUser] =
    useState(true);

  const currentLocation =
    useMemo<MapCoordinate | null>(() => {
      if (
        latitude === undefined ||
        longitude === undefined
      ) {
        return null;
      }

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return null;
      }

      return {
        latitude,
        longitude,
      };
    }, [latitude, longitude]);

  /* ------------------------------------------------------------------ */
  /* First valid GPS fix                                                */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!initialLocation && currentLocation) {
      setInitialLocation(currentLocation);
    }
  }, [currentLocation, initialLocation]);

  /* ------------------------------------------------------------------ */
  /* Follow current location                                            */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (
      !mapReadyRef.current ||
      !currentLocation ||
      !isFollowingUser ||
      !mapRef.current
    ) {
      return;
    }

    mapRef.current.animateCamera(
      {
        center: currentLocation,
        zoom: DEFAULT_ZOOM,
      },
      {
        duration: 300,
      },
    );
  }, [currentLocation, isFollowingUser]);

  /* ------------------------------------------------------------------ */
  /* Map ready                                                          */
  /* ------------------------------------------------------------------ */

  const handleMapReady = useCallback((): void => {
    mapReadyRef.current = true;
  }, []);

  /* ------------------------------------------------------------------ */
  /* User gesture                                                       */
  /* ------------------------------------------------------------------ */

  const handleRegionChangeComplete = useCallback(
    (
      _region: Region,
      details?: Details,
    ): void => {
      if (details?.isGesture === true) {
        setIsFollowingUser(false);
      }
    },
    [],
  );

  /* ------------------------------------------------------------------ */
  /* Recenter                                                           */
  /* ------------------------------------------------------------------ */

  const handleRecenter = useCallback((): void => {
    if (!currentLocation || !mapRef.current) {
      return;
    }

    void Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => undefined);

    setIsFollowingUser(true);

    mapRef.current.animateCamera(
      {
        center: currentLocation,
        zoom: DEFAULT_ZOOM,
        heading: 0,
        pitch: 0,
      },
      {
        duration: 380,
      },
    );

    onRecenter?.();
  }, [currentLocation, onRecenter]);

  /* ------------------------------------------------------------------ */
  /* Loading                                                             */
  /* ------------------------------------------------------------------ */

  if (loading || !initialLocation) {
    return (
      <View style={styles.state}>
        <ActivityIndicator
          size="small"
          color={MAP.primary}
        />

        <Text style={styles.stateTitle}>
          Locating you
        </Text>

        <Text style={styles.stateMessage}>
          Getting your current position
        </Text>
      </View>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Location unavailable                                                */
  /* ------------------------------------------------------------------ */

  if (
    permissionDenied ||
    locationUnavailable ||
    !currentLocation
  ) {
    return (
      <View style={styles.state}>
        <View style={styles.stateIcon}>
          <Ionicons
            name={
              permissionDenied
                ? "location-outline"
                : "navigate-outline"
            }
            size={20}
            color={MAP.primary}
          />
        </View>

        <Text style={styles.stateTitle}>
          Location unavailable
        </Text>

        <Text style={styles.stateMessage}>
          {permissionDenied
            ? "Enable location permission to use SafeHerAI."
            : locationError ??
              "Your current location is temporarily unavailable."}
        </Text>
      </View>
    );
  }

  /*
   * Explicit narrowing:
   * from here onward the coordinate cannot be null.
   */
  const mapLocation: MapCoordinate =
    currentLocation;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={SAFEHER_MAP_STYLE}
        initialRegion={{
          ...initialLocation,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings
        showsPointsOfInterest
        showsIndoors={false}
        toolbarEnabled={false}
        rotateEnabled
        pitchEnabled={false}
        zoomEnabled
        scrollEnabled
        moveOnMarkerPress={false}
        onMapReady={handleMapReady}
        onRegionChangeComplete={
          handleRegionChangeComplete
        }
      >
        {/* ========================================================== */}
        {/* SAFEHER SAFETY AREA                                        */}
        {/* ========================================================== */}

        <Circle
          center={mapLocation}
          radius={SAFETY_RADIUS_METERS}
          fillColor={MAP.safetyArea}
          strokeColor={MAP.safetyBorder}
          strokeWidth={1}
          zIndex={1}
        />

        {/* ========================================================== */}
        {/* MAIN CURRENT LOCATION                                      */}
        {/* ========================================================== */}

        <Marker
          coordinate={mapLocation}
          anchor={{
            x: 0.5,
            y: 0.5,
          }}
          zIndex={100}
          tracksViewChanges
        >
          <View style={styles.userMarker}>
            <View style={styles.userHalo} />
            <View style={styles.userDot} />
          </View>
        </Marker>
      </MapView>

      {/* ============================================================ */}
      {/* ONLY CURRENT LOCATION CONTROL                                */}
      {/* ============================================================ */}

      <Pressable
        onPress={handleRecenter}
        accessibilityRole="button"
        accessibilityLabel="Center on current location"
        accessibilityState={{
          selected: isFollowingUser,
        }}
        hitSlop={8}
        style={({ pressed }) => [
          styles.locationControl,
          isFollowingUser &&
            styles.locationControlActive,
          pressed && styles.controlPressed,
        ]}
      >
        <Ionicons
          name="locate-outline"
          size={20}
          color={
            isFollowingUser
              ? MAP.primary
              : MAP.text
          }
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: MAP.background,
  },

  /* ------------------------------------------------------------------ */
  /* Location states                                                     */
  /* ------------------------------------------------------------------ */

  state: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 28,

    backgroundColor: MAP.background,
  },

  stateIcon: {
    width: 46,
    height: 46,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 15,

    backgroundColor:
      theme.colors.primaryLight,
  },

  stateTitle: {
    marginTop: 10,

    fontSize: 13,
    fontWeight: "800",

    color: MAP.text,

    textAlign: "center",
  },

  stateMessage: {
    maxWidth: 280,

    marginTop: 4,

    fontSize: 9.5,
    lineHeight: 14,

    fontWeight: "500",

    color: MAP.muted,

    textAlign: "center",
  },

  /* ------------------------------------------------------------------ */
  /* MAIN CURRENT LOCATION                                              */
  /* ------------------------------------------------------------------ */

  userMarker: {
    width: 54,
    height: 54,

    alignItems: "center",
    justifyContent: "center",
  },

  userHalo: {
    position: "absolute",

    width: 48,
    height: 48,

    borderRadius: 24,

    backgroundColor:
      MAP.userHalo,
  },

  userDot: {
    width: 24,
    height: 24,

    borderRadius: 12,

    backgroundColor:
      MAP.primary,

    borderWidth: 3,
    borderColor:
      MAP.white,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.20,
    shadowRadius: 6,

    elevation: 7,
  },

  /* ------------------------------------------------------------------ */
  /* TOP CURRENT LOCATION BUTTON                                       */
  /* ------------------------------------------------------------------ */

  locationControl: {
    position: "absolute",

    top: 92,
    right: 16,

    width: 46,
    height: 46,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 23,

    backgroundColor:
      "rgba(255, 255, 255, 0.97)",

    borderWidth: 1,
    borderColor: MAP.border,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.09,
    shadowRadius: 9,

    elevation: 5,
  },

  locationControlActive: {
    backgroundColor: "#FFF7ED",
  },

  controlPressed: {
    opacity: 0.68,

    transform: [
      {
        scale: 0.95,
      },
    ],
  },
});

/* ------------------------------------------------------------------ */
/* SafeHerAI readable light mobility map                              */
/* ------------------------------------------------------------------ */

const SAFEHER_MAP_STYLE: MapStyleElement[] = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#E9EDE9",
      },
    ],
  },

  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },

  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#59635C",
      },
    ],
  },

  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#E9EDE9",
      },
      {
        weight: 3,
      },
    ],
  },

  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#2C3630",
      },
    ],
  },

  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#4F5952",
      },
    ],
  },

  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [
      {
        color: "#DCE7DD",
      },
    ],
  },

  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [
      {
        color: "#E5E9E4",
      },
    ],
  },

  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [
      {
        color: "#E1E8E1",
      },
    ],
  },

  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#CFE2D2",
      },
    ],
  },

  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#4D6B52",
      },
    ],
  },

  {
    featureType: "poi.business",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },

  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      {
        color: "#FFFFFF",
      },
    ],
  },

  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#CCD3CD",
      },
      {
        weight: 1,
      },
    ],
  },

  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [
      {
        color: "#F7F8F6",
      },
    ],
  },

  {
    featureType: "road.local",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#DCE1DC",
      },
      {
        weight: 0.8,
      },
    ],
  },

  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
      {
        color: "#FFFFFF",
      },
    ],
  },

  {
    featureType: "road.arterial",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#BCC7BE",
      },
      {
        weight: 1.2,
      },
    ],
  },

  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#DCE5DD",
      },
    ],
  },

  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#B4C1B6",
      },
      {
        weight: 1.4,
      },
    ],
  },

  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#465149",
      },
    ],
  },

  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#C9DDE2",
      },
    ],
  },

  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#58747B",
      },
    ],
  },

  {
    featureType: "transit",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
];