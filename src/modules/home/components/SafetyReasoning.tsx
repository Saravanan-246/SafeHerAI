import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../../../theme/theme";
import type { SafetySignal } from "../types/homeTypes";

interface SafetyReasoningProps {
  signals?: readonly SafetySignal[];
  compact?: boolean;
}

interface SignalPresentation {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly color: string;
}

const SIGNAL_PRESENTATION: Record<
  SafetySignal["status"],
  SignalPresentation
> = {
  positive: {
    icon: "checkmark-circle",
    color: theme.colors.primary,
  },

  warning: {
    icon: "alert-circle",
    color: theme.colors.warning,
  },

  neutral: {
    icon: "remove-circle-outline",
    color: theme.colors.textMuted,
  },
};

export default function SafetyReasoning({
  signals = [],
  compact = true,
}: SafetyReasoningProps): React.JSX.Element | null {
  const visibleSignals = compact
    ? signals.slice(0, 2)
    : signals.slice(0, 3);

  if (visibleSignals.length === 0) {
    return null;
  }

  return (
    <View
      accessible
      accessibilityLabel="Current safety signals"
      style={styles.container}
    >
      <View style={styles.titleRow}>
        <Ionicons
          name="sparkles-outline"
          size={11}
          color={theme.colors.textMuted}
        />

        <Text style={styles.title}>
          Why this status
        </Text>
      </View>

      <View style={styles.signalRow}>
        {visibleSignals.map((signal, index) => {
          const presentation =
            SIGNAL_PRESENTATION[signal.status];

          return (
            <React.Fragment key={signal.id}>
              {index > 0 && (
                <View style={styles.separator} />
              )}

              <View style={styles.signal}>
                <Ionicons
                  name={presentation.icon}
                  size={13}
                  color={presentation.color}
                />

                <Text
                  numberOfLines={1}
                  style={[
                    styles.signalText,
                    signal.status === "warning" &&
                      styles.warningText,
                  ]}
                >
                  {signal.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginTop: 6,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  title: {
    marginLeft: 4,

    fontSize: 7.5,
    lineHeight: 10,

    fontWeight: "700",

    color: theme.colors.textMuted,
  },

  signalRow: {
    flexDirection: "row",
    alignItems: "center",

    minHeight: 20,
  },

  signal: {
    flexDirection: "row",
    alignItems: "center",

    flexShrink: 1,
    minWidth: 0,
  },

  signalText: {
    marginLeft: 4,

    flexShrink: 1,

    fontSize: 8,
    lineHeight: 11,

    fontWeight: "600",

    color: theme.colors.textSecondary,
  },

  warningText: {
    color: theme.colors.warning,
  },

  separator: {
    width: 1,
    height: 13,

    marginHorizontal: 9,

    backgroundColor: theme.colors.border,
  },
});