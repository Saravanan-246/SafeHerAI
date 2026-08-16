import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Header from "../components/Header";
import AlertCard from "../components/AlertCard";
import { alerts } from "../data/alerts";
import { theme } from "../theme/theme";

type AlertFilter = "All" | "Warnings" | "Safe";

const FILTERS: Array<{
  value: AlertFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    value: "All",
    label: "All",
    icon: "notifications-outline",
  },
  {
    value: "Warnings",
    label: "Warnings",
    icon: "warning-outline",
  },
  {
    value: "Safe",
    label: "Safe",
    icon: "shield-checkmark-outline",
  },
];

export default function AlertsScreen() {
  const [filter, setFilter] =
    useState<AlertFilter>("All");

  const filteredAlerts = useMemo(() => {
    switch (filter) {
      case "Warnings":
        return alerts.filter(
          (alert) =>
            alert.type === "warning" ||
            alert.type === "danger"
        );

      case "Safe":
        return alerts.filter(
          (alert) => alert.type === "success"
        );

      default:
        return alerts;
    }
  }, [filter]);

  const warningCount = useMemo(
    () =>
      alerts.filter(
        (alert) =>
          alert.type === "warning" ||
          alert.type === "danger"
      ).length,
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        <Header
          subtitle="SAFEHER AI"
          title="Safety alerts"
          showNotification
        />

        {/* Status summary */}
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name={
                warningCount > 0
                  ? "warning-outline"
                  : "shield-checkmark-outline"
              }
              size={19}
              color={
                warningCount > 0
                  ? theme.colors.primary
                  : "#16A34A"
              }
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              {warningCount > 0
                ? `${warningCount} safety ${
                    warningCount === 1
                      ? "alert"
                      : "alerts"
                  }`
                : "You're all clear"}
            </Text>

            <Text style={styles.summaryText}>
              {warningCount > 0
                ? "Review recent activity before travelling."
                : "No active warnings in your current feed."}
            </Text>
          </View>
        </View>

        {/* Filters */}
        <View
          style={styles.filterContainer}
          accessibilityRole="radiogroup"
          accessibilityLabel="Alert filter"
        >
          {FILTERS.map((item) => {
            const selected =
              filter === item.value;

            return (
              <TouchableOpacity
                key={item.value}
                activeOpacity={0.82}
                onPress={() =>
                  setFilter(item.value)
                }
                accessibilityRole="radio"
                accessibilityLabel={`${item.label} alerts`}
                accessibilityState={{
                  selected,
                }}
                style={[
                  styles.filter,
                  selected &&
                    styles.filterSelected,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={
                    selected
                      ? "#FFFFFF"
                      : theme.colors
                          .textSecondary
                  }
                />

                <Text
                  style={[
                    styles.filterText,
                    selected &&
                      styles.filterTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Results header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Recent activity
            </Text>

            <Text style={styles.sectionSubtitle}>
              Safety information available to you
            </Text>
          </View>

          <View style={styles.count}>
            <Text style={styles.countText}>
              {filteredAlerts.length}
            </Text>
          </View>
        </View>

        {/* Alert list */}
        {filteredAlerts.length > 0 ? (
          <View style={styles.alertList}>
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                time={alert.time}
                location={alert.location}
                onPress={() => {}}
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={26}
                color="#16A34A"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Nothing to review
            </Text>

            <Text style={styles.emptyMessage}>
              No alerts are available in this
              category right now.
            </Text>
          </View>
        )}

        {/* Trust note */}
        <View style={styles.note}>
          <View style={styles.noteIcon}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={theme.colors.primary}
            />
          </View>

          <Text style={styles.noteText}>
            SafeHer shows safety information from
            available signals. Verify important
            information before making decisions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
  },

  summary: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 13,
    marginTop: 4,
    marginBottom: 14,
  },

  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primaryLight,
  },

  summaryContent: {
    flex: 1,
    marginLeft: 10,
  },

  summaryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.text,
  },

  summaryText: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 14,
    color: theme.colors.textMuted,
  },

  filterContainer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 4,
    marginBottom: 20,
  },

  filter: {
    flex: 1,
    minHeight: 40,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  filterSelected: {
    backgroundColor: theme.colors.primary,
  },

  filterText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },

  filterTextSelected: {
    color: "#FFFFFF",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 9,
    color: theme.colors.textMuted,
  },

  count: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primaryLight,
  },

  countText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.primaryDark,
  },

  alertList: {
    gap: 9,
  },

  empty: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 28,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    marginBottom: 11,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },

  emptyMessage: {
    marginTop: 5,
    fontSize: 10,
    lineHeight: 15,
    color: theme.colors.textMuted,
    textAlign: "center",
  },

  note: {
    marginTop: 10,
    padding: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  noteIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primaryLight,
  },

  noteText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 9,
    lineHeight: 14,
    color: theme.colors.textMuted,
  },
});