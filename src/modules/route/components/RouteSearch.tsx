import React, { useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../../../theme/theme";

interface RouteSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onBack?: () => void;
  onClear?: () => void;
  onSearch?: () => void;
  fromReady?: boolean;
  loading?: boolean;
  error?: string | null;
}

export default function RouteSearch({
  value,
  onChangeText,
  onBack,
  onClear,
  onSearch,
  fromReady = false,
  loading = false,
  error,
}: RouteSearchProps) {
  const inputRef = useRef<TextInput | null>(null);

  const hasDestination = value.trim().length > 0;
  const canSearch =
    fromReady &&
    hasDestination &&
    !loading;

  const handleSubmit = () => {
    if (!canSearch) {
      return;
    }

    onSearch?.();
  };

  const handleClear = () => {
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            PLAN YOUR ROUTE
          </Text>

          <Text style={styles.title}>
            Where are you going?
          </Text>
        </View>

        {onBack && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* FROM */}
      <View style={styles.locationRow}>
        <View style={styles.fromMarker}>
          <View
            style={[
              styles.fromDot,
              !fromReady &&
                styles.fromDotUnavailable,
            ]}
          />
        </View>

        <View style={styles.locationContent}>
          <Text style={styles.label}>
            FROM
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.locationValue,
              !fromReady &&
                styles.locationValueMuted,
            ]}
          >
            {fromReady
              ? "Current location"
              : "Location unavailable"}
          </Text>
        </View>
      </View>

      {/* CONNECTOR */}
      <View style={styles.connector} />

      {/* TO */}
      <View style={styles.locationRow}>
        <View style={styles.toMarker}>
          <Ionicons
            name="location-outline"
            size={15}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.inputContent}>
          <Text style={styles.label}>
            TO
          </Text>

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder="Search destination"
            placeholderTextColor={
              theme.colors.textMuted
            }
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
            editable={!loading}
            autoCorrect={false}
            autoCapitalize="words"
            style={styles.input}
            accessibilityLabel="Destination"
            accessibilityHint="Enter a destination and search for real routes."
          />

          <View style={styles.actions}>
            {hasDestination && !loading && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="Clear destination"
                style={styles.actionButton}
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.86}
              onPress={handleSubmit}
              disabled={!canSearch}
              accessibilityRole="button"
              accessibilityLabel="Find route"
              accessibilityState={{
                disabled: !canSearch,
                busy: loading,
              }}
              style={[
                styles.searchButton,
                !canSearch &&
                  styles.searchButtonDisabled,
              ]}
            >
              <Ionicons
                name={
                  loading
                    ? "time-outline"
                    : "search-outline"
                }
                size={17}
                color={
                  canSearch || loading
                    ? theme.colors.white
                    : theme.colors.textMuted
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* STATUS */}
      {loading && (
        <View style={styles.status}>
          <Ionicons
            name="navigate-outline"
            size={14}
            color={theme.colors.primary}
          />

          <Text style={styles.statusText}>
            Finding available routes...
          </Text>
        </View>
      )}

      {/* ERROR */}
      {!!error && !loading && (
        <View
          style={styles.error}
          accessibilityRole="alert"
        >
          <Ionicons
            name="alert-circle-outline"
            size={15}
            color={theme.colors.danger}
          />

          <Text style={styles.errorText}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,

    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 7,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },

  eyebrow: {
    ...theme.typography.label,
    color: theme.colors.primary,
  },

  title: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.text,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  locationRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
  },

  fromMarker: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },

  fromDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.text,
    borderWidth: 2,
    borderColor: "#E7E5E4",
  },

  fromDotUnavailable: {
    backgroundColor: theme.colors.textMuted,
  },

  toMarker: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primaryLight,
  },

  locationContent: {
    flex: 1,
    marginLeft: 10,
  },

  inputContent: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 2,
  },

  label: {
    ...theme.typography.label,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },

  locationValue: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
  },

  locationValueMuted: {
    color: theme.colors.textSecondary,
  },

  connector: {
    width: 1,
    height: 18,
    marginLeft: 14,
    backgroundColor: theme.colors.divider,
  },

  input: {
    ...theme.typography.bodyMedium,
    minHeight: 28,
    color: theme.colors.text,
    padding: 0,
    paddingRight: 92,
  },

  actions: {
    position: "absolute",
    right: 0,
    bottom: -2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  actionButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },

  searchButtonDisabled: {
    backgroundColor: theme.colors.primaryLight,
  },

  status: {
    minHeight: 34,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    flexDirection: "row",
    alignItems: "center",
  },

  statusText: {
    ...theme.typography.caption,
    marginLeft: 7,
    color: theme.colors.primaryDark,
    fontWeight: "600",
  },

  error: {
    minHeight: 36,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dangerLight,
    flexDirection: "row",
    alignItems: "center",
  },

  errorText: {
    ...theme.typography.caption,
    flex: 1,
    marginLeft: 7,
    color: theme.colors.danger,
    fontWeight: "600",
  },
});