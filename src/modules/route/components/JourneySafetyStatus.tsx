/**
 * JourneySafetyStatus
 *
 * Compact, inline status indicator that sits inside the navigation panel.
 * Responsibility: render severity → colour/icon/label only.
 * No business logic. No GPS. No state.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { AnomalySeverity } from "../services/journeyAnomalyService";

interface JourneySafetyStatusProps {
  severity: AnomalySeverity;
}

const CONFIG = {
  none: {
    color: "#16A34A",
    bg: "#F0FDF4",
    icon: "shield-checkmark-outline" as const,
    label: "On route",
  },
  warning: {
    color: "#D97706",
    bg: "#FFFBEB",
    icon: "warning-outline" as const,
    label: "Journey anomaly",
  },
  alert: {
    color: "#DC2626",
    bg: "#FEF2F2",
    icon: "alert-circle-outline" as const,
    label: "Distress pattern",
  },
} as const;

export default function JourneySafetyStatus({
  severity,
}: JourneySafetyStatusProps) {
  const { color, bg, icon, label } = CONFIG[severity];

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
