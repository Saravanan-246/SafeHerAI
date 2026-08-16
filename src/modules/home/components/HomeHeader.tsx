import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../../../theme/theme";

interface HomeHeaderProps {
  readonly onNotificationPress: () => void;
  readonly userName?: string;
}

export default function HomeHeader({
  onNotificationPress,
  userName,
}: HomeHeaderProps): React.JSX.Element {
  const greeting = userName
    ? `Good afternoon, ${userName}`
    : "Good afternoon";

  return (
    <View style={styles.container}>
      {/* ---------------------------------------------------------- */}
      {/* Brand                                                      */}
      {/* ---------------------------------------------------------- */}

      <View style={styles.identity}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Ionicons
              name="shield-checkmark"
              size={15}
              color={theme.colors.white}
            />
          </View>

          <Text style={styles.brandName}>
            SafeHer
          </Text>

          <Text style={styles.brandAccent}>
            AI
          </Text>
        </View>

        <Text
          numberOfLines={1}
          style={styles.greeting}
        >
          {greeting}
        </Text>
      </View>

      {/* ---------------------------------------------------------- */}
      {/* Notifications                                              */}
      {/* ---------------------------------------------------------- */}

      <Pressable
        onPress={onNotificationPress}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",

    top: 14,
    left: 16,
    right: 16,

    zIndex: 50,

    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  identity: {
    minWidth: 0,
    flex: 1,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandMark: {
    width: 31,
    height: 31,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 11,

    backgroundColor:
      theme.colors.primary,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,

    elevation: 3,
  },

  brandName: {
    marginLeft: 8,

    fontSize: 17,
    lineHeight: 20,

    fontWeight: "800",
    letterSpacing: -0.6,

    color: theme.colors.text,
  },

  brandAccent: {
    marginLeft: 2,

    fontSize: 17,
    lineHeight: 20,

    fontWeight: "900",
    letterSpacing: -0.6,

    color: theme.colors.primary,
  },

  greeting: {
    marginTop: 3,
    marginLeft: 39,

    fontSize: 9.5,
    lineHeight: 13,

    fontWeight: "600",

    color: theme.colors.textSecondary,
  },

  notificationButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    marginTop: -1,

    borderRadius: 21,

    backgroundColor:
      "rgba(255, 255, 255, 0.95)",

    borderWidth: 1,
    borderColor:
      "rgba(255, 255, 255, 0.85)",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 7,

    elevation: 4,
  },

  notificationBadge: {
    position: "absolute",

    top: 9,
    right: 9,

    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor:
      theme.colors.primary,

    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },

  pressed: {
    opacity: 0.7,

    transform: [
      {
        scale: 0.96,
      },
    ],
  },
});