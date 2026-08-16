import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../theme/theme";

interface HeaderProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly showBack?: boolean;
  readonly showNotification?: boolean;
  readonly onBack?: () => void;
  readonly onNotification?: () => void;
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  showNotification = false,
  onBack,
  onNotification,
}: HeaderProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={onBack}
            disabled={!onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={21}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        ) : null}

        <View
          style={[
            styles.textContainer,
            showBack && styles.textWithBack,
          ]}
        >
          {subtitle ? (
            <Text
              numberOfLines={1}
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          ) : null}

          {title ? (
            <Text
              numberOfLines={1}
              style={styles.title}
            >
              {title}
            </Text>
          ) : null}
        </View>
      </View>

      {showNotification ? (
        <Pressable
          onPress={onNotification}
          disabled={!onNotification}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
          hitSlop={8}
          style={({ pressed }) => [
            styles.notificationButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={21}
            color={theme.colors.text}
          />

          <View
            pointerEvents="none"
            style={styles.notificationBadge}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 18,
  },

  left: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",

    minWidth: 0,
  },

  textContainer: {
    flex: 1,
    minWidth: 0,
  },

  textWithBack: {
    marginLeft: 10,
  },

  title: {
    fontSize: 22,
    lineHeight: 27,

    fontWeight: "800",
    letterSpacing: -0.5,

    color: theme.colors.text,
  },

  subtitle: {
    marginBottom: 2,

    fontSize: 9,
    lineHeight: 13,

    fontWeight: "800",
    letterSpacing: 0.45,

    textTransform: "uppercase",

    color: theme.colors.primary,
  },

  backButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 14,

    backgroundColor:
      "rgba(255, 255, 255, 0.94)",

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  notificationButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 12,

    borderRadius: 21,

    backgroundColor:
      "rgba(255, 255, 255, 0.94)",

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  notificationBadge: {
    position: "absolute",

    top: 9,
    right: 9,

    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: theme.colors.primary,

    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },

  pressed: {
    opacity: 0.68,

    transform: [
      {
        scale: 0.96,
      },
    ],
  },
});