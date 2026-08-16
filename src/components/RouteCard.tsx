import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../theme/theme";

interface RouteCardProps {
  readonly title: string;
  readonly distance: string;
  readonly duration: string;
  readonly recommended?: boolean;
  readonly selected?: boolean;
  readonly onPress?: () => void;
}

export default function RouteCard({
  title,
  distance,
  duration,
  recommended = false,
  selected = false,
  onPress,
}: RouteCardProps): React.JSX.Element {
  const content = (
    <View
      style={[
        styles.card,
        selected && styles.cardSelected,
      ]}
    >
      <View style={styles.selectorColumn}>
        <View
          style={[
            styles.selector,
            selected && styles.selectorSelected,
          ]}
        >
          {selected ? (
            <Ionicons
              name="checkmark"
              size={11}
              color={theme.colors.white}
            />
          ) : null}
        </View>

        {selected ? (
          <View style={styles.selectedLine} />
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              selected && styles.titleSelected,
            ]}
          >
            {title}
          </Text>

          {recommended ? (
            <View style={styles.recommended}>
              <Ionicons
                name="sparkles-outline"
                size={10}
                color={theme.colors.primary}
              />

              <Text style={styles.recommendedText}>
                Recommended
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metrics}>
          <Text
            numberOfLines={1}
            style={styles.duration}
          >
            {duration}
          </Text>

          <View style={styles.metricDivider} />

          <Text
            numberOfLines={1}
            style={styles.distance}
          >
            {distance}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.arrow,
          selected && styles.arrowSelected,
        ]}
      >
        <Ionicons
          name="chevron-forward"
          size={16}
          color={
            selected
              ? theme.colors.primary
              : theme.colors.textMuted
          }
        />
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${duration}, ${distance}`}
      accessibilityHint="Selects this route on the map."
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,

    flexDirection: "row",
    alignItems: "center",

    marginBottom: 9,

    paddingHorizontal: 13,
    paddingVertical: 11,

    backgroundColor: theme.colors.white,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: 16,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 7,

    elevation: 2,
  },

  cardSelected: {
    backgroundColor: "#FFFCF8",
    borderColor: "#FDBA74",
  },

  selectorColumn: {
    width: 28,

    alignSelf: "stretch",

    alignItems: "flex-start",
    justifyContent: "center",
  },

  selector: {
    width: 19,
    height: 19,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 9.5,

    borderWidth: 1.8,
    borderColor: "#C8C2BB",

    backgroundColor: theme.colors.white,
  },

  selectorSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },

  selectedLine: {
    position: "absolute",

    left: 8,

    top: "50%",

    width: 2,
    height: 24,

    marginTop: 10,

    borderRadius: 1,

    backgroundColor: "#FED7AA",
  },

  content: {
    flex: 1,
    minWidth: 0,

    marginLeft: 2,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",

    minWidth: 0,
  },

  title: {
    flexShrink: 1,

    fontSize: 12.5,
    lineHeight: 17,

    fontWeight: "800",

    color: theme.colors.text,
  },

  titleSelected: {
    color: theme.colors.text,
  },

  recommended: {
    flexDirection: "row",
    alignItems: "center",

    marginLeft: 7,

    paddingHorizontal: 7,
    paddingVertical: 3,

    borderRadius: 999,

    backgroundColor:
      theme.colors.primaryLight,
  },

  recommendedText: {
    marginLeft: 3,

    fontSize: 7,
    lineHeight: 10,

    fontWeight: "800",

    color: theme.colors.primary,
  },

  metrics: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 4,
  },

  duration: {
    fontSize: 16,
    lineHeight: 21,

    fontWeight: "800",

    color: theme.colors.text,
  },

  metricDivider: {
    width: 3,
    height: 3,

    marginHorizontal: 8,

    borderRadius: 2,

    backgroundColor: "#C4BDB6",
  },

  distance: {
    fontSize: 9.5,
    lineHeight: 13,

    fontWeight: "700",

    color: theme.colors.textSecondary,
  },

  arrow: {
    width: 28,
    height: 28,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 7,

    borderRadius: 14,

    backgroundColor: "#F7F5F2",
  },

  arrowSelected: {
    backgroundColor: theme.colors.primaryLight,
  },

  pressed: {
    opacity: 0.72,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },
});