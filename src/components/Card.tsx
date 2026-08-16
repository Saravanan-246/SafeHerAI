import React, { ReactNode } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { theme } from "../theme/theme";

interface CardProps {
  readonly children: ReactNode;
  readonly onPress?: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly padding?: number;
}

export default function Card({
  children,
  onPress,
  style,
  padding = 16,
}: CardProps): React.JSX.Element {
  const content = (
    <View
      style={[
        styles.card,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 16,
  },

  card: {
    backgroundColor: theme.colors.white,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: theme.colors.border,

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
    opacity: 0.78,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },
});