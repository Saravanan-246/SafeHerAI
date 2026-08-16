import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../theme/theme";

interface LocationPermissionCardProps {
  readonly permissionDenied: boolean;
  readonly servicesDisabled: boolean;
  readonly locationUnavailable: boolean;
  readonly onEnableLocation: () => void;
  readonly onRetry: () => void;
}

type LocationState =
  | "permission"
  | "services"
  | "unavailable";

interface StatePresentation {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly title: string;
  readonly message: string;
  readonly primaryLabel: string;
  readonly primaryIcon: keyof typeof Ionicons.glyphMap;
}

const PRESENTATION: Record<
  LocationState,
  StatePresentation
> = {
  permission: {
    icon: "location-outline",
    title: "Location access needed",
    message:
      "Allow location access so SafeHerAI can find you and provide safer routes.",
    primaryLabel: "Allow location",
    primaryIcon: "location",
  },

  services: {
    icon: "navigate-outline",
    title: "Location services are off",
    message:
      "Turn on your device location service to continue.",
    primaryLabel: "Enable location",
    primaryIcon: "navigate",
  },

  unavailable: {
    icon: "refresh-outline",
    title: "Location unavailable",
    message:
      "We couldn't get a fresh GPS position. Try again.",
    primaryLabel: "Try again",
    primaryIcon: "refresh",
  },
};

export default function LocationPermissionCard({
  permissionDenied,
  servicesDisabled,
  locationUnavailable,
  onEnableLocation,
  onRetry,
}: LocationPermissionCardProps): React.JSX.Element | null {
  if (
    !permissionDenied &&
    !servicesDisabled &&
    !locationUnavailable
  ) {
    return null;
  }

  const state: LocationState = permissionDenied
    ? "permission"
    : servicesDisabled
      ? "services"
      : "unavailable";

  const config = PRESENTATION[state];

  const handlePrimaryPress = (): void => {
    if (
      permissionDenied ||
      servicesDisabled
    ) {
      onEnableLocation();
      return;
    }

    onRetry();
  };

  const showSecondary =
    permissionDenied || servicesDisabled;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          state === "unavailable" &&
            styles.iconContainerNeutral,
        ]}
      >
        <Ionicons
          name={config.icon}
          size={19}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.headingRow}>
          <Text
            numberOfLines={1}
            style={styles.title}
          >
            {config.title}
          </Text>

          <View style={styles.statusDot} />
        </View>

        <Text
          numberOfLines={3}
          style={styles.message}
        >
          {config.message}
        </Text>

        <View style={styles.actions}>
          <Pressable
            onPress={handlePrimaryPress}
            accessibilityRole="button"
            accessibilityLabel={
              config.primaryLabel
            }
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={config.primaryIcon}
              size={15}
              color={theme.colors.white}
            />

            <Text style={styles.primaryText}>
              {config.primaryLabel}
            </Text>
          </Pressable>

          {showSecondary ? (
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="Check location again"
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryPressed,
              ]}
            >
              <Text style={styles.secondaryText}>
                Check again
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",

    marginHorizontal: 16,
    marginTop: 14,

    padding: 13,

    borderRadius: 16,

    backgroundColor: theme.colors.white,

    borderWidth: 1,
    borderColor: theme.colors.border,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,

    elevation: 2,
  },

  iconContainer: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 12,

    backgroundColor:
      theme.colors.primaryLight,

    flexShrink: 0,
  },

  iconContainerNeutral: {
    backgroundColor: "#F5F5F4",
  },

  content: {
    flex: 1,
    minWidth: 0,

    marginLeft: 10,
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",

    minWidth: 0,
  },

  title: {
    flex: 1,

    fontSize: 12.5,
    lineHeight: 17,

    fontWeight: "800",

    color: theme.colors.text,
  },

  statusDot: {
    width: 6,
    height: 6,

    marginLeft: 8,

    borderRadius: 3,

    backgroundColor:
      theme.colors.primary,
  },

  message: {
    marginTop: 3,

    fontSize: 9.5,
    lineHeight: 14,

    fontWeight: "500",

    color: theme.colors.textSecondary,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 9,

    gap: 8,
  },

  primaryButton: {
    minHeight: 34,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 12,

    borderRadius: 10,

    backgroundColor:
      theme.colors.primary,
  },

  primaryText: {
    marginLeft: 5,

    fontSize: 9,
    fontWeight: "800",

    color: theme.colors.white,
  },

  secondaryButton: {
    minHeight: 34,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 11,

    borderRadius: 10,

    backgroundColor: "#F7F5F2",

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  secondaryText: {
    fontSize: 9,
    fontWeight: "700",

    color: theme.colors.textSecondary,
  },

  pressed: {
    opacity: 0.76,

    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  secondaryPressed: {
    opacity: 0.68,
  },
});