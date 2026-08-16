import React, {
  useCallback,
  useMemo,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import type {
  RootStackParamList,
} from "../navigation/AppNavigator";

import {
  useSafetyBubble,
} from "../modules/safety/hooks/useSafetyBubble";

import {
  getRoutes,
} from "../modules/route/services/routeService";

import {
  rankRoutes,
} from "../modules/route/services/routeRankingService";

import type {
  Coordinates,
} from "../modules/route/types";

import type {
  NearbyPlace,
  SafetyAnalysis,
} from "../modules/route/services/safetyTypes";

type SafetyBubbleRouteProp =
  RouteProp<
    RootStackParamList,
    "SafetyBubble"
  >;

type NavigationProp =
  NativeStackNavigationProp<
    RootStackParamList
  >;

const COLORS = {
  background: "#F7F5F2",
  surface: "#FFFFFF",
  surfaceMuted: "#FAF9F7",
  border: "#E9E5DF",

  primary: "#F97316",
  primarySoft: "#FFF7ED",

  safe: "#16A34A",
  safeSoft: "#F0FDF4",

  warning: "#D97706",
  warningSoft: "#FFFBEB",

  danger: "#DC2626",
  dangerSoft: "#FEF2F2",

  text: "#292524",
  secondary: "#57534E",
  muted: "#78716C",
  faint: "#A8A29E",
  white: "#FFFFFF",
} as const;

interface MetricDefinition {
  readonly key: keyof SafetyAnalysis;
  readonly label: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
}

const SAFETY_METRICS:
  readonly MetricDefinition[] = [
    {
      key: "policeAccess",
      label: "Police access",
      icon: "shield-checkmark-outline",
    },
    {
      key: "medicalAccess",
      label: "Medical access",
      icon: "medkit-outline",
    },
    {
      key: "activity",
      label: "Activity",
      icon: "people-outline",
    },
    {
      key: "emergencyAccess",
      label: "Emergency access",
      icon: "call-outline",
    },
    {
      key: "crimeExposure",
      label: "Historical crime",
      icon: "alert-circle-outline",
    },
    {
      key: "lighting",
      label: "Lighting",
      icon: "bulb-outline",
    },
  ];

function isValidCoordinates(
  value:
    | Coordinates
    | null
    | undefined,
): value is Coordinates {
  if (!value) {
    return false;
  }

  return (
    Number.isFinite(
      value.latitude,
    ) &&
    Number.isFinite(
      value.longitude,
    ) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

function formatDistance(
  value:
    | number
    | string
    | undefined,
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return "Unavailable";
  }

  if (
    typeof value ===
    "number"
  ) {
    if (!Number.isFinite(value)) {
      return "Unavailable";
    }

    return value >= 1000
      ? `${(
          value / 1000
        ).toFixed(1)} km`
      : `${Math.round(value)} m`;
  }

  return value;
}

function formatRouteDistance(
  meters: number,
): string {
  if (!Number.isFinite(meters)) {
    return "N/A";
  }

  return meters >= 1000
    ? `${(
        meters / 1000
      ).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

function formatDuration(
  seconds: number,
): string {
  if (!Number.isFinite(seconds)) {
    return "N/A";
  }

  const minutes = Math.round(
    seconds / 60,
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remainingMinutes =
    minutes % 60;

  return remainingMinutes === 0
    ? `${hours} hr`
    : `${hours} hr ${remainingMinutes} min`;
}

function getNumericSignal(
  value:
    | number
    | string
    | undefined,
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(100, value),
  );
}

function getSignalColor(
  value: number | null,
): string {
  if (value === null) {
    return COLORS.faint;
  }

  if (value >= 75) {
    return COLORS.safe;
  }

  if (value >= 50) {
    return COLORS.warning;
  }

  return COLORS.danger;
}

function getOverallScore(
  analysis:
    | SafetyAnalysis
    | undefined,
): {
  readonly score: number | null;
  readonly available: number;
} {
  if (!analysis) {
    return {
      score: null,
      available: 0,
    };
  }

  const values =
    SAFETY_METRICS
      .map(({ key }) =>
        getNumericSignal(
          analysis[key],
        ),
      )
      .filter(
        (
          value,
        ): value is number =>
          value !== null,
      );

  if (values.length === 0) {
    return {
      score: null,
      available: 0,
    };
  }

  const total =
    values.reduce(
      (
        sum,
        value,
      ) => sum + value,
      0,
    );

  return {
    score: Math.round(
      total /
        values.length,
    ),
    available:
      values.length,
  };
}

function getSafetyPresentation(
  score: number | null,
): {
  readonly title: string;
  readonly subtitle: string;
  readonly color: string;
  readonly softColor: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
} {
  if (score === null) {
    return {
      title: "Safety data unavailable",
      subtitle:
        "Verified safety signals are not available right now.",
      color: COLORS.warning,
      softColor:
        COLORS.warningSoft,
      icon: "shield-outline",
    };
  }

  if (score >= 80) {
    return {
      title: "You're in a safe area",
      subtitle:
        "No immediate safety concerns detected.",
      color: COLORS.safe,
      softColor:
        COLORS.safeSoft,
      icon: "shield-checkmark",
    };
  }

  if (score >= 60) {
    return {
      title: "Stay aware",
      subtitle:
        "Some safety signals need attention.",
      color: COLORS.warning,
      softColor:
        COLORS.warningSoft,
      icon: "shield-half-outline",
    };
  }

  return {
    title: "Use extra caution",
    subtitle:
      "Several safety signals need attention.",
    color: COLORS.danger,
    softColor:
      COLORS.dangerSoft,
    icon: "warning-outline",
  };
}

function findPolicePlace(
  places:
    readonly NearbyPlace[],
): NearbyPlace | null {
  return (
    places.find(
      (place) =>
        place.type
          .toLowerCase()
          .includes("police") ||
        place.name
          .toLowerCase()
          .includes("police"),
    ) ?? null
  );
}

function findMedicalPlace(
  places:
    readonly NearbyPlace[],
): NearbyPlace | null {
  return (
    places.find(
      (place) =>
        place.type ===
          "Medical" ||
        place.type ===
          "Pharmacy",
    ) ?? null
  );
}

export default function SafetyBubbleScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NavigationProp>();

  const route =
    useRoute<SafetyBubbleRouteProp>();

  const params =
    route.params ?? {};

  const selectedRoute =
    params.selectedRoute ??
    null;

  const destination =
    params.destination ??
    "";

  const currentLocation =
    params.currentLocation ??
    null;

  const {
    safetyResult,
    loading,
    error,
    refresh,
  } = useSafetyBubble({
    selectedRoute,
    currentLocation,
    destination,
  });

  const evidence =
    useMemo(
      () =>
        getOverallScore(
          safetyResult?.analysis,
        ),
      [safetyResult],
    );

  const safetyPresentation =
    useMemo(
      () =>
        getSafetyPresentation(
          evidence.score,
        ),
      [evidence.score],
    );

  const analysis =
    safetyResult?.analysis;

  const policePlace =
    useMemo(
      () =>
        findPolicePlace(
          safetyResult?.places ??
            [],
        ),
      [safetyResult],
    );

  const medicalPlace =
    useMemo(
      () =>
        findMedicalPlace(
          safetyResult?.places ??
            [],
        ),
      [safetyResult],
    );

  const handleBack =
    useCallback((): void => {
      if (
        navigation.canGoBack()
      ) {
        navigation.goBack();
        return;
      }

      navigation.navigate(
        "Main",
      );
    }, [navigation]);

  const handleDirections =
    useCallback(
      async (): Promise<void> => {
        if (
          !policePlace ||
          !isValidCoordinates(
            currentLocation,
          ) ||
          !isValidCoordinates(
            policePlace.coordinates,
          )
        ) {
          return;
        }

        try {
          const routeResults =
            await getRoutes(
              currentLocation,
              policePlace.coordinates,
            );

          const validRoutes =
            routeResults.filter(
              (routeItem) =>
                Array.isArray(
                  routeItem.coordinates,
                ) &&
                routeItem
                  .coordinates
                  .length > 0 &&
                Number.isFinite(
                  routeItem.distance,
                ) &&
                Number.isFinite(
                  routeItem.duration,
                ),
            );

          if (
            validRoutes.length === 0
          ) {
            return;
          }

          const priority =
            "balanced" as const;

          const rankedRoutes =
            rankRoutes(
              validRoutes,
              priority,
            );

          const bestRoute =
            rankedRoutes[0];

          if (!bestRoute) {
            return;
          }

          navigation.navigate(
            "RouteResults",
            {
              destination:
                policePlace.name,

              currentLocation,

              routes:
                rankedRoutes,

              selectedRouteId:
                bestRoute.id,

              priority,
            },
          );
        } catch {
          /*
           * Keep the demo screen stable.
           * No external maps application is opened.
           */
        }
      },
      [
        currentLocation,
        navigation,
        policePlace,
      ],
    );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.loadingScreen}
        >
          <View
            style={styles.loadingCard}
          >
            <View
              style={styles.loadingIcon}
            >
              <Ionicons
                name="shield-checkmark"
                size={28}
                color={COLORS.primary}
              />
            </View>

            <ActivityIndicator
              size="small"
              color={COLORS.primary}
            />

            <Text
              style={styles.loadingTitle}
            >
              Preparing your safety view
            </Text>

            <Text
              style={styles.loadingText}
            >
              Loading verified safety information...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* HEADER */}

      <View
        style={styles.header}
      >
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={({ pressed }) => [
            styles.headerButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={21}
            color={COLORS.text}
          />
        </Pressable>

        <View
          style={styles.headerCenter}
        >
          <Text
            style={styles.headerEyebrow}
          >
            SAFEHERAI
          </Text>

          <Text
            style={styles.headerTitle}
          >
            Safety Bubble
          </Text>
        </View>

        <Pressable
          onPress={refresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh safety information"
          hitSlop={8}
          style={({ pressed }) => [
            styles.headerButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="refresh-outline"
            size={19}
            color={COLORS.text}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO */}

        <View
          style={[
            styles.heroCard,
            {
              borderColor:
                `${safetyPresentation.color}28`,
            },
          ]}
        >
          <View
            style={styles.heroTopRow}
          >
            <View
              style={[
                styles.heroIcon,
                {
                  backgroundColor:
                    safetyPresentation.softColor,
                },
              ]}
            >
              <Ionicons
                name={
                  safetyPresentation.icon
                }
                size={25}
                color={
                  safetyPresentation.color
                }
              />
            </View>

            <View
              style={styles.livePill}
            >
              <View
                style={[
                  styles.liveDot,
                  {
                    backgroundColor:
                      safetyPresentation.color,
                  },
                ]}
              />

              <Text
                style={styles.liveText}
              >
                DEMO
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.heroStatus,
              {
                color:
                  safetyPresentation.color,
              },
            ]}
          >
            CURRENT SAFETY
          </Text>

          <Text
            style={styles.heroTitle}
          >
            {safetyPresentation.title}
          </Text>

          <Text
            style={styles.heroSubtitle}
          >
            {safetyPresentation.subtitle}
          </Text>

          <View
            style={styles.scoreRow}
          >
            <View
              style={styles.scoreCircle}
            >
              <Text
                style={[
                  styles.scoreNumber,
                  {
                    color:
                      safetyPresentation.color,
                  },
                ]}
              >
                {evidence.score !==
                null
                  ? evidence.score
                  : "--"}
              </Text>

              <Text
                style={
                  styles.scoreDenominator
                }
              >
                /100
              </Text>
            </View>

            <View
              style={styles.scoreInfo}
            >
              <Text
                style={styles.scoreLabel}
              >
                Safety evidence
              </Text>

              <Text
                style={
                  styles.scoreDescription
                }
              >
                {evidence.available} of{" "}
                {SAFETY_METRICS.length}{" "}
                demo signals available.
              </Text>
            </View>
          </View>
        </View>

        {/* SIGNALS */}

        <SectionHeader
          title="Safety signals"
          subtitle="Signals used by the Safety Bubble"
          icon="pulse-outline"
        />

        <View
          style={styles.signalGrid}
        >
          {SAFETY_METRICS.map(
            (metric) => {
              const numericValue =
                getNumericSignal(
                  analysis?.[
                    metric.key
                  ],
                );

              const signalColor =
                getSignalColor(
                  numericValue,
                );

              const signalBackground =
                numericValue ===
                null
                  ? "#F5F5F4"
                  : numericValue >=
                      75
                    ? COLORS.safeSoft
                    : numericValue >=
                        50
                      ? COLORS.warningSoft
                      : COLORS.dangerSoft;

              return (
                <View
                  key={
                    metric.key
                  }
                  style={
                    styles.signalCard
                  }
                >
                  <View
                    style={[
                      styles.signalIcon,
                      {
                        backgroundColor:
                          signalBackground,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        metric.icon
                      }
                      size={16}
                      color={
                        signalColor
                      }
                    />
                  </View>

                  <Text
                    numberOfLines={
                      1
                    }
                    style={
                      styles.signalLabel
                    }
                  >
                    {metric.label}
                  </Text>

                  <Text
                    style={[
                      styles.signalValue,
                      {
                        color:
                          signalColor,
                      },
                    ]}
                  >
                    {numericValue ===
                    null
                      ? "N/A"
                      : `${Math.round(
                          numericValue,
                        )}/100`}
                  </Text>
                </View>
              );
            },
          )}
        </View>

        {/* POLICE */}

        <SectionHeader
          title="Nearby protection"
          subtitle="Emergency support available in this demo"
          icon="location-outline"
        />

        <View
          style={styles.protectionCard}
        >
          <View
            style={
              styles.protectionHeader
            }
          >
            <View
              style={
                styles.protectionIcon
              }
            >
              <Ionicons
                name="shield"
                size={22}
                color={
                  COLORS.primary
                }
              />
            </View>

            <View
              style={
                styles.protectionMain
              }
            >
              <Text
                style={
                  styles.protectionEyebrow
                }
              >
                POLICE
              </Text>

              <Text
                numberOfLines={2}
                style={
                  styles.protectionName
                }
              >
                {policePlace?.name ??
                  "Gandhimanagar Police Station"}
              </Text>

              <View
                style={
                  styles.distanceRow
                }
              >
                <Ionicons
                  name="navigate-outline"
                  size={13}
                  color={
                    COLORS.muted
                  }
                />

                <Text
                  style={
                    styles.distanceText
                  }
                >
                  {policePlace
                    ? formatDistance(
                        policePlace.distance,
                      )
                    : "1.2 km"}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={
              styles.addressRow
            }
          >
            <Ionicons
              name="location-outline"
              size={14}
              color={
                COLORS.faint
              }
            />

            <Text
              numberOfLines={2}
              style={
                styles.addressText
              }
            >
              {policePlace?.name ??
                "Gandhimanagar, Coimbatore, Tamil Nadu"}
            </Text>
          </View>

          <Pressable
            disabled={
              !policePlace ||
              !isValidCoordinates(
                currentLocation,
              )
            }
            onPress={
              handleDirections
            }
            accessibilityRole="button"
            accessibilityLabel="Get directions to nearby police"
            style={({
              pressed,
            }) => [
              styles.directionButton,
              pressed &&
                styles.pressed,
              (!policePlace ||
                !isValidCoordinates(
                  currentLocation,
                )) &&
                styles.disabledButton,
            ]}
          >
            <Ionicons
              name="navigate-outline"
              size={17}
              color={
                policePlace &&
                isValidCoordinates(
                  currentLocation,
                )
                  ? COLORS.white
                  : COLORS.faint
              }
            />

            <Text
              style={[
                styles.directionText,
                (!policePlace ||
                  !isValidCoordinates(
                    currentLocation,
                  )) &&
                  styles.disabledText,
              ]}
            >
              Get directions
            </Text>
          </Pressable>
        </View>

        {/* MEDICAL */}

        <View
          style={
            styles.medicalCard
          }
        >
          <View
            style={
              styles.medicalHeader
            }
          >
            <View
              style={
                styles.medicalIcon
              }
            >
              <Ionicons
                name="medkit"
                size={21}
                color="#2563EB"
              />
            </View>

            <View
              style={
                styles.protectionMain
            }>
              <Text
                style={
                  styles.protectionEyebrow
                }
              >
                MEDICAL
              </Text>

              <Text
                numberOfLines={2}
                style={
                  styles.protectionName
                }
              >
                {medicalPlace?.name ??
                  "Coimbatore Medical Centre"}
              </Text>

              <View
                style={
                  styles.distanceRow
                }
              >
                <Ionicons
                  name="navigate-outline"
                  size={13}
                  color={
                    COLORS.muted
                  }
                />

                <Text
                  style={
                    styles.distanceText
                  }
                >
                  {medicalPlace
                    ? formatDistance(
                        medicalPlace.distance,
                      )
                    : "1.6 km"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CONTEXT */}

        <SectionHeader
          title="Current context"
          subtitle="What this safety view is showing"
          icon="information-circle-outline"
        />

        <View
          style={
            styles.contextCard
          }
        >
          <ContextRow
            icon="shield-checkmark-outline"
            label="Mode"
            value={
              selectedRoute
                ? "Route safety"
                : "Area safety"
            }
          />

          <ContextDivider />

          <ContextRow
            icon="location-outline"
            label="Destination"
            value={
              destination.trim() ||
              "Current location"
            }
          />

          {selectedRoute ? (
            <>
              <ContextDivider />

              <ContextRow
                icon="map-outline"
                label="Distance"
                value={formatRouteDistance(
                  selectedRoute.distance,
                )}
              />

              <ContextDivider />

              <ContextRow
                icon="time-outline"
                label="Travel time"
                value={formatDuration(
                  selectedRoute.duration,
                )}
              />
            </>
          ) : null}
        </View>

        {error ? (
          <NoticeCard
            icon="information-circle-outline"
            text={error}
          />
        ) : null}

        <View
          style={styles.demoNote}
        >
          <Ionicons
            name="sparkles-outline"
            size={16}
            color={
              COLORS.primary
            }
          />

          <Text
            style={styles.demoNoteText}
          >
            Hackathon demo mode •
            Safety values are controlled
            presentation data, while
            directions continue through
            the app's own route flow.
          </Text>
        </View>

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
}): React.JSX.Element {
  return (
    <View
      style={styles.sectionHeader}
    >
      <View
        style={styles.sectionText}
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.sectionSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>

      <View
        style={
          styles.sectionBadge
        }
      >
        <Ionicons
          name={icon}
          size={15}
          color={
            COLORS.primary
          }
        />
      </View>
    </View>
  );
}

function ContextRow({
  icon,
  label,
  value,
}: {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly label: string;
  readonly value: string;
}): React.JSX.Element {
  return (
    <View
      style={styles.contextItem}
    >
      <Ionicons
        name={icon}
        size={17}
        color={
          COLORS.primary
        }
      />

      <View
        style={
          styles.contextContent
        }
      >
        <Text
          style={
            styles.contextTitle
          }
        >
          {label}
        </Text>

        <Text
          numberOfLines={1}
          style={
            styles.contextValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function ContextDivider(): React.JSX.Element {
  return (
    <View
      style={
        styles.contextDivider
      }
    />
  );
}

function NoticeCard({
  icon,
  text,
}: {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly text: string;
}): React.JSX.Element {
  return (
    <View
      style={styles.noticeCard}
    >
      <Ionicons
        name={icon}
        size={18}
        color={
          COLORS.warning
        }
      />

      <Text
        style={styles.noticeText}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor:
      COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor:
      COLORS.surfaceMuted,
  },

  headerCenter: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },

  headerEyebrow: {
    fontSize: 6.5,
    lineHeight: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.faint,
  },

  headerTitle: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    color: COLORS.text,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 150,
  },

  heroCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  heroIcon: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor:
      COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  liveDot: {
    width: 6,
    height: 6,
    marginRight: 5,
    borderRadius: 3,
  },

  liveText: {
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: COLORS.muted,
  },

  heroStatus: {
    marginTop: 14,
    fontSize: 7,
    lineHeight: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  heroTitle: {
    marginTop: 4,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
    color: COLORS.text,
  },

  heroSubtitle: {
    maxWidth: 300,
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  scoreCircle: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 41,
    backgroundColor:
      COLORS.surfaceMuted,
    borderWidth: 5,
    borderColor:
      COLORS.primarySoft,
  },

  scoreNumber: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
  },

  scoreDenominator: {
    marginTop: -1,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "700",
    color: COLORS.faint,
  },

  scoreInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },

  scoreLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
    color: COLORS.text,
  },

  scoreDescription: {
    marginTop: 4,
    fontSize: 9,
    lineHeight: 14,
    color: COLORS.muted,
  },

  sectionHeader: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  sectionText: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 0.45,
    textTransform: "uppercase",
    color: COLORS.muted,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 8.5,
    lineHeight: 13,
    color: COLORS.faint,
  },

  sectionBadge: {
    width: 32,
    height: 32,
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor:
      COLORS.primarySoft,
  },

  signalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent:
      "space-between",
    marginTop: 10,
    rowGap: 9,
  },

  signalCard: {
    width: "48.5%",
    minHeight: 88,
    padding: 11,
    borderRadius: 17,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  signalIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  signalLabel: {
    marginTop: 9,
    fontSize: 8,
    fontWeight: "700",
    color: COLORS.muted,
  },

  signalValue: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "900",
  },

  protectionCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      "#F3DEC8",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  medicalCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      "#BFDBFE",
  },

  protectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  medicalHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  protectionIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor:
      COLORS.primarySoft,
  },

  medicalIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor:
      "#DBEAFE",
  },

  protectionMain: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  protectionEyebrow: {
    fontSize: 6.5,
    lineHeight: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: COLORS.faint,
  },

  protectionName: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: COLORS.text,
  },

  distanceRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  distanceText: {
    marginLeft: 4,
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: "700",
    color: COLORS.muted,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor:
      "#F0EEEA",
  },

  addressText: {
    flex: 1,
    marginLeft: 5,
    fontSize: 8,
    lineHeight: 12,
    color: COLORS.faint,
  },

  directionButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderRadius: 13,
    backgroundColor:
      COLORS.primary,
  },

  directionText: {
    marginLeft: 6,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "900",
    color: COLORS.white,
  },

  disabledButton: {
    opacity: 0.5,
  },

  disabledText: {
    color: COLORS.faint,
  },

  contextCard: {
    marginTop: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  contextItem: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
  },

  contextContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  contextTitle: {
    fontSize: 8,
    color: COLORS.faint,
  },

  contextValue: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.text,
  },

  contextDivider: {
    height: 1,
    backgroundColor:
      "#F0EEEA",
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 11,
    borderRadius: 14,
    backgroundColor:
      COLORS.warningSoft,
    borderWidth: 1,
    borderColor:
      "#FDE68A",
  },

  noticeText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 8.5,
    lineHeight: 12,
    color: COLORS.secondary,
  },

  demoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    padding: 11,
    borderRadius: 14,
    backgroundColor:
      COLORS.primarySoft,
    borderWidth: 1,
    borderColor:
      "#FED7AA",
  },

  demoNoteText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 8,
    lineHeight: 12,
    color: COLORS.secondary,
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  loadingCard: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 22,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 5,
  },

  loadingIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor:
      COLORS.primarySoft,
  },

  loadingTitle: {
    marginTop: 11,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },

  loadingText: {
    maxWidth: 280,
    marginTop: 5,
    fontSize: 9.5,
    lineHeight: 14,
    color: COLORS.muted,
    textAlign: "center",
  },

  bottomSpace: {
    height: 30,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
});