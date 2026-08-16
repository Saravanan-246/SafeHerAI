import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../../theme/theme";
import SOSAction from "../../sos/components/SOSAction";

interface SafetyQuickActionsProps {
  onSafeRoutePress: () => void;
}

export default function SafetyQuickActions({
  onSafeRoutePress,
}: SafetyQuickActionsProps) {
  return (
    <View style={styles.actions}>
      <TouchableOpacity
        activeOpacity={0.84}
        onPress={onSafeRoutePress}
        style={styles.action}
        accessibilityRole="button"
        accessibilityLabel="Safe Route"
      >
        <View style={[styles.actionIcon, styles.orangeIcon]}>
          <Ionicons name="map-outline" size={20} color={theme.colors.primary} />
        </View>

        <Text style={styles.actionTitle}>Safe Route</Text>

        <Text style={styles.actionSubtitle}>Find safer paths</Text>
      </TouchableOpacity>

      <SOSAction variant="card" />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  action: {
    flex: 1,
    minHeight: 112,
    backgroundColor: theme.colors.white,
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  orangeIcon: {
    backgroundColor: theme.colors.primaryLight,
  },

  actionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.text,
  },

  actionSubtitle: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 14,
    color: theme.colors.textMuted,
  },
});
