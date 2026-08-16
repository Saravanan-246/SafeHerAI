import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../../theme/theme";

interface SafetyInsightProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export default function SafetyInsight({
  icon,
  label,
  value,
}: SafetyInsightProps) {
  return (
    <View style={styles.insight}>
      <View style={styles.insightIcon}>
        <Ionicons
          name={icon}
          size={15}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.insightText}>
        <Text style={styles.insightValue}>
          {value}
        </Text>

        <Text style={styles.insightLabel}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  insight: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  insightIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  insightText: {
    marginLeft: 6,
  },

  insightValue: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.textSecondary,
  },

  insightLabel: {
    marginTop: 2,
    fontSize: 8,
    color: theme.colors.textMuted,
  },
});
