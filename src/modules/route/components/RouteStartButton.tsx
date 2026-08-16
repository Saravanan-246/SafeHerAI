import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../../../theme/theme";

interface RouteStartButtonProps {
  duration?: string;
  distance?: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function RouteStartButton({
  duration,
  distance,
  onPress,
  disabled = false,
}: RouteStartButtonProps) {
  const meta = [duration, distance]
    .filter(Boolean)
    .join(" · ");

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Start Safe Route"
      accessibilityHint="Starts navigation using the selected route"
      accessibilityState={{
        disabled,
      }}
      style={[
        styles.container,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          Start Safe Route
        </Text>

        {meta.length > 0 && (
          <Text style={styles.meta}>
            {meta}
          </Text>
        )}
      </View>

      <View style={styles.icon}>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={theme.colors.white}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 58,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    ...theme.shadows.button,
  },

  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },

  content: {
    flex: 1,
  },

  title: {
    ...theme.typography.button,
    color: theme.colors.white,
  },

  meta: {
    marginTop: 3,
    ...theme.typography.caption,
    color: "#FFEDD5",
  },

  icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",

    alignItems: "center",
    justifyContent: "center",
  },
});