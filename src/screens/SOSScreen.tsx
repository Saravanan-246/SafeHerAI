import React, {
  useCallback,
  useState,
} from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";

import type { RootStackParamList } from "../navigation/AppNavigator";

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type SOSStatus =
  | "idle"
  | "activating"
  | "active"
  | "active_no_location";

/*
 * India's unified emergency number (Dial 112).
 * Dispatches police, fire and medical services.
 */
const EMERGENCY_NUMBER = "112";

export default function SOSScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [sosStatus, setSOSStatus] =
    useState<SOSStatus>("idle");

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const active =
    sosStatus === "active" ||
    sosStatus === "active_no_location" ||
    sosStatus === "activating";

  /* ── Back navigation ── */
  const handleBack = useCallback(() => {
    if (active) {
      Alert.alert(
        "SOS is active",
        "Cancel the emergency before leaving this screen.",
        [
          { text: "Stay", style: "cancel" },
          {
            text: "Cancel SOS and leave",
            style: "destructive",
            onPress: () => {
              setSOSStatus("idle");
              setLocation(null);
              navigation.goBack();
            },
          },
        ]
      );
      return;
    }

    navigation.goBack();
  }, [active, navigation]);

  /* ── SOS activation — gets real GPS ── */
  const activateSOS = useCallback(async () => {
    setSOSStatus("activating");

    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setSOSStatus("active_no_location");
        return;
      }

      /*
       * Try last-known first for speed — it is
       * available immediately without network.
       */
      const lastKnown =
        await Location.getLastKnownPositionAsync();

      if (lastKnown) {
        setLocation({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        });
        setSOSStatus("active");
      }

      /* Then get current position for accuracy */
      try {
        const current =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

        setLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        setSOSStatus("active");
      } catch {
        /*
         * GPS fix failed. If we already have
         * last-known, keep it. Otherwise report
         * active_no_location so the user knows
         * to call services manually.
         */
        if (!lastKnown) {
          setSOSStatus("active_no_location");
        }
      }
    } catch {
      setSOSStatus("active_no_location");
    }
  }, []);

  /* ── Main SOS button ── */
  const handleSOS = useCallback(() => {
    if (active) {
      Alert.alert(
        "Cancel emergency?",
        "This will deactivate emergency mode.",
        [
          { text: "Keep active", style: "cancel" },
          {
            text: "Cancel SOS",
            style: "destructive",
            onPress: () => {
              setSOSStatus("idle");
              setLocation(null);
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Activate SOS?",
      "This will start your emergency safety flow and get your current location.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate",
          style: "destructive",
          onPress: activateSOS,
        },
      ]
    );
  }, [active, activateSOS]);

  /* ── Emergency call — real phone action ── */
  const handleEmergencyCall = useCallback(async () => {
    const url = `tel:${EMERGENCY_NUMBER}`;

    try {
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Unable to call",
          `Please dial ${EMERGENCY_NUMBER} manually to reach emergency services.`
        );
      }
    } catch {
      Alert.alert(
        "Call failed",
        `Unable to open the dialer. Please dial ${EMERGENCY_NUMBER} manually.`
      );
    }
  }, []);

  /* ── Trusted contacts — honest fallback ── */
  const handleTrustedContacts = useCallback(() => {
    Alert.alert(
      "Emergency contacts",
      "Add emergency contacts in your profile settings to enable contact notifications.",
      [{ text: "OK" }]
    );
  }, []);

  /* ── Derived UI text ── */
  const statusTitle = (() => {
    switch (sosStatus) {
      case "activating":
        return "Getting your location...";
      case "active":
        return "SOS is active";
      case "active_no_location":
        return "SOS active — location unavailable";
      default:
        return "You're in control";
    }
  })();

  const statusMessage = (() => {
    switch (sosStatus) {
      case "activating":
        return "Please wait while we determine your location.";
      case "active":
        return location
          ? `Location: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
          : "Your emergency flow has been activated.";
      case "active_no_location":
        return `Emergency mode is on. Location could not be determined — dial ${EMERGENCY_NUMBER} immediately.`;
      default:
        return "Use SOS when you feel unsafe or need immediate assistance.";
    }
  })();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color="#57534E"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>SAFEHER AI</Text>
            <Text style={styles.title}>Emergency SOS</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIcon,
              active && styles.statusIconActive,
            ]}
          >
            <Ionicons
              name={
                sosStatus === "activating"
                  ? "hourglass-outline"
                  : active
                    ? "radio"
                    : "shield-checkmark-outline"
              }
              size={25}
              color={active ? "#DC2626" : "#F97316"}
            />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {statusTitle}
            </Text>

            <Text style={styles.statusMessage}>
              {statusMessage}
            </Text>
          </View>
        </View>

        {/* SOS Button */}
        <View style={styles.sosSection}>
          <Text style={styles.sosLabel}>
            {active
              ? "EMERGENCY ACTIVE"
              : "EMERGENCY ASSISTANCE"}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSOS}
            disabled={sosStatus === "activating"}
            style={[
              styles.sosButtonOuter,
              active && styles.sosButtonOuterActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              active ? "Cancel emergency" : "Activate SOS"
            }
          >
            <View
              style={[
                styles.sosButton,
                active && styles.sosButtonActive,
              ]}
            >
              <Ionicons
                name={
                  sosStatus === "activating"
                    ? "hourglass"
                    : active
                      ? "stop"
                      : "alert"
                }
                size={34}
                color="#FFFFFF"
              />

              <Text style={styles.sosText}>
                {sosStatus === "activating"
                  ? "..."
                  : active
                    ? "STOP"
                    : "SOS"}
              </Text>

              <Text style={styles.sosSubtext}>
                {sosStatus === "activating"
                  ? "Getting location"
                  : active
                    ? "Cancel emergency"
                    : "Press to activate"}
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.sosDescription}>
            {active
              ? `Stay where you are if possible. Call ${EMERGENCY_NUMBER} if in immediate danger.`
              : "Tap the button only when you need emergency assistance."}
          </Text>
        </View>

        {/* Emergency actions */}
        <View style={styles.actions}>
          <EmergencyAction
            icon="call-outline"
            title="Call emergency services"
            subtitle={`Dial ${EMERGENCY_NUMBER} — India unified emergency`}
            onPress={handleEmergencyCall}
          />

          <EmergencyAction
            icon="people-outline"
            title="Trusted contacts"
            subtitle="Configure contacts in profile settings"
            onPress={handleTrustedContacts}
          />
        </View>

        {/* Safety information */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color="#F97316"
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              What happens after SOS?
            </Text>

            <Text style={styles.infoText}>
              Activating SOS gets your GPS location and
              enables the emergency call action. Dial{" "}
              {EMERGENCY_NUMBER} to reach police, fire or
              medical services. Trusted contact notifications
              require contacts to be added in Profile.
            </Text>
          </View>
        </View>

        {active && (
          <View style={styles.activeBanner}>
            <View style={styles.activePulse} />

            <View style={styles.activeBannerContent}>
              <Text style={styles.activeBannerTitle}>
                Emergency mode active
              </Text>

              <Text style={styles.activeBannerText}>
                {sosStatus === "active_no_location"
                  ? `Location unavailable. Dial ${EMERGENCY_NUMBER} immediately.`
                  : "Stay calm. Call emergency services if needed."}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmergencyAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.action}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={20}
          color="#F97316"
        />
      </View>

      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={17}
        color="#C4BDB6"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F7",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 25,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1ECE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#F97316",
    marginBottom: 3,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3F3A35",
  },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#F1ECE7",
  },

  statusIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },

  statusIconActive: {
    backgroundColor: "#FEF2F2",
  },

  statusContent: {
    flex: 1,
    marginLeft: 12,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3F3A35",
  },

  statusMessage: {
    fontSize: 11,
    lineHeight: 17,
    color: "#A8A29E",
    marginTop: 4,
  },

  sosSection: {
    alignItems: "center",
    marginTop: 30,
  },

  sosLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#A8A29E",
    marginBottom: 18,
  },

  sosButtonOuter: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#FFF1E8",
    alignItems: "center",
    justifyContent: "center",
  },

  sosButtonOuterActive: {
    backgroundColor: "#FEE2E2",
  },

  sosButton: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#F97316",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  sosButtonActive: {
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
  },

  sosText: {
    fontSize: 27,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 4,
    letterSpacing: 1,
  },

  sosSubtext: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: 2,
  },

  sosDescription: {
    maxWidth: 290,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 17,
    color: "#A8A29E",
    marginTop: 18,
  },

  actions: {
    marginTop: 25,
    gap: 10,
  },

  action: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#F1ECE7",
  },

  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },

  actionContent: {
    flex: 1,
    marginHorizontal: 11,
  },

  actionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3F3A35",
  },

  actionSubtitle: {
    fontSize: 10,
    color: "#A8A29E",
    marginTop: 3,
  },

  infoCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 13,
    borderWidth: 1,
    borderColor: "#F1ECE7",
    marginTop: 10,
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 10,
  },

  infoTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#57534E",
  },

  infoText: {
    fontSize: 10,
    lineHeight: 16,
    color: "#A8A29E",
    marginTop: 3,
  },

  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 15,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  activePulse: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#DC2626",
    marginRight: 9,
  },

  activeBannerContent: {
    flex: 1,
  },

  activeBannerTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B91C1C",
  },

  activeBannerText: {
    fontSize: 10,
    color: "#DC2626",
    marginTop: 2,
  },
});