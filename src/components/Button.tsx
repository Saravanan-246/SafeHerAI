import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../theme/theme";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline";

interface ButtonProps {
  readonly title: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly loading?: boolean;
  readonly disabled?: boolean;
}

interface VariantStyle {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly textColor: string;
  readonly iconColor: string;
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  VariantStyle
> = {
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    textColor: theme.colors.white,
    iconColor: theme.colors.white,
  },

  secondary: {
    backgroundColor:
      theme.colors.primaryLight,
    borderColor: "#FED7AA",
    textColor: theme.colors.primary,
    iconColor: theme.colors.primary,
  },

  outline: {
    backgroundColor:
      theme.colors.white,
    borderColor: theme.colors.border,
    textColor: theme.colors.textSecondary,
    iconColor: theme.colors.textSecondary,
  },
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
}: ButtonProps): React.JSX.Element {
  const config = VARIANT_STYLES[variant];
  const unavailable = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityState={{
        disabled: unavailable,
        busy: loading,
      }}
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor:
            config.backgroundColor,
          borderColor: config.borderColor,
        },
        unavailable && styles.disabled,
        pressed &&
          !unavailable &&
          styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={config.iconColor}
        />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={config.iconColor}
            />
          ) : null}

          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: config.textColor,
              },
              icon && styles.titleWithIcon,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 18,

    borderWidth: 1,
    borderRadius: 14,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    minWidth: 0,
  },

  title: {
    fontSize: 13,
    lineHeight: 18,

    fontWeight: "800",

    textAlign: "center",
  },

  titleWithIcon: {
    marginLeft: 7,
  },

  pressed: {
    opacity: 0.78,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  disabled: {
    opacity: 0.5,
  },
});