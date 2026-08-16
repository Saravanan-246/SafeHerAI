import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Route } from "../types";

interface RouteOptionCardProps {
  route: Route;
  index: number;
  selected: boolean;
  onPress: () => void;
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) {
    return "--";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return "--";
  }

  const minutes = Math.max(1, Math.round(seconds / 60));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining > 0
    ? `${hours} hr ${remaining} min`
    : `${hours} hr`;
}

function getRouteLabel(
  route: Route,
  index: number
): string {
  if (route.recommended) {
    return "Recommended";
  }

  return `Route ${index + 1}`;
}

function getSafetyLabel(
  score?: number
): string | null {
  if (
    typeof score !== "number" ||
    !Number.isFinite(score)
  ) {
    return null;
  }

  return `Safety ${Math.round(score)}`;
}

export default function RouteOptionCard({
  route,
  index,
  selected,
  onPress,
}: RouteOptionCardProps) {
  const safetyLabel = getSafetyLabel(
    route.safetyScore
  );

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${getRouteLabel(route, index)}, ${formatDuration(route.duration)}, ${formatDistance(route.distance)}`}
      accessibilityState={{ selected }}
      style={[
        styles.container,
        selected && styles.selected,
      ]}
    >
      <View
        style={[
          styles.index,
          selected && styles.indexSelected,
        ]}
      >
        {selected ? (
          <Ionicons
            name="checkmark"
            size={14}
            color="#FFFFFF"
          />
        ) : (
          <Text style={styles.indexText}>
            {index + 1}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>
            {getRouteLabel(route, index)}
          </Text>

          {route.recommended && (
            <View style={styles.recommendedBadge}>
              <Ionicons
                name="sparkles-outline"
                size={11}
                color="#EA580C"
              />

              <Text style={styles.recommendedText}>
                Recommended
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.duration}>
            {formatDuration(route.duration)}
          </Text>

          <View style={styles.separator} />

          <Text style={styles.distance}>
            {formatDistance(route.distance)}
          </Text>
        </View>

        {safetyLabel && (
          <View style={styles.safetyRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color="#16A34A"
            />

            <Text style={styles.safetyText}>
              {safetyLabel}
            </Text>
          </View>
        )}
      </View>

      <Ionicons
        name="chevron-forward"
        size={17}
        color={
          selected
            ? "#F97316"
            : "#C4BDB5"
        }
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 82,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE8E2",
    flexDirection: "row",
    alignItems: "center",
  },

  selected: {
    borderColor: "#F97316",
    backgroundColor: "#FFFDFC",
  },

  index: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "#F7F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  indexSelected: {
    backgroundColor: "#F97316",
  },

  indexText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#78716C",
  },

  content: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#292524",
  },

  recommendedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: "#FFF7ED",
  },

  recommendedText: {
    marginLeft: 3,
    fontSize: 7,
    fontWeight: "800",
    color: "#EA580C",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  duration: {
    fontSize: 16,
    fontWeight: "800",
    color: "#292524",
  },

  separator: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 7,
    backgroundColor: "#C4BDB5",
  },

  distance: {
    fontSize: 10,
    fontWeight: "600",
    color: "#78716C",
  },

  safetyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  safetyText: {
    marginLeft: 4,
    fontSize: 9,
    fontWeight: "700",
    color: "#16A34A",
  },
});