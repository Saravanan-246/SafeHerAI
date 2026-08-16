import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "../theme/theme";

interface RouteFindingLoaderProps {
  readonly visible?: boolean;
}

const STATUS_TEXTS = [
  "Finding a safer route...",
  "Analyzing traffic conditions...",
  "Checking safety signals...",
  "Preparing your route...",
];

export default function RouteFindingLoader({
  visible = true,
}: RouteFindingLoaderProps): React.JSX.Element | null {
  const [statusIndex, setStatusIndex] =
    useState(0);

  const opacity = useRef(
    new Animated.Value(0),
  ).current;

  const progress = useRef(
    new Animated.Value(0),
  ).current;

  const textOpacity = useRef(
    new Animated.Value(1),
  ).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      progress.setValue(0);
      textOpacity.setValue(1);
      return;
    }

    const fadeIn = Animated.timing(
      opacity,
      {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      },
    );

    const progressLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(
            Easing.cubic,
          ),
          useNativeDriver: true,
        }),

        Animated.timing(progress, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(
            Easing.cubic,
          ),
          useNativeDriver: true,
        }),
      ]),
    );

    fadeIn.start();
    progressLoop.start();

    const interval = setInterval(() => {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setStatusIndex(
          (current) =>
            (current + 1) %
            STATUS_TEXTS.length,
        );

        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }).start();
      });
    }, 2400);

    return () => {
      clearInterval(interval);
      progressLoop.stop();
      fadeIn.stop();
    };
  }, [
    opacity,
    progress,
    textOpacity,
    visible,
  ]);

  if (!visible) {
    return null;
  }

  const primaryScale =
    progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.9, 1.16, 0.9],
    });

  const secondaryScale =
    progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.9, 1],
    });

  const primaryOpacity =
    progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.55, 1, 0.55],
    });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.visual}>
          <Animated.View
            style={[
              styles.ring,
              {
                opacity: primaryOpacity,
                transform: [
                  {
                    scale: primaryScale,
                  },
                ],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.secondaryRing,
              {
                opacity: primaryOpacity,
                transform: [
                  {
                    scale: secondaryScale,
                  },
                ],
              },
            ]}
          />

          <View style={styles.core}>
            <ActivityIndicator
              size="small"
              color={theme.colors.white}
            />
          </View>
        </View>

        <Animated.Text
          numberOfLines={1}
          style={[
            styles.title,
            {
              opacity: textOpacity,
            },
          ]}
        >
          {STATUS_TEXTS[statusIndex]}
        </Animated.Text>

        <Text style={styles.subtitle}>
          SafeHerAI is choosing the best available option
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(248, 247, 244, 0.96)",

    zIndex: 999,
  },

  content: {
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 28,
  },

  visual: {
    width: 84,
    height: 84,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 22,
  },

  ring: {
    position: "absolute",

    width: 68,
    height: 68,

    borderRadius: 34,

    backgroundColor:
      "rgba(249, 115, 22, 0.10)",

    borderWidth: 1,
    borderColor:
      "rgba(249, 115, 22, 0.18)",
  },

  secondaryRing: {
    position: "absolute",

    width: 54,
    height: 54,

    borderRadius: 27,

    borderWidth: 1,

    borderColor:
      "rgba(249, 115, 22, 0.22)",
  },

  core: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 21,

    backgroundColor:
      theme.colors.primary,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,

    elevation: 5,
  },

  title: {
    maxWidth: 300,

    fontSize: 14,
    lineHeight: 20,

    fontWeight: "800",

    color: theme.colors.text,

    textAlign: "center",
  },

  subtitle: {
    maxWidth: 285,

    marginTop: 5,

    fontSize: 9.5,
    lineHeight: 14,

    fontWeight: "500",

    color: theme.colors.textMuted,

    textAlign: "center",
  },
});