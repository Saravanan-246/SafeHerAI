import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface NavigationHeaderProps {
  destination: string;
  onBack: () => void;
}

export default function NavigationHeader({
  destination,
  onBack,
}: NavigationHeaderProps) {
  return (
    <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Exit navigation"
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={19} color="#292524" />
      </TouchableOpacity>

      <View style={styles.destinationCard}>
        <Text style={styles.eyebrow}>NAVIGATING TO</Text>
        <Text style={styles.destination} numberOfLines={1}>
          {destination}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE8E2",

    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 4,
  },

  destinationCard: {
    flex: 1,
    marginLeft: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "#EDE8E2",

    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  eyebrow: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#F97316",
  },

  destination: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "800",
    color: "#292524",
  },
});
