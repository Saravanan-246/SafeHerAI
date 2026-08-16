import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  NavigationContainer,
} from "@react-navigation/native";
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import RouteScreen from "../screens/RouteScreen";
import RouteResultsScreen from "../screens/RouteResultsScreen";
import NavigationScreen from "../screens/NavigationScreen";
import AlertsScreen from "../screens/AlertsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SOSScreen from "../screens/SOSScreen";
import SafetyBubbleScreen from "../screens/SafetyBubbleScreen";

import type {
  Coordinates,
  Route,
  RoutePriority,
} from "../modules/route/types";

/* -------------------------------------------------------------------------- */
/* Navigation Types                                                           */
/* -------------------------------------------------------------------------- */

export type MainTabParamList = {
  Home: undefined;
  Route: undefined;
  SafetyBubble: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: undefined;

  RouteResults: {
    destination: string;
    currentLocation: Coordinates;
    routes: Route[];
    selectedRouteId: string | null;
    priority: RoutePriority;
  };

  Navigation: {
    destination: string;
    selectedRoute: Route;
    currentLocation: Coordinates;
  };

  SOS: undefined;

  SafetyBubble: {
    destination?: string;
    selectedRoute?: Route;
    currentLocation?: Coordinates;
  };
};

/* -------------------------------------------------------------------------- */
/* Navigators                                                                 */
/* -------------------------------------------------------------------------- */

const Tab =
  createBottomTabNavigator<MainTabParamList>();

const Stack =
  createNativeStackNavigator<RootStackParamList>();

/* -------------------------------------------------------------------------- */
/* Tab Configuration                                                          */
/* -------------------------------------------------------------------------- */

type TabIconName =
  | "home"
  | "navigate"
  | "shield-checkmark"
  | "notifications"
  | "person";

interface TabConfig {
  readonly icon: TabIconName;
  readonly label: string;
}

const TAB_CONFIG: Record<
  keyof MainTabParamList,
  TabConfig
> = {
  Home: {
    icon: "home",
    label: "Home",
  },

  Route: {
    icon: "navigate",
    label: "Route",
  },

  SafetyBubble: {
    icon: "shield-checkmark",
    label: "Safety",
  },

  Alerts: {
    icon: "notifications",
    label: "Alerts",
  },

  Profile: {
    icon: "person",
    label: "Profile",
  },
};

/* -------------------------------------------------------------------------- */
/* Floating Bottom Navigation                                                 */
/* -------------------------------------------------------------------------- */

function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  return (
    <View
      pointerEvents="box-none"
      style={styles.tabBarContainer}
    >
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const routeName =
            route.name as keyof MainTabParamList;

          const config =
            TAB_CONFIG[routeName];

          const isFocused =
            state.index === index;

          const descriptor =
            descriptors[route.key];

          const options =
            descriptor.options;

          const label =
            typeof options.tabBarLabel ===
            "string"
              ? options.tabBarLabel
              : config.label;

          const accessibilityLabel =
            options.tabBarAccessibilityLabel ??
            `${label} tab`;

          const isSafety =
            routeName === "SafetyBubble";

          const iconColor = isFocused
            ? isSafety
              ? COLORS.safety
              : COLORS.primary
            : COLORS.inactive;

          const handlePress = (): void => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (
              !isFocused &&
              !event.defaultPrevented
            ) {
              navigation.navigate(
                route.name,
                route.params,
              );
            }
          };

          const handleLongPress = (): void => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              onPress={handlePress}
              onLongPress={handleLongPress}
              accessibilityRole="tab"
              accessibilityLabel={
                accessibilityLabel
              }
              accessibilityState={{
                selected: isFocused,
              }}
              style={({ pressed }) => [
                styles.tabItem,
                pressed &&
                  styles.tabPressed,
              ]}
            >
              <View
                style={[
                  styles.tabContent,
                  isFocused &&
                    styles.activeTabContent,
                  isFocused &&
                    isSafety &&
                    styles.activeSafetyContent,
                ]}
              >
                <Ionicons
                  name={config.icon}
                  size={isFocused ? 21 : 20}
                  color={iconColor}
                />

                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    isFocused &&
                      styles.activeTabLabel,
                    isFocused &&
                      isSafety &&
                      styles.activeSafetyLabel,
                  ]}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Tabs                                                                  */
/* -------------------------------------------------------------------------- */

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      tabBar={(props) => (
        <FloatingTabBar {...props} />
      )}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: {
          backgroundColor:
            COLORS.background,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
        }}
      />

      <Tab.Screen
        name="Route"
        component={RouteScreen}
        options={{
          tabBarLabel: "Route",
        }}
      />

      <Tab.Screen
        name="SafetyBubble"
        component={SafetyBubbleScreen}
        options={{
          tabBarLabel: "Safety",
        }}
      />

      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarLabel: "Alerts",
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}

/* -------------------------------------------------------------------------- */
/* Root Navigator                                                             */
/* -------------------------------------------------------------------------- */

export default function AppNavigator(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor:
              COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
        />

        <Stack.Screen
          name="RouteResults"
          component={RouteResultsScreen}
          options={{
            animation: "slide_from_right",
          }}
        />

        <Stack.Screen
          name="Navigation"
          component={NavigationScreen}
          options={{
            animation: "fade",
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="SOS"
          component={SOSScreen}
          options={{
            animation: "fade",
          }}
        />

        <Stack.Screen
          name="SafetyBubble"
          component={SafetyBubbleScreen}
          options={{
            animation:
              "slide_from_bottom",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* -------------------------------------------------------------------------- */
/* Colors                                                                     */
/* -------------------------------------------------------------------------- */

const COLORS = {
  background: "#FAF9F7",
  surface: "rgba(255, 255, 255, 0.98)",
  border: "#ECE8E3",

  primary: "#F97316",
  safety: "#15803D",

  text: "#292524",
  inactive: "#A8A29E",
} as const;

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    paddingHorizontal: 14,

    paddingBottom:
      Platform.OS === "ios"
        ? 11
        : 9,
  },

  tabBar: {
    height: 66,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 4,

    borderRadius: 22,

    backgroundColor: COLORS.surface,

    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,

    elevation: 9,
  },

  tabItem: {
    flex: 1,
    height: 58,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 17,
  },

  tabPressed: {
    opacity: 0.65,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  tabContent: {
    minWidth: 54,
    height: 44,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 8,

    borderRadius: 14,
  },

  activeTabContent: {
    backgroundColor: "#FFF7ED",
  },

  activeSafetyContent: {
    backgroundColor: "#F0FDF4",
  },

  tabLabel: {
    marginTop: 3,

    fontSize: 8.5,
    lineHeight: 11,

    fontWeight: "600",

    color: COLORS.inactive,
  },

  activeTabLabel: {
    fontWeight: "800",
    color: COLORS.primary,
  },

  activeSafetyLabel: {
    color: COLORS.safety,
  },
});