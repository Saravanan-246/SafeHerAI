import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from "../../../theme/theme";
import SafetyInsight from "./SafetyInsight";
import type { RouteSafetyResult } from "../../route/services/routeSafetyService";

interface SafetyOverviewCardProps {
  safetyResult: RouteSafetyResult | null;
  safetyLoading: boolean;
}

export default function SafetyOverviewCard({
  safetyResult,
  safetyLoading,
}: SafetyOverviewCardProps) {
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
    <View style={styles.hero}>
      <View style={styles.heroHeader}>
        <View style={styles.heroTitleBlock}>
          <Text style={styles.eyebrow}>
            CURRENT SAFETY
          </Text>

          <Text style={styles.heroTitle}>
            {safetyLoading 
              ? "Analyzing area..." 
              : hasSafetyData 
                ? "Area data available" 
                : "Limited safety data"}
          </Text>

          <Text style={styles.heroSubtitle}>
            Based on available local safety signals
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: hasSafetyData ? "#F0FDF4" : "#F5F5F4" }]}>
          <View style={[styles.statusDot, { backgroundColor: hasSafetyData ? "#16A34A" : "#A8A29E" }]} />

          <Text style={[styles.statusText, { color: hasSafetyData ? "#16A34A" : "#A8A29E" }]}>
            {safetyLoading ? "LOADING" : hasSafetyData ? "DATA ACTIVE" : "NO DATA"}
          </Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreBlock}>
          <Text style={styles.score}>
            {safetyLoading ? "—" : hasSafetyData ? "✓" : "—"}
          </Text>

          <Text style={styles.scoreLabel}>
            Data points found
          </Text>
        </View>

        <View style={styles.scoreVisual}>
          <View style={styles.scoreRingOuter}>
            <View
              style={[
                styles.scoreRingFill,
                {
                  borderColor: hasSafetyData ? theme.colors.primary : "#E7E5E4",
                  transform: [
                    {
                      rotate: `${(hasSafetyData ? 100 : 0) * 1.8 - 90}deg`,
                    },
                  ],
                },
              ]}
            />
            <View style={styles.scoreRingInner}>
              {safetyLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.ringScore}>
                  {hasSafetyData ? "✓" : "—"}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.insights}>
        <SafetyInsight
          icon="shield-checkmark-outline"
          label="Police Access"
          value={analysis?.policeAccess !== undefined ? `${analysis.policeAccess}/100` : "—"}
        />

        <SafetyInsight
          icon="people-outline"
          label="Activity"
          value={analysis?.activity !== undefined ? `${analysis.activity}/100` : "—"}
        />

        <SafetyInsight
          icon="medkit-outline"
          label="Medical"
          value={analysis?.medicalAccess !== undefined ? `${analysis.medicalAccess}/100` : "—"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,

    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  heroTitleBlock: {
    flex: 1,
    paddingRight: 10,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.9,
    color: theme.colors.textMuted,
  },

  heroTitle: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.text,
  },

  heroSubtitle: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 14,
    color: theme.colors.textMuted,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  scoreRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  scoreBlock: {
    justifyContent: "center",
  },

  score: {
    fontSize: 56,
    lineHeight: 62,
    fontWeight: "800",
    letterSpacing: -2,
    color: theme.colors.text,
  },

  scoreLabel: {
    marginTop: -2,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  scoreVisual: {
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
  },

  scoreRingOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 7,
    borderColor: "#FDE7D3",
    alignItems: "center",
    justifyContent: "center",
  },

  scoreRingFill: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 7,
  },

  scoreRingInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },

  ringScore: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primary,
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 18,
  },

  insights: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
