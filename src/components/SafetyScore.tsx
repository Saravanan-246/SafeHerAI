import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "../theme/theme";

interface SafetyScoreProps {
  readonly score: number;
  readonly label?: string;
  readonly size?: "small" | "large";
}

interface ScorePresentation {
  readonly label: string;
  readonly color: string;
  readonly softColor: string;
}

const getScorePresentation = (
  score: number,
): ScorePresentation => {
  if (score >= 80) {
    return {
      label: "Low risk",
      color: "#16A34A",
      softColor: "#F0FDF4",
    };
  }

  if (score >= 60) {
    return {
      label: "Moderate risk",
      color: "#F97316",
      softColor: "#FFF7ED",
    };
  }

  return {
    label: "High risk",
    color: "#DC2626",
    softColor: "#FEF2F2",
  };
};

const clampScore = (score: number): number => {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(100, Math.max(0, score));
};

export default function SafetyScore({
  score,
  label = "Safety score",
  size = "large",
}: SafetyScoreProps): React.JSX.Element {
  const safeScore = clampScore(score);
  const presentation =
    getScorePresentation(safeScore);

  const isLarge = size === "large";

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${Math.round(
        safeScore,
      )} out of 100, ${presentation.label}`}
      style={[
        styles.container,
        isLarge
          ? styles.containerLarge
          : styles.containerSmall,
      ]}
    >
      <View
        style={[
          styles.scoreRing,
          isLarge
            ? styles.scoreRingLarge
            : styles.scoreRingSmall,
          {
            borderColor: presentation.color,
            backgroundColor:
              presentation.softColor,
          },
        ]}
      >
        <Text
          style={[
            styles.score,
            isLarge
              ? styles.scoreLarge
              : styles.scoreSmall,
            {
              color: presentation.color,
            },
          ]}
        >
          {Math.round(safeScore)}
        </Text>

        <Text
          style={[
            styles.outOf,
            !isLarge && styles.outOfSmall,
          ]}
        >
          /100
        </Text>
      </View>

      <View
        style={[
          styles.info,
          isLarge
            ? styles.infoLarge
            : styles.infoSmall,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            !isLarge && styles.titleSmall,
          ]}
        >
          {label}
        </Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  presentation.color,
              },
            ]}
          />

          <Text
            style={[
              styles.status,
              isLarge
                ? styles.statusLarge
                : styles.statusSmall,
              {
                color: presentation.color,
              },
            ]}
          >
            {presentation.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",

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

  containerLarge: {
    padding: 15,
  },

  containerSmall: {
    padding: 10,
  },

  scoreRing: {
    alignItems: "center",
    justifyContent: "center",

    borderRadius: 999,

    borderWidth: 4,
  },

  scoreRingLarge: {
    width: 78,
    height: 78,
  },

  scoreRingSmall: {
    width: 56,
    height: 56,

    borderWidth: 3,
  },

  score: {
    fontWeight: "900",

    letterSpacing: -0.8,
  },

  scoreLarge: {
    fontSize: 26,
    lineHeight: 29,
  },

  scoreSmall: {
    fontSize: 18,
    lineHeight: 21,
  },

  outOf: {
    marginTop: -1,

    fontSize: 8,
    lineHeight: 10,

    fontWeight: "600",

    color: theme.colors.textMuted,
  },

  outOfSmall: {
    fontSize: 7,
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  infoLarge: {
    marginLeft: 14,
  },

  infoSmall: {
    marginLeft: 10,
  },

  title: {
    fontSize: 12,
    lineHeight: 16,

    fontWeight: "700",

    color: theme.colors.textSecondary,
  },

  titleSmall: {
    fontSize: 9.5,
    lineHeight: 13,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 5,
  },

  statusDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    marginRight: 5,
  },

  status: {
    fontWeight: "800",
  },

  statusLarge: {
    fontSize: 13,
    lineHeight: 17,
  },

  statusSmall: {
    fontSize: 9,
    lineHeight: 12,
  },
});