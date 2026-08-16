import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../../theme/theme";
import type { RouteSafetyResult } from "../../route/services/routeSafetyService";

interface AreaSafetyCardProps {
  safetyResult: RouteSafetyResult | null;
  safetyLoading: boolean;
}

export default function AreaSafetyCard({
  safetyResult,
  safetyLoading,
}: AreaSafetyCardProps) {
  const analysis = safetyResult?.analysis;
  
  // Do not invent a safety score. If we don't have one, we just show unavailable
  const hasSafetyData = !!(
    analysis &&
    (analysis.policeAccess !== undefined ||
      analysis.medicalAccess !== undefined ||
      analysis.activity !== undefined ||
      analysis.crimeExposure !== undefined)
  );

  return (
    <View style={styles.areaCard}>
      <View style={styles.areaHeader}>
        <View style={styles.areaText}>
          <Text style={styles.areaLabel}>
            AREA SAFETY
          </Text>

          <Text style={styles.areaTitle}>
            {safetyLoading 
              ? "Assessing area..." 
              : hasSafetyData 
                ? "Safety data available" 
                : "No strong signals detected"}
          </Text>
        </View>

        <View style={[styles.areaIcon, { backgroundColor: hasSafetyData ? "#F0FDF4" : "#F5F5F4" }]}>
          <Ionicons
            name="shield-checkmark-outline"
            size={21}
            color={hasSafetyData ? "#16A34A" : "#A8A29E"}
          />
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progress,
            {
              width: `${hasSafetyData ? 100 : 0}%`,
              backgroundColor: hasSafetyData ? "#16A34A" : "#A8A29E"
            },
          ]}
        />
      </View>

      <Text style={styles.areaTextBody}>
        {hasSafetyData 
          ? "We successfully pulled safety signals for your current area from open safety databases." 
          : "We could not find strong safety signals for your current location. Real-time safety data might be limited here."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  areaCard: {
    marginTop: 12,
    padding: 15,
    borderRadius: 19,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  areaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  areaText: {
    flex: 1,
    paddingRight: 10,
  },

  areaLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: theme.colors.textMuted,
  },

  areaTitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.text,
  },

  areaIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  progressTrack: {
    height: 7,
    marginTop: 15,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F3EFEB",
  },

  progress: {
    height: "100%",
    borderRadius: 8,
  },

  areaTextBody: {
    marginTop: 8,
    fontSize: 9,
    lineHeight: 14,
    color: theme.colors.textMuted,
  },
});
