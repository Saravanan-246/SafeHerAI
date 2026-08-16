/**
 * JourneyAnomalyBanner
 *
 * Non-blocking overlay banner for warning and alert anomaly states.
 * Responsibility: present anomaly label + reasons + dismiss action.
 * No business logic. No GPS. No navigation calls. No SOS escalation.
 *
 * States:
 *   none    → renders nothing
 *   warning → compact single-line with first reason, amber styling
 *   alert   → expanded with all reasons, red styling
 */
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { AnomalyResult } from "../services/journeyAnomalyService";

interface JourneyAnomalyBannerProps {
  anomaly: AnomalyResult;
  /**
   * Called when the user explicitly dismisses the banner.
   * The parent is responsible for tracking which anomaly has been seen
   * to prevent the same banner re-appearing on every render.
   */
  onDismiss: () => void;
}

export default function JourneyAnomalyBanner({
  anomaly,
  onDismiss,
}: JourneyAnomalyBannerProps) {
  if (!anomaly.hasAnomaly) return null;

  const isAlert = anomaly.severity === "alert";

  const borderColor = isAlert ? "#FECACA" : "#FDE68A";
  const bgColor = isAlert ? "#FEF2F2" : "#FFFBEB";
  const iconColor = isAlert ? "#DC2626" : "#D97706";
  const textColor = isAlert ? "#B91C1C" : "#92400E";
  const iconName = isAlert
    ? ("alert-circle" as const)
    : ("warning" as const);

  return (
    <View
      style={[styles.banner, { backgroundColor: bgColor, borderColor }]}
      accessibilityRole="alert"
      accessibilityLabel={anomaly.label ?? "Journey anomaly"}
    >
      {/* Icon + Label row */}
      <View style={styles.headerRow}>
        <Ionicons name={iconName} size={16} color={iconColor} />

        <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
          {anomaly.label}
        </Text>

        <TouchableOpacity
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss anomaly banner"
          style={styles.dismissButton}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="close" size={14} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Reasons */}
      {isAlert
        ? // Alert: show all reasons
          anomaly.reasons.map((reason, i) => (
            <Text
              key={i}
              style={[styles.reason, { color: textColor }]}
              numberOfLines={3}
            >
              {reason}
            </Text>
          ))
        : // Warning: show only the first reason to keep it compact
          anomaly.reasons[0] != null && (
            <Text
              style={[styles.reason, { color: textColor }]}
              numberOfLines={2}
            >
              {anomaly.reasons[0]}
            </Text>
          )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  dismissButton: {
    padding: 2,
  },

  reason: {
    marginTop: 5,
    fontSize: 10,
    lineHeight: 15,
    opacity: 0.85,
  },
});
