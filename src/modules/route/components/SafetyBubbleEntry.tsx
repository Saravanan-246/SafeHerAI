import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SafetyBubbleEntryProps {
  onPress: () => void;
}

export default function SafetyBubbleEntry({
  onPress,
}: SafetyBubbleEntryProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open Safety Bubble"
      style={styles.container}
    >
      <View style={styles.icon}>
        <Ionicons
          name="shield-checkmark-outline"
          size={18}
          color="#EA580C"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Safety Bubble
        </Text>

        <Text style={styles.subtitle}>
          Explore safety information around this route
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={17}
        color="#A8A29E"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE8E2",
    flexDirection: "row",
    alignItems: "center",
  },

  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
    marginHorizontal: 10,
  },

  title: {
    fontSize: 12,
    fontWeight: "800",
    color: "#292524",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 14,
    color: "#A8A29E",
  },
});