import React, {
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  FastHelpSheet,
  HomeHeader,
  HomeMap,
  useFastHelp,
  useHome,
} from "../modules/home";

import type {
  RootStackParamList,
} from "../navigation/AppNavigator";

import { theme } from "../theme/theme";

type RootNavigationProp =
  NativeStackNavigationProp<
    RootStackParamList
  >;

export default function HomeScreen(): React.JSX.Element {
  const {
    location,
    locationLoading,
    permissionDenied,
    actions,
  } = useHome();

  const navigation =
    useNavigation<RootNavigationProp>();

  const [
    fastHelpVisible,
    setFastHelpVisible,
  ] = useState(false);

  const [
    fastHelpOpening,
    setFastHelpOpening,
  ] = useState(false);

  const {
    loading: fastHelpLoading,
    selectedType: fastHelpType,
    error: fastHelpError,
    findFastHelp,
  } = useFastHelp(
    location,
    navigation,
  );

  /*
   * Only show the full Home loader while the
   * first usable location is being obtained.
   */
  const showInitialLoading =
    locationLoading &&
    !location &&
    !permissionDenied;

  /*
   * Opening state is only for the first frame
   * of the Fast Help sheet.
   */
  const fastHelpUiLoading =
    fastHelpOpening ||
    fastHelpLoading;

  const openFastHelp = (): void => {
    if (
      fastHelpOpening ||
      fastHelpLoading
    ) {
      return;
    }

    setFastHelpVisible(true);
    setFastHelpOpening(true);

    requestAnimationFrame(() => {
      setFastHelpOpening(false);
    });
  };

  /*
   * Always allow the X button to close.
   */
  const closeFastHelp = (): void => {
    setFastHelpOpening(false);
    setFastHelpVisible(false);
  };

  const handlePolicePress = (): void => {
    void findFastHelp("police");
  };

  const handleMedicalPress = (): void => {
    void findFastHelp("medical");
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.container}
    >
      <View style={styles.screen}>
        {/* ======================================================== */}
        {/* MAP                                                      */}
        {/* ======================================================== */}

        <View style={styles.mapLayer}>
          <HomeMap
            latitude={
              location?.coords.latitude
            }
            longitude={
              location?.coords.longitude
            }
            heading={
              location?.coords.heading ?? 0
            }
            loading={locationLoading}
            permissionDenied={
              permissionDenied
            }
          />

          <HomeHeader
            onNotificationPress={
              actions.openAlerts
            }
          />
        </View>

        {/* ======================================================== */}
        {/* HOME CARD                                                */}
        {/* ======================================================== */}

        <View
          pointerEvents="box-none"
          style={styles.bottomOverlay}
        >
          <View style={styles.homeCard}>
            {/* SAFETY STATUS */}

            <Pressable
              onPress={
                actions.openSafetyBubble
              }
              accessibilityRole="button"
              accessibilityLabel="View current safety status"
              hitSlop={6}
              style={({ pressed }) => [
                styles.safetyRow,
                pressed &&
                  styles.pressed,
              ]}
            >
              <View style={styles.safetyIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={
                    theme.colors.primary
                  }
                />
              </View>

              <View
                style={styles.safetyContent}
              >
                <View
                  style={styles.metaRow}
                >
                  <Text
                    style={styles.eyebrow}
                  >
                    SAFETY STATUS
                  </Text>

                  <View
                    style={styles.liveBadge}
                  >
                    <View
                      style={styles.liveDot}
                    />

                    <Text
                      style={styles.liveText}
                    >
                      LIVE
                    </Text>
                  </View>
                </View>

                <Text
                  style={styles.title}
                >
                  You're in a safe area
                </Text>

                <Text
                  numberOfLines={1}
                  style={styles.message}
                >
                  No immediate safety concerns detected
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={16}
                color={
                  theme.colors.textMuted
                }
              />
            </Pressable>

            <View style={styles.divider} />

            {/* FAST HELP */}

            <Pressable
              onPress={openFastHelp}
              disabled={
                fastHelpOpening ||
                fastHelpLoading
              }
              accessibilityRole="button"
              accessibilityLabel="Open fast emergency help"
              hitSlop={6}
              style={({ pressed }) => [
                styles.emergencyRow,
                pressed &&
                  styles.emergencyPressed,
                (fastHelpOpening ||
                  fastHelpLoading) &&
                  styles.disabledRow,
              ]}
            >
              <View
                style={
                  styles.emergencyIcon
                }
              >
                <Ionicons
                  name="alert-outline"
                  size={17}
                  color={
                    theme.colors.danger
                  }
                />
              </View>

              <View
                style={
                  styles.emergencyContent
                }
              >
                <Text
                  style={
                    styles.emergencyTitle
                  }
                >
                  Emergency assistance
                </Text>

                <Text
                  numberOfLines={1}
                  style={
                    styles.emergencyMessage
                  }
                >
                  Find nearby police or medical help
                </Text>
              </View>

              <View
                style={
                  styles.emergencyArrow
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={
                    theme.colors.danger
                  }
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ======================================================== */}
        {/* FAST HELP SHEET                                          */}
        {/* ======================================================== */}

        <FastHelpSheet
          visible={fastHelpVisible}
          onClose={closeFastHelp}
          onPolicePress={
            handlePolicePress
          }
          onMedicalPress={
            handleMedicalPress
          }
          loading={
            fastHelpUiLoading
          }
          selectedType={
            fastHelpType
          }
          error={
            fastHelpError
          }
        />

        {/* ======================================================== */}
        {/* ERROR                                                    */}
        {/* ======================================================== */}

        {fastHelpError && (
          <View
            pointerEvents="box-none"
            style={styles.errorOverlay}
          >
            <View
              style={styles.errorCard}
            >
              <Ionicons
                name="warning-outline"
                size={18}
                color={
                  theme.colors.danger
                }
              />

              <Text
                style={styles.errorText}
              >
                {fastHelpError}
              </Text>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* INITIAL HOME LOADING                                     */}
        {/* ======================================================== */}

        {showInitialLoading && (
          <View
            pointerEvents="auto"
            style={
              styles.initialLoadingOverlay
            }
          >
            <View
              style={
                styles.initialLoadingCard
              }
            >
              <View
                style={
                  styles.initialLoadingIcon
                }
              >
                <ActivityIndicator
                  size="small"
                  color={
                    theme.colors.danger
                  }
                />
              </View>

              <Text
                style={
                  styles.initialLoadingTitle
                }
              >
                Preparing SafeHerAI
              </Text>

              <Text
                style={
                  styles.initialLoadingMessage
                }
              >
                Getting your location and
                preparing your safety view...
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
  },

  screen: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },

  mapLayer: {
    flex: 1,
    position: "relative",
  },

  bottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    zIndex: 20,

    paddingHorizontal: 14,
    paddingBottom: 82,
  },

  homeCard: {
    width: "100%",

    borderRadius: 20,

    paddingHorizontal: 12,
    paddingVertical: 7,

    backgroundColor:
      "rgba(255, 255, 255, 0.98)",

    borderWidth: 1,
    borderColor:
      theme.colors.border,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 6,
  },

  /* SAFETY */

  safetyRow: {
    minHeight: 62,

    flexDirection: "row",
    alignItems: "center",
  },

  safetyIcon: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 12,

    backgroundColor:
      theme.colors.primaryLight,
  },

  safetyContent: {
    flex: 1,
    minWidth: 0,

    marginHorizontal: 9,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  eyebrow: {
    fontSize: 6.5,
    lineHeight: 8,

    fontWeight: "900",
    letterSpacing: 0.7,

    color:
      theme.colors.textMuted,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 5,
    height: 5,

    marginRight: 4,

    borderRadius: 2.5,

    backgroundColor:
      theme.colors.primary,
  },

  liveText: {
    fontSize: 6.5,
    lineHeight: 8,

    fontWeight: "900",
    letterSpacing: 0.4,

    color:
      theme.colors.textMuted,
  },

  title: {
    marginTop: 3,

    fontSize: 11.5,
    lineHeight: 14,

    fontWeight: "900",

    color:
      theme.colors.primary,
  },

  message: {
    marginTop: 2,

    fontSize: 8.2,
    lineHeight: 11,

    fontWeight: "500",

    color:
      theme.colors.textSecondary,
  },

  divider: {
    height: 1,

    marginHorizontal: 2,

    backgroundColor: "#ECE9E5",
  },

  /* FAST HELP */

  emergencyRow: {
    minHeight: 50,

    flexDirection: "row",
    alignItems: "center",
  },

  emergencyIcon: {
    width: 34,
    height: 34,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 11,

    backgroundColor:
      theme.colors.dangerLight,
  },

  emergencyContent: {
    flex: 1,
    minWidth: 0,

    marginLeft: 9,
  },

  emergencyTitle: {
    fontSize: 9.5,
    lineHeight: 13,

    fontWeight: "900",

    color:
      theme.colors.danger,
  },

  emergencyMessage: {
    marginTop: 1,

    fontSize: 8,
    lineHeight: 11,

    fontWeight: "500",

    color:
      theme.colors.textSecondary,
  },

  emergencyArrow: {
    width: 28,
    height: 28,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 7,

    borderRadius: 14,

    backgroundColor:
      "rgba(255, 255, 255, 0.7)",
  },

  disabledRow: {
    opacity: 0.6,
  },

  /* ERROR */

  errorOverlay: {
    position: "absolute",

    left: 16,
    right: 16,
    bottom: 84,

    zIndex: 30,

    alignItems: "center",
  },

  errorCard: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,
    paddingVertical: 10,

    borderRadius: 14,

    backgroundColor: "#FEF2F2",

    borderWidth: 1,
    borderColor: "#FECACA",
  },

  errorText: {
    flex: 1,

    marginLeft: 8,

    fontSize: 10,
    lineHeight: 14,

    fontWeight: "700",

    color:
      theme.colors.danger,
  },

  /* INITIAL LOADING */

  initialLoadingOverlay: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    zIndex: 100,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(250, 249, 247, 0.94)",
  },

  initialLoadingCard: {
    width: 270,

    alignItems: "center",

    paddingHorizontal: 22,
    paddingVertical: 22,

    borderRadius: 20,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor:
      theme.colors.border,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,

    elevation: 8,
  },

  initialLoadingIcon: {
    width: 48,
    height: 48,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 24,

    backgroundColor:
      theme.colors.dangerLight,
  },

  initialLoadingTitle: {
    marginTop: 13,

    fontSize: 14,
    lineHeight: 19,

    fontWeight: "900",

    color:
      theme.colors.text,
  },

  initialLoadingMessage: {
    marginTop: 5,

    maxWidth: 225,

    textAlign: "center",

    fontSize: 10,
    lineHeight: 14,

    fontWeight: "500",

    color:
      theme.colors.textSecondary,
  },

  pressed: {
    opacity: 0.72,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  emergencyPressed: {
    opacity: 0.72,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },
});