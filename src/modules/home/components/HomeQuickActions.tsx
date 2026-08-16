import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../../../theme/theme";

interface HomeQuickActionsProps {
  readonly onEmergencyPress: () => void;
}

export default function HomeQuickActions({
  onEmergencyPress,
}: HomeQuickActionsProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onEmergencyPress}
        accessibilityRole="button"
        accessibilityLabel="Open emergency assistance"
        hitSlop={6}
        style={({ pressed }) => [
          styles.sosButton,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="alert-outline"
            size={18}
            color={theme.colors.danger}
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>
            Emergency
          </Text>

          <Text style={styles.description}>
            Get help quickly
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={17}
          color={theme.colors.danger}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 10,
  },

  sosButton: {
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,

    borderRadius: 15,

    backgroundColor:
      theme.colors.dangerLight,

    borderWidth: 1,
    borderColor:
      "rgba(220, 38, 38, 0.10)",
  },

  iconContainer: {
    width: 34,
    height: 34,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 11,

    backgroundColor:
      "rgba(255, 255, 255, 0.62)",
  },

  content: {
    flex: 1,
    minWidth: 0,

    marginLeft: 9,
  },

  label: {
    fontSize: 10,
    lineHeight: 14,

    fontWeight: "800",

    color: theme.colors.danger,
  },

  description: {
    marginTop: 1,

    fontSize: 8.5,
    lineHeight: 12,

    fontWeight: "500",

    color: theme.colors.textSecondary,
  },

  pressed: {
    opacity: 0.72,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});