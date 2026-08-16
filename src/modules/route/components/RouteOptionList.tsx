import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Route } from "../types";
import RouteOptionCard from "./RouteOptionCard";

interface RouteOptionListProps {
  routes: Route[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
}

export default function RouteOptionList({
  routes,
  selectedRouteId,
  onSelectRoute,
}: RouteOptionListProps) {
  if (routes.length === 0) {
    return (
      <View
        style={styles.empty}
        accessible
        accessibilityLabel="No route options available"
      >
        <Text style={styles.emptyTitle}>
          No routes available
        </Text>

        <Text style={styles.emptyText}>
          Try another destination to find an available route.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={routes}
      keyExtractor={(route) => route.id}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={RouteSeparator}
      renderItem={({ item, index }) => (
        <RouteOptionCard
          route={item}
          index={index}
          selected={item.id === selectedRouteId}
          onPress={() => onSelectRoute(item.id)}
        />
      )}
      accessibilityRole="list"
    />
  );
}

function RouteSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 2,
  },

  separator: {
    height: 9,
  },

  empty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EDE8E2",
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#292524",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 5,
    fontSize: 10,
    lineHeight: 15,
    color: "#A8A29E",
    textAlign: "center",
  },
});