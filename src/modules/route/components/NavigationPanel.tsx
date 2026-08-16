import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import JourneySafetyStatus from "./JourneySafetyStatus";
import { formatDistance, formatDuration } from "../../../utils/helpers";
import type { AnomalySeverity } from "../services/journeyAnomalyService";

interface NavigationPanelProps {
  duration: number;
  distance: number;
  severity: AnomalySeverity;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

export default function NavigationPanel({
  duration,
  distance,
  severity,
  expanded,
  onExpand,
  onCollapse,
}: NavigationPanelProps) {
  if (!expanded) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onExpand}
        accessibilityRole="button"
        accessibilityLabel="Expand navigation panel"
        style={styles.minimizedPanel}
      >
        <View style={styles.miniLeft}>
          <Text style={styles.miniEta}>{formatDuration(duration)}</Text>
          <Text style={styles.miniDistance}>{formatDistance(distance)}</Text>
        </View>

        <View style={styles.expandIcon}>
          <Ionicons name="chevron-up" size={18} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.expandedPanel}>
      <View style={styles.panelHandle} />

      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.statusLabel}>ON ROUTE</Text>
          <Text style={styles.eta}>{formatDuration(duration)}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onCollapse}
          accessibilityRole="button"
          accessibilityLabel="Minimize navigation panel"
          style={styles.collapseButton}
        >
          <Ionicons name="chevron-down" size={19} color="#57534E" />
        </TouchableOpacity>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="navigate-outline" size={15} color="#78716C" />
          <Text style={styles.metaText}>{formatDistance(distance)}</Text>
        </View>

        <View style={styles.metaDivider} />

        <JourneySafetyStatus severity={severity} />
      </View>

      <View style={styles.routeStatus}>
        <View style={styles.liveDot} />
        <Text style={styles.routeStatusText}>Route active</Text>
        <Text style={styles.routeStatusSubtext}>
          Follow the highlighted route
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  expandedPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 22,

    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

    backgroundColor: "#FFFFFF",

    borderTopWidth: 1,
    borderTopColor: "#EDE8E2",

    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: -5,
    },

    elevation: 10,
  },

  panelHandle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    alignSelf: "center",
    backgroundColor: "#D6D0C9",
    marginBottom: 14,
  },

  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#16A34A",
  },

  eta: {
    marginTop: 2,
    fontSize: 28,
    fontWeight: "800",
    color: "#292524",
  },

  collapseButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F5F2",
  },

  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: "600",
    color: "#78716C",
  },

  metaDivider: {
    width: 1,
    height: 16,
    marginHorizontal: 12,
    backgroundColor: "#E7E2DC",
  },

  routeStatus: {
    marginTop: 13,
    minHeight: 46,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: "#F7F5F2",
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
  },

  routeStatusText: {
    marginLeft: 7,
    fontSize: 10,
    fontWeight: "800",
    color: "#292524",
  },

  routeStatusSubtext: {
    marginLeft: 7,
    flex: 1,
    fontSize: 9,
    color: "#A8A29E",
  },

  minimizedPanel: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 16,

    minHeight: 58,
    paddingHorizontal: 15,

    borderRadius: 18,
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#EDE8E2",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 7,
  },

  miniLeft: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  miniEta: {
    fontSize: 17,
    fontWeight: "800",
    color: "#292524",
  },

  miniDistance: {
    marginLeft: 8,
    fontSize: 10,
    color: "#78716C",
  },

  expandIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F97316",
  },
});
