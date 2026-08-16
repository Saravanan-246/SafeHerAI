import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../../../theme/theme";
import type { RoutePriority } from "../types";

interface RoutePrioritySelectorProps {
  priority: RoutePriority;
  onChange: (priority: RoutePriority) => void;
}

const OPTIONS: Array<{
  value: RoutePriority;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
}> = [
  {
    value: "fast",
    label: "Fast",
    icon: "flash-outline",
    accessibilityLabel: "Fast route",
  },
  {
    value: "balanced",
    label: "Balanced",
    icon: "swap-horizontal-outline",
    accessibilityLabel: "Balanced route",
  },
  {
    value: "safest",
    label: "Safest",
    icon: "shield-checkmark-outline",
    accessibilityLabel: "Safest route",
  },
];

export default function RoutePrioritySelector({
  priority,
  onChange,
}: RoutePrioritySelectorProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="radiogroup"
      accessibilityLabel="Route preference"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === priority;

        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.82}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.accessibilityLabel}
            accessibilityState={{
              selected,
            }}
            style={[
              styles.option,
              selected && styles.optionSelected,
            ]}
          >
            <Ionicons
              name={option.icon}
              size={14}
              color={
                selected
                  ? theme.colors.primaryDark
                  : theme.colors.textSecondary
              }
            />

            <Text
              style={[
                styles.optionText,
                selected && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>

            {selected && (
              <View style={styles.selectedIndicator} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 4,
    marginBottom: theme.spacing.md,

    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  option: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    position: "relative",
  },

  optionSelected: {
    backgroundColor: theme.colors.primaryLight,
  },

  optionText: {
    ...theme.typography.caption,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },

  optionTextSelected: {
    color: theme.colors.primaryDark,
  },

  selectedIndicator: {
    position: "absolute",
    bottom: 4,
    width: 24,
    height: 2,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
});