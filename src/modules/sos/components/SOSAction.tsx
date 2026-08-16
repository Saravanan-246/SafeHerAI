import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/AppNavigator";
import { theme } from "../../../theme/theme";

interface SOSActionProps {
  variant?: "card" | "floating" | "pill";
  style?: any;
}

export default function SOSAction({ variant = "card", style }: SOSActionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = () => {
    navigation.navigate("SOS");
  };

  if (variant === "floating") {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={[styles.floating, style]}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS"
      >
        <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
        <Text style={styles.floatingText}>SOS</Text>
      </TouchableOpacity>
    );
  }

  if (variant === "pill") {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={[styles.pill, style]}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS"
      >
        <Ionicons name="alert-circle-outline" size={16} color="#FFFFFF" />
        <Text style={styles.pillText}>EMERGENCY SOS</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      onPress={handlePress}
      style={[styles.action, style]}
      accessibilityRole="button"
      accessibilityLabel="Emergency SOS"
    >
      <View style={[styles.actionIcon, styles.dangerIcon]}>
        <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
      </View>

      <Text style={styles.actionTitle}>SOS</Text>

      <Text style={styles.actionSubtitle}>Emergency help</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
    minHeight: 112,
    backgroundColor: theme.colors.white,
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  dangerIcon: {
    backgroundColor: "#FEF2F2",
  },

  actionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.text,
  },

  actionSubtitle: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 14,
    color: theme.colors.textMuted,
  },

  floating: {
    position: "absolute",
    right: 16,
    bottom: 245,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#DC2626",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  floatingText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    marginTop: -2,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    elevation: 3,
  },

  pillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
