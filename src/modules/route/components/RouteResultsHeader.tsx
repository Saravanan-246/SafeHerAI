import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../../../theme/theme";

interface RouteResultsHeaderProps {
  destination: string;
  routeCount: number;
}

export default function RouteResultsHeader({
  destination,
  routeCount,
}: RouteResultsHeaderProps) {
  const routeLabel =
    routeCount === 1 ? "route" : "routes";

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.icon}>
          <Ionicons
            name="navigate-outline"
            size={17}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.textContent}>
          <Text style={styles.label}>
            ROUTES TO
          </Text>

          <Text
            style={styles.destination}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {destination || "Choose a destination"}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {routeCount} {routeLabel} available
        </Text>

        {routeCount > 0 && (
          <View style={styles.dot} />
        )}

        {routeCount > 0 && (
          <Text style={styles.metaAccent}>
            Compare before starting
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  textContent: {
    flex: 1,
    marginLeft: 10,
  },

  label: {
    ...theme.typography.label,
    color: theme.colors.primary,
  },

  destination: {
    marginTop: 2,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "800",
    color: theme.colors.text,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    paddingLeft: 48,
  },

  meta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 7,
    backgroundColor: theme.colors.textMuted,
  },

  metaAccent: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});