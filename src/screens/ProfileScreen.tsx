import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Header from "../components/Header";
import { theme } from "../theme/theme";

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [routeMonitoringEnabled, setRouteMonitoringEnabled] =
    useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Header
          subtitle="ACCOUNT"
          title="Profile"
          showNotification
        />

        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              S
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              Sarah
            </Text>

            <Text style={styles.email}>
              sarah@example.com
            </Text>

            <View style={styles.statusRow}>
              <View style={styles.statusDot} />

              <Text style={styles.statusText}>
                Safety profile active
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.editButton}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Ionicons
              name="create-outline"
              size={17}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Safety */}
        <SectionTitle title="Safety" />

        <View style={styles.card}>
          <SettingRow
            icon="notifications-outline"
            title="Safety notifications"
            subtitle="Receive important safety alerts nearby"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={
                  setNotificationsEnabled
                }
                trackColor={{
                  false: "#E7E2DC",
                  true: "#FED7AA",
                }}
                thumbColor={
                  notificationsEnabled
                    ? theme.colors.primary
                    : "#FFFFFF"
                }
                accessibilityLabel="Safety notifications"
              />
            }
          />

          <Divider />

          <SettingRow
            icon="location-outline"
            title="Location access"
            subtitle="Required for live route and safety features"
            right={
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>
                  Active
                </Text>
              </View>
            }
          />

          <Divider />

          <SettingRow
            icon="shield-checkmark-outline"
            title="Route monitoring"
            subtitle="Keep safety context available during journeys"
            right={
              <Switch
                value={routeMonitoringEnabled}
                onValueChange={
                  setRouteMonitoringEnabled
                }
                trackColor={{
                  false: "#E7E2DC",
                  true: "#FED7AA",
                }}
                thumbColor={
                  routeMonitoringEnabled
                    ? theme.colors.primary
                    : "#FFFFFF"
                }
                accessibilityLabel="Route monitoring"
              />
            }
          />
        </View>

        {/* Emergency */}
        <SectionTitle title="Emergency" />

        <View style={styles.card}>
          <SettingRow
            icon="people-outline"
            title="Emergency contacts"
            subtitle="People SafeHer can help you reach in an emergency"
            arrow
          />

          <Divider />

          <SettingRow
            icon="call-outline"
            title="Emergency preferences"
            subtitle="Choose how emergency actions should work"
            arrow
          />
        </View>

        {/* Account */}
        <SectionTitle title="Account" />

        <View style={styles.card}>
          <SettingRow
            icon="person-outline"
            title="Personal information"
            subtitle="Manage your profile details"
            arrow
          />

          <Divider />

          <SettingRow
            icon="lock-closed-outline"
            title="Privacy & data"
            subtitle="Review how location and safety data is handled"
            arrow
          />

          <Divider />

          <SettingRow
            icon="help-circle-outline"
            title="Help & support"
            subtitle="Get help with SafeHer AI"
            arrow
          />
        </View>

        {/* App */}
        <SectionTitle title="App" />

        <View style={styles.card}>
          <SettingRow
            icon="information-circle-outline"
            title="About SafeHer AI"
            subtitle="Version 1.0.0"
            arrow
          />

          <Divider />

          <SettingRow
            icon="document-text-outline"
            title="Terms & safety information"
            subtitle="Read important product information"
            arrow
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          activeOpacity={0.82}
          style={styles.signOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color="#DC2626"
          />

          <Text style={styles.signOutText}>
            Sign out
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          SafeHer AI · Built for safer journeys
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <Text style={styles.sectionTitle}>
      {title}
    </Text>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  right,
  arrow = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  arrow?: boolean;
}) {
  const interactive = !right;

  return (
    <TouchableOpacity
      activeOpacity={interactive ? 0.78 : 1}
      style={styles.setting}
      disabled={!interactive}
      accessibilityRole={
        interactive ? "button" : undefined
      }
      accessibilityLabel={title}
    >
      <View style={styles.settingIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>
          {title}
        </Text>

        <Text
          style={styles.settingSubtitle}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>

      {right}

      {arrow && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.colors.textMuted}
        />
      )}
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 32,
  },

  profileCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginTop: 4,
    marginBottom: 22,

    backgroundColor: theme.colors.white,

    borderRadius: 21,
    borderWidth: 1,
    borderColor: theme.colors.border,

    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primaryLight,
  },

  avatarText: {
    fontSize: 21,
    fontWeight: "800",
    color: theme.colors.primary,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },

  email: {
    marginTop: 2,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
    backgroundColor: "#16A34A",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#16A34A",
  },

  editButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primaryLight,
  },

  sectionTitle: {
    marginLeft: 2,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textSecondary,
  },

  card: {
    marginBottom: 20,
    paddingHorizontal: 13,

    backgroundColor: theme.colors.white,

    borderRadius: 19,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  setting: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
  },

  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primaryLight,
  },

  settingContent: {
    flex: 1,
    marginHorizontal: 11,
  },

  settingTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.text,
  },

  settingSubtitle: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 14,
    color: theme.colors.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
    backgroundColor: "#16A34A",
  },

  activeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#16A34A",
  },

  signOut: {
    minHeight: 50,
    marginTop: 2,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    gap: 8,
  },

  signOutText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
  },

  footer: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 9,
    color: "#C4BDB5",
  },
});