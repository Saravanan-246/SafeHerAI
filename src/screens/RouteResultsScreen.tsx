import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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

import {
  RouteOptionList,
  RoutePrioritySelector,
  RouteResultsHeader,
  RouteStartButton,
  SafetyBubbleEntry,
} from "../modules/route";

import type {
  Route,
  RoutePriority,
} from "../modules/route/types";

import type {
  RootStackParamList,
} from "../navigation/AppNavigator";

type RouteResultsRouteProp =
  RouteProp<
    RootStackParamList,
    "RouteResults"
  >;

type NavigationProp =
  NativeStackNavigationProp<
    RootStackParamList
  >;

const DEFAULT_PRIORITY: RoutePriority =
  "balanced";

function formatDistance(
  meters: number,
): string {
  if (
    !Number.isFinite(meters) ||
    meters < 0
  ) {
    return "--";
  }

  if (meters < 1_000) {
    return `${Math.round(meters)} m`;
  }

  return `${(
    meters / 1_000
  ).toFixed(1)} km`;
}

function formatDuration(
  seconds: number,
): string {
  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return "--";
  }

  const minutes = Math.max(
    1,
    Math.round(seconds / 60),
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours =
    Math.floor(minutes / 60);

  const remainingMinutes =
    minutes % 60;

  return remainingMinutes > 0
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
}

export default function RouteResultsScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NavigationProp>();

  const route =
    useRoute<RouteResultsRouteProp>();

  const {
    destination,
    currentLocation,
    routes = [],
    selectedRouteId:
      initialSelectedRouteId,
    priority:
      initialPriority,
  } = route.params;

  const [
    selectedRouteId,
    setSelectedRouteId,
  ] = useState<string | null>(
    initialSelectedRouteId ??
      routes[0]?.id ??
      null,
  );

  const [
    priority,
    setPriority,
  ] = useState<RoutePriority>(
    initialPriority ??
      DEFAULT_PRIORITY,
  );

  const selectedRoute =
    useMemo<Route | null>(
      () =>
        routes.find(
          (item) =>
            item.id ===
            selectedRouteId,
        ) ??
        routes[0] ??
        null,
      [
        routes,
        selectedRouteId,
      ],
    );

  const otherRoutes =
    useMemo<Route[]>(
      () =>
        routes.filter(
          (item) =>
            item.id !==
            selectedRoute?.id,
        ),
      [
        routes,
        selectedRoute?.id,
      ],
    );

  const handleSelectRoute =
    useCallback(
      (routeId: string): void => {
        const exists =
          routes.some(
            (item) =>
              item.id ===
              routeId,
          );

        if (!exists) {
          return;
        }

        setSelectedRouteId(
          routeId,
        );
      },
      [routes],
    );

  const handlePriorityChange =
    useCallback(
      (
        nextPriority: RoutePriority,
      ): void => {
        setPriority(
          nextPriority,
        );
      },
      [],
    );

  const handleStartRoute =
    useCallback((): void => {
      if (!selectedRoute) {
        return;
      }

      navigation.navigate(
        "Navigation",
        {
          destination,
          selectedRoute,
          currentLocation,
        },
      );
    }, [
      currentLocation,
      destination,
      navigation,
      selectedRoute,
    ]);

  const handleSafetyBubble =
    useCallback((): void => {
      navigation.navigate(
        "SafetyBubble",
        {
          selectedRoute:
            selectedRoute ??
            undefined,
          destination,
          currentLocation,
        },
      );
    }, [
      currentLocation,
      destination,
      navigation,
      selectedRoute,
    ]);

  const handleOpenSOS =
    useCallback((): void => {
      navigation.navigate("SOS");
    }, [navigation]);

  const handleGoBack =
    useCallback((): void => {
      navigation.goBack();
    }, [navigation]);

  if (routes.length === 0) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.emptyScreen}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleGoBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={19}
              color="#292524"
            />
          </TouchableOpacity>

          <View
            style={styles.emptyCard}
          >
            <View
              style={styles.emptyIcon}
            >
              <Ionicons
                name="navigate-outline"
                size={22}
                color="#F97316"
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              No route found
            </Text>

            <Text
              style={styles.emptyMessage}
            >
              We couldn't find a route to{" "}
              {destination ||
                "this destination"}.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGoBack}
              style={
                styles.backAction
              }
              accessibilityRole="button"
              accessibilityLabel="Back to search"
            >
              <Text
                style={
                  styles.backActionText
                }
              >
                Back to search
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleGoBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={19}
            color="#292524"
          />
        </TouchableOpacity>

        <View
          style={styles.topTitleBlock}
        >
          <Text
            style={styles.topEyebrow}
          >
            ROUTE PLANNER
          </Text>

          <Text
            style={styles.topTitle}
          >
            Choose your route
          </Text>
        </View>

        <View
          style={styles.topRightActions}
        >
          <View
            style={styles.routeCount}
          >
            <Text
              style={
                styles.routeCountText
              }
            >
              {routes.length}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={
              handleOpenSOS
            }
            style={styles.sosButton}
            accessibilityRole="button"
            accessibilityLabel="Emergency SOS"
          >
            <Ionicons
              name="alert-circle"
              size={15}
              color="#DC2626"
            />

            <Text
              style={
                styles.sosButtonText
              }
            >
              SOS
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        <RouteResultsHeader
          destination={destination}
          routeCount={routes.length}
        />

        <View
          style={
            styles.preferenceBlock
          }
        >
          <Text
            style={
              styles.preferenceLabel
            }
          >
            ROUTE PREFERENCE
          </Text>

          <RoutePrioritySelector
            priority={priority}
            onChange={
              handlePriorityChange
            }
          />
        </View>

        {selectedRoute && (
          <TouchableOpacity
            activeOpacity={0.96}
            onPress={() =>
              handleSelectRoute(
                selectedRoute.id,
              )
            }
            style={styles.focusBlock}
            accessibilityRole="radio"
            accessibilityState={{
              selected: true,
            }}
            accessibilityLabel={
              `Selected route, ${formatDuration(
                selectedRoute.duration,
              )}, ${formatDistance(
                selectedRoute.distance,
              )}`
            }
          >
            <View
              style={styles.focusHeader}
            >
              <View
                style={
                  styles.focusTitleBlock
                }
              >
                <Text
                  style={
                    styles.focusEyebrow
                  }
                >
                  {selectedRoute.recommended
                    ? "RECOMMENDED"
                    : "SELECTED ROUTE"}
                </Text>

                <Text
                  style={styles.focusTitle}
                >
                  {formatDuration(
                    selectedRoute.duration,
                  )}
                </Text>

                <Text
                  style={styles.focusSubtext}
                >
                  {formatDistance(
                    selectedRoute.distance,
                  )}
                </Text>
              </View>

              <View
                style={styles.focusCheck}
              >
                <Ionicons
                  name="checkmark"
                  size={18}
                  color="#FFFFFF"
                />
              </View>
            </View>

            <View
              style={styles.focusMeta}
            >
              <View
                style={styles.metaItem}
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color="#78716C"
                />

                <Text
                  style={styles.metaText}
                >
                  {formatDuration(
                    selectedRoute.duration,
                  )}
                </Text>
              </View>

              <View
                style={styles.metaItem}
              >
                <Ionicons
                  name="navigate-outline"
                  size={14}
                  color="#78716C"
                />

                <Text
                  style={styles.metaText}
                >
                  {formatDistance(
                    selectedRoute.distance,
                  )}
                </Text>
              </View>

              {selectedRoute.safetyScore !==
                undefined && (
                <View
                  style={styles.metaItem}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={14}
                    color="#16A34A"
                  />

                  <Text
                    style={
                      styles.safetyText
                    }
                  >
                    Safety{" "}
                    {Math.round(
                      selectedRoute.safetyScore,
                    )}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}

        {otherRoutes.length > 0 && (
          <View
            style={styles.otherSection}
          >
            <View
              style={styles.sectionHeader}
            >
              <Text
                style={styles.sectionTitle}
              >
                Other available routes
              </Text>

              <Text
                style={styles.sectionMeta}
              >
                {otherRoutes.length}
              </Text>
            </View>

            <RouteOptionList
              routes={otherRoutes}
              selectedRouteId={
                selectedRouteId ?? ""
              }
              onSelectRoute={
                handleSelectRoute
              }
            />
          </View>
        )}

        <View
          style={styles.safetySection}
        >
          <SafetyBubbleEntry
            onPress={
              handleSafetyBubble
            }
          />
        </View>

        <View
          style={styles.startSection}
        >
          <RouteStartButton
            duration={
              selectedRoute
                ? formatDuration(
                    selectedRoute.duration,
                  )
                : undefined
            }
            distance={
              selectedRoute
                ? formatDistance(
                    selectedRoute.distance,
                  )
                : undefined
            }
            onPress={
              handleStartRoute
            }
            disabled={
              selectedRoute === null
            }
          />
        </View>

        <Text
          style={styles.disclaimer}
        >
          Route information is based on
          available mapping data. Safety
          information should support your
          judgement, not replace it.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F7",
  },

  topBar: {
    minHeight: 62,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1ECE7",
    backgroundColor: "#FAF9F7",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE8E2",
  },

  topTitleBlock: {
    flex: 1,
    marginLeft: 11,
  },

  topEyebrow: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.9,
    color: "#A8A29E",
  },

  topTitle: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "800",
    color: "#292524",
  },

  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  routeCount: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
  },

  routeCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EA580C",
  },

  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 9,
    height: 30,
    borderRadius: 11,
    gap: 4,
  },

  sosButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 30,
  },

  preferenceBlock: {
    marginTop: 2,
  },

  preferenceLabel: {
    marginBottom: 7,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#A8A29E",
  },

  focusBlock: {
    marginTop: 4,
    padding: 17,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#F97316",
    shadowColor: "#F97316",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  focusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  focusTitleBlock: {
    flex: 1,
  },

  focusEyebrow: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#EA580C",
  },

  focusTitle: {
    marginTop: 3,
    fontSize: 28,
    fontWeight: "800",
    color: "#292524",
  },

  focusSubtext: {
    marginTop: 1,
    fontSize: 10,
    color: "#78716C",
  },

  focusCheck: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F97316",
  },

  focusMeta: {
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#F1ECE7",
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 2,
  },

  metaText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: "600",
    color: "#78716C",
  },

  safetyText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: "700",
    color: "#16A34A",
  },

  otherSection: {
    marginTop: 20,
  },

  sectionHeader: {
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#57534E",
  },

  sectionMeta: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 8,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 9,
    fontWeight: "800",
    color: "#EA580C",
    backgroundColor: "#FFF7ED",
    overflow: "hidden",
  },

  safetySection: {
    marginTop: 16,
  },

  startSection: {
    marginTop: 12,
  },

  disclaimer: {
    marginTop: 12,
    paddingHorizontal: 5,
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
    color: "#A8A29E",
  },

  emptyScreen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
  },

  emptyCard: {
    marginTop: 90,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 22,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE8E2",
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#292524",
  },

  emptyMessage: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    color: "#A8A29E",
  },

  backAction: {
    marginTop: 17,
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F97316",
  },

  backActionText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});