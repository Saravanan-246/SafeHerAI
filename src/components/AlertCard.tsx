import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../theme/theme";

type AlertType =
  | "warning"
  | "success"
  | "danger";

interface AlertCardProps {
  type?: AlertType;
  title: string;
  message: string;
  time?: string;
  location?: string;
  onPress?: () => void;
}

interface AlertPresentation {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly color: string;
  readonly background: string;
  readonly label: string;
}

const PRESENTATION: Record<
  AlertType,
  AlertPresentation
> = {
  warning: {
    icon: "warning-outline",
    color: "#F97316",
    background: "#FFF7ED",
    label: "Safety alert",
  },

  success: {
    icon: "shield-checkmark-outline",
    color: "#16A34A",
    background: "#F0FDF4",
    label: "Safe update",
  },

  danger: {
    icon: "alert-circle-outline",
    color: "#DC2626",
    background: "#FEF2F2",
    label: "Important",
  },
};

export default function AlertCard({
  type = "warning",
  title,
  message,
  time,
  location,
  onPress,
}: AlertCardProps): React.JSX.Element {
  const config = PRESENTATION[type];

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={
        onPress ? "button" : undefined
      }
      accessibilityLabel={`${config.label}: ${title}`}
      style={({ pressed }) => [
        styles.container,
        onPress && pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: config.background,
          },
        ]}
      >
        <Ionicons
          name={config.icon}
          size={18}
          color={config.color}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              { color: config.color },
            ]}
          >
            {config.label}
          </Text>

          {time ? (
            <Text
              numberOfLines={1}
              style={styles.time}
            >
              {time}
            </Text>
          ) : null}
        </View>

        <Text
          numberOfLines={2}
          style={styles.title}
        >
          {title}
        </Text>

        <Text
          numberOfLines={2}
          style={styles.message}
        >
          {message}
        </Text>

        {location ? (
          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={12}
              color={theme.colors.textMuted}
            />

            <Text
              numberOfLines={1}
              style={styles.location}
            >
              {location}
            </Text>
          </View>
        ) : null}
      </View>

      {onPress ? (
        <View style={styles.chevron}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.textMuted}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",

    minHeight: 84,

    paddingHorizontal: 13,
    paddingVertical: 13,

    marginBottom: 10,

    backgroundColor: theme.colors.white,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: 16,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 7,

    elevation: 2,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  iconContainer: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 12,

    flexShrink: 0,
  },

  body: {
    flex: 1,
    minWidth: 0,

    marginLeft: 10,
    marginRight: 8,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",

    minWidth: 0,

    marginBottom: 3,
  },

  label: {
    flex: 1,

    fontSize: 8,
    lineHeight: 11,

    fontWeight: "800",
    letterSpacing: 0.6,

    textTransform: "uppercase",
  },

  time: {
    marginLeft: 8,

    fontSize: 8,
    lineHeight: 11,

    fontWeight: "500",

    color: theme.colors.textMuted,
  },

  title: {
    fontSize: 12.5,
    lineHeight: 17,

    fontWeight: "800",

    color: theme.colors.text,
  },

  message: {
    marginTop: 2,

    fontSize: 9.5,
    lineHeight: 14,

    fontWeight: "500",

    color: theme.colors.textSecondary,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 7,

    minWidth: 0,
  },

  location: {
    flex: 1,

    marginLeft: 4,

    fontSize: 8.5,
    lineHeight: 12,

    fontWeight: "600",

    color: theme.colors.textMuted,
  },

  chevron: {
    width: 22,
    height: 22,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 8,

    borderRadius: 11,

    backgroundColor: "#F7F5F2",
  },
});