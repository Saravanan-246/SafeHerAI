import React from "react";
import { StyleSheet, Text, View } from "react-native";

import RouteOptionList from "./RouteOptionList";
import { theme } from "../../../theme/theme";

import type { Route } from "../types";

interface RouteRankingProps {
  routes: Route[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
}

export default function RouteRanking({
  routes,
  selectedRouteId,
  onSelectRoute,
}: RouteRankingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Route comparison
          </Text>

          <Text style={styles.subtitle}>
            Choose the route that fits your needs
          </Text>
        </View>

        <View style={styles.count}>
          <Text style={styles.countText}>
            {routes.length}
          </Text>
        </View>
      </View>

      <RouteOptionList
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={onSelectRoute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },

  title: {
    ...theme.typography.bodyMedium,
    fontWeight: "800",
    color: theme.colors.text,
  },

  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  count: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.primaryDark,
  },
});