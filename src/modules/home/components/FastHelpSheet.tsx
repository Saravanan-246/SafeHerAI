import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../../../theme/theme";

export type FastHelpType =
  | "police"
  | "medical";

interface FastHelpSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onPolicePress: () => void;
  readonly onMedicalPress: () => void;
  readonly loading?: boolean;
  readonly selectedType?: FastHelpType | null;
  readonly error?: string | null;
}

export default function FastHelpSheet({
  visible,
  onClose,
  onPolicePress,
  onMedicalPress,
  loading = false,
  selectedType = null,
  error = null,
}: FastHelpSheetProps): React.JSX.Element {
  /*
   * IMPORTANT:
   *
   * Do not depend on selectedType for loading.
   * The parent may provide loading=true before
   * selectedType is available.
   */
  const isLoading = loading;

  const handlePolicePress = (): void => {
    if (isLoading) {
      return;
    }

    onPolicePress();
  };

  const handleMedicalPress = (): void => {
    if (isLoading) {
      return;
    }

    onMedicalPress();
  };

  /*
   * X must always work.
   */
  const handleClose = (): void => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityLabel="Close fast help"
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name={
                  isLoading
                    ? "navigate"
                    : error
                      ? "warning-outline"
                      : "flash"
                }
                size={20}
                color={
                  error
                    ? theme.colors.danger
                    : theme.colors.danger
                }
              />
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {isLoading
                  ? "Finding help"
                  : error
                    ? "Fast Help"
                    : "Fast Help"}
              </Text>

              <Text style={styles.subtitle}>
                {error
                  ? "We couldn't complete the request"
                  : getSubtitle(
                      selectedType,
                      isLoading,
                    )}
              </Text>
            </View>

            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close Fast Help"
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="close"
                size={20}
                color={
                  theme.colors.textSecondary
                }
              />
            </Pressable>
          </View>

          {/* ERROR */}

          {error ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color={
                    theme.colors.danger
                  }
                />
              </View>

              <Text style={styles.errorTitle}>
                Unable to find help
              </Text>

              <Text
                style={styles.errorMessage}
              >
                {error}
              </Text>

              <Text
                style={styles.errorHint}
              >
                Close this panel and try again.
              </Text>
            </View>
          ) : isLoading ? (
            /* LOADING */

            <View
              style={styles.loadingContainer}
            >
              <View
                style={[
                  styles.loadingIcon,
                  selectedType ===
                    "medical" &&
                    styles.loadingIconMedical,
                ]}
              >
                <ActivityIndicator
                  size="large"
                  color={
                    selectedType ===
                    "medical"
                      ? "#2563EB"
                      : theme.colors.danger
                  }
                />
              </View>

              <Text
                style={
                  styles.loadingTitle
                }
              >
                {getLoadingTitle(
                  selectedType,
                )}
              </Text>

              <Text
                style={
                  styles.loadingMessage
                }
              >
                {getLoadingMessage(
                  selectedType,
                )}
              </Text>

              <View
                style={
                  styles.progressArea
                }
              >
                <LoadingProgressRow
                  icon="location"
                  text="Using your current location"
                  active
                />

                <LoadingProgressRow
                  icon="search"
                  text={
                    selectedType ===
                    "medical"
                      ? "Finding nearby medical help"
                      : selectedType ===
                          "police"
                        ? "Finding nearby police"
                        : "Finding emergency help"
                  }
                  active
                />

                <LoadingProgressRow
                  icon="navigate"
                  text="Calculating fastest route"
                  active={false}
                />
              </View>
            </View>
          ) : (
            /* OPTIONS */

            <>
              <View style={styles.options}>
                {/* POLICE */}

                <Pressable
                  onPress={
                    handlePolicePress
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Find nearest police station"
                  style={({ pressed }) => [
                    styles.option,
                    styles.policeOption,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      styles.policeIcon,
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={24}
                      color={
                        theme.colors.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.optionContent
                    }
                  >
                    <Text
                      style={
                        styles.optionTitle
                      }
                    >
                      Police
                    </Text>

                    <Text
                      style={
                        styles.optionDescription
                      }
                    >
                      Find the nearest police
                      station and route there
                    </Text>
                  </View>

                  <View
                    style={
                      styles.arrowButton
                    }
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={
                        theme.colors.primary
                      }
                    />
                  </View>
                </Pressable>

                {/* MEDICAL */}

                <Pressable
                  onPress={
                    handleMedicalPress
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Find nearest medical facility"
                  style={({ pressed }) => [
                    styles.option,
                    styles.medicalOption,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      styles.medicalIcon,
                    ]}
                  >
                    <Ionicons
                      name="medkit"
                      size={24}
                      color="#2563EB"
                    />
                  </View>

                  <View
                    style={
                      styles.optionContent
                    }
                  >
                    <Text
                      style={
                        styles.optionTitle
                      }
                    >
                      Medical
                    </Text>

                    <Text
                      style={
                        styles.optionDescription
                      }
                    >
                      Find the nearest hospital
                      or medical facility
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.arrowButton,
                      styles.medicalArrow,
                    ]}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#2563EB"
                    />
                  </View>
                </Pressable>
              </View>

              {/* INFO */}

              <View style={styles.infoRow}>
                <View
                  style={styles.infoIcon}
                >
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color={
                      theme.colors.textMuted
                    }
                  />
                </View>

                <Text
                  style={styles.infoText}
                >
                  Uses your current location to
                  find nearby emergency facilities.
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function getSubtitle(
  type:
    | FastHelpType
    | null
    | undefined,
  loading: boolean,
): string {
  if (!loading) {
    return "Find the nearest emergency help";
  }

  if (type === "police") {
    return "Finding the nearest police station";
  }

  if (type === "medical") {
    return "Finding the nearest medical help";
  }

  return "Preparing emergency assistance";
}

function getLoadingTitle(
  type:
    | FastHelpType
    | null
    | undefined,
): string {
  if (type === "police") {
    return "Locating nearest police";
  }

  if (type === "medical") {
    return "Locating nearest medical help";
  }

  return "Finding emergency help";
}

function getLoadingMessage(
  type:
    | FastHelpType
    | null
    | undefined,
): string {
  if (type === "police") {
    return "Checking your location and finding the closest police station.";
  }

  if (type === "medical") {
    return "Checking your location and finding the closest medical facility.";
  }

  return "Checking your location and preparing emergency assistance.";
}

interface LoadingProgressRowProps {
  readonly icon:
    | "location"
    | "search"
    | "navigate";
  readonly text: string;
  readonly active: boolean;
}

function LoadingProgressRow({
  icon,
  text,
  active,
}: LoadingProgressRowProps): React.JSX.Element {
  return (
    <View
      style={styles.progressRow}
    >
      <View
        style={[
          styles.progressIcon,
          active &&
            styles.progressIconActive,
        ]}
      >
        <Ionicons
          name={icon}
          size={13}
          color={
            active
              ? theme.colors.danger
              : theme.colors.textMuted
          }
        />
      </View>

      <Text
        style={[
          styles.progressText,
          !active &&
            styles.progressTextMuted,
        ]}
      >
        {text}
      </Text>

      {active && (
        <View
          style={styles.progressDot}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor:
      "rgba(28, 25, 23, 0.30)",
  },

  sheet: {
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 24,

    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor:
      theme.colors.border,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.14,
    shadowRadius: 18,

    elevation: 14,
  },

  handle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    marginBottom: 16,
    borderRadius: 2,
    backgroundColor: "#D6D3D1",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor:
      theme.colors.dangerLight,
  },

  headerContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
    color: theme.colors.text,
  },

  subtitle: {
    marginTop: 2,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "500",
    color:
      theme.colors.textSecondary,
  },

  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    borderRadius: 18,
    backgroundColor: "#F5F5F4",
  },

  options: {
    marginTop: 18,
    gap: 10,
  },

  option: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
  },

  policeOption: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
  },

  medicalOption: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },

  optionIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },

  policeIcon: {
    backgroundColor: "#FFEDD5",
  },

  medicalIcon: {
    backgroundColor: "#DBEAFE",
  },

  optionContent: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },

  optionTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: theme.colors.text,
  },

  optionDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
    color:
      theme.colors.textSecondary,
  },

  arrowButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor:
      "rgba(255,255,255,0.72)",
  },

  medicalArrow: {
    backgroundColor:
      "rgba(255,255,255,0.78)",
  },

  loadingContainer: {
    minHeight: 270,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 18,
    paddingHorizontal: 14,
  },

  loadingIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor:
      theme.colors.dangerLight,
  },

  loadingIconMedical: {
    backgroundColor: "#DBEAFE",
  },

  loadingTitle: {
    marginTop: 15,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: theme.colors.text,
  },

  loadingMessage: {
    maxWidth: 315,
    marginTop: 7,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
    color:
      theme.colors.textSecondary,
  },

  progressArea: {
    width: "100%",
    marginTop: 18,
    gap: 7,
  },

  progressRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: "#FAFAF9",
  },

  progressIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F5F5F4",
  },

  progressIconActive: {
    backgroundColor:
      theme.colors.dangerLight,
  },

  progressText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "700",
    color:
      theme.colors.textSecondary,
  },

  progressTextMuted: {
    color:
      theme.colors.textMuted,
  },

  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.danger,
  },

  errorContainer: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingTop: 18,
  },

  errorIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor:
      theme.colors.dangerLight,
  },

  errorTitle: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
    color: theme.colors.text,
  },

  errorMessage: {
    marginTop: 6,
    maxWidth: 300,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
    color:
      theme.colors.textSecondary,
  },

  errorHint: {
    marginTop: 8,
    fontSize: 9,
    lineHeight: 13,
    color:
      theme.colors.textMuted,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingHorizontal: 3,
  },

  infoIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#F5F5F4",
  },

  infoText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "500",
    color:
      theme.colors.textMuted,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});