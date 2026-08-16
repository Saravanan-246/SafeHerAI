import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AlertCard from "../../../components/AlertCard";
import { theme } from "../../../theme/theme";

import type { Alert } from "../../../data/alerts";

interface SafetyNearbySectionProps {
  latestAlert: Alert | null | undefined;
  onViewAllPress: () => void;
}

export default function SafetyNearbySection({
  latestAlert,
  onViewAllPress,
}: SafetyNearbySectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Safety nearby
          </Text>

          <Text style={styles.sectionSubtitle}>
            Latest available alert
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onViewAllPress}
          accessibilityRole="button"
          accessibilityLabel="View all safety alerts"
        >
          <Text style={styles.viewAll}>
            View all
          </Text>
        </TouchableOpacity>
      </View>

      {latestAlert ? (
        <AlertCard
          type={latestAlert.type}
          title={latestAlert.title}
          message={latestAlert.message}
          time={latestAlert.time}
          location={latestAlert.location}
          onPress={onViewAllPress}
        />
      ) : (
        <View style={styles.emptyAlert}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color="#16A34A"
          />

          <Text style={styles.emptyAlertText}>
            No recent alerts available
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 9,
    color: theme.colors.textMuted,
  },

  viewAll: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  emptyAlert: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
  },

  emptyAlertText: {
    marginLeft: 9,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
});
