import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform } from "react-native";
import * as Location from "expo-location";

export interface LiveLocationState {
  readonly location: Location.LocationObject | null;
  readonly loading: boolean;
  readonly permissionDenied: boolean;
  readonly servicesDisabled: boolean;
  readonly locationUnavailable: boolean;
  readonly locationError: string | null;
  readonly retry: () => void;
  readonly openSettings: () => Promise<void>;
}

interface LiveLocationOptions {
  readonly enabled?: boolean;
}

const FRESH_LOCATION_TIMEOUT_MS = 8_000;
const LAST_KNOWN_MAX_AGE_MS = 120_000;
const LAST_KNOWN_REQUIRED_ACCURACY_METERS = 500;

const WATCH_DISTANCE_INTERVAL_METERS = 5;
const WATCH_TIME_INTERVAL_MS = 2_000;

const INITIAL_ACCURACY = Location.Accuracy.Balanced;
const WATCH_ACCURACY = Location.Accuracy.High;

function isValidLocation(
  value: Location.LocationObject | null | undefined,
): value is Location.LocationObject {
  if (!value?.coords) {
    return false;
  }

  const { latitude, longitude } = value.coords;

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

function isPermissionGranted(status: Location.PermissionStatus): boolean {
  return status === Location.PermissionStatus.GRANTED;
}

export function useLiveLocation(options?: LiveLocationOptions): LiveLocationState {
  const enabled = options?.enabled ?? true;

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [servicesDisabled, setServicesDisabled] = useState<boolean>(false);
  const [locationUnavailable, setLocationUnavailable] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const mountedRef = useRef<boolean>(false);
  const locationRef = useRef<Location.LocationObject | null>(null);
  const requestIdRef = useRef<number>(0);

  const updateLocation = useCallback(
    (nextLocation: Location.LocationObject): void => {
      if (!isValidLocation(nextLocation)) {
        return;
      }

      locationRef.current = nextLocation;
      setLocation(nextLocation);

      setLoading(false);
      setLocationUnavailable(false);
      setLocationError(null);
    },
    [],
  );

  const stopWatcher = useCallback((): void => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  const retry = useCallback((): void => {
    stopWatcher();
    setRetryKey((current) => current + 1);
  }, [stopWatcher]);

  const openSettings = useCallback(async (): Promise<void> => {
    try {
      await Linking.openSettings();
    } catch {
      // No safe fallback when the platform cannot open settings.
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      mountedRef.current = false;
      stopWatcher();
      setLoading(false);
      return;
    }

    mountedRef.current = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    let initialTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const isCurrentRequest = (): boolean => {
      return mountedRef.current && requestIdRef.current === requestId;
    };

    const setUnavailable = (message: string): void => {
      if (!isCurrentRequest()) return;
      setLoading(false);
      setLocationUnavailable(true);
      setLocationError(message);
    };

    const enableAndroidLocation = async (): Promise<boolean> => {
      if (Platform.OS !== "android") return false;

      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        return false;
      }

      try {
        return await Location.hasServicesEnabledAsync();
      } catch {
        return false;
      }
    };

    const startWatcher = async (): Promise<void> => {
      if (!isCurrentRequest() || subscriptionRef.current) return;

      try {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: WATCH_ACCURACY,
            distanceInterval: WATCH_DISTANCE_INTERVAL_METERS,
            timeInterval: WATCH_TIME_INTERVAL_MS,
            mayShowUserSettingsDialog: true,
          },
          (nextLocation) => {
            if (!isCurrentRequest()) return;
            updateLocation(nextLocation);
          },
        );

        if (!isCurrentRequest()) {
          subscription.remove();
          return;
        }

        subscriptionRef.current = subscription;
      } catch (error) {
        if (!isCurrentRequest()) return;
        
        // A watcher failure should not wipe an already valid location.
        if (!isValidLocation(locationRef.current)) {
          setUnavailable(
            getErrorMessage(error, "Live location tracking is temporarily unavailable."),
          );
        }
      }
    };

    const fetchFreshLocation = async (): Promise<void> => {
      try {
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: INITIAL_ACCURACY,
          mayShowUserSettingsDialog: true,
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          initialTimeoutId = setTimeout(() => {
            reject(new Error("Current location is temporarily unavailable."));
          }, FRESH_LOCATION_TIMEOUT_MS);
        });

        const freshLocation = await Promise.race([locationPromise, timeoutPromise]);

        if (isCurrentRequest() && isValidLocation(freshLocation)) {
          updateLocation(freshLocation);
        }
      } catch (error) {
        if (!isCurrentRequest()) return;

        // Do not overwrite a working last-known location with a transient fresh error
        if (!isValidLocation(locationRef.current)) {
          setUnavailable(
            getErrorMessage(error, "Current location is temporarily unavailable."),
          );
        }
      } finally {
        if (initialTimeoutId !== null) {
          clearTimeout(initialTimeoutId);
          initialTimeoutId = null;
        }
      }
    };

    const acquireLocation = async (): Promise<void> => {
      setLoading(true);
      setPermissionDenied(false);
      setServicesDisabled(false);
      setLocationUnavailable(false);
      setLocationError(null);

      // 1. Check location services
      let servicesEnabled = false;
      try {
        servicesEnabled = await Location.hasServicesEnabledAsync();
      } catch {
        servicesEnabled = false;
      }

      if (!isCurrentRequest()) return;

      if (!servicesEnabled) {
        servicesEnabled = await enableAndroidLocation();
      }

      if (!isCurrentRequest()) return;

      if (!servicesEnabled) {
        setLoading(false);
        setServicesDisabled(true);
        setLocationUnavailable(true);
        setLocationError("Location services are turned off. Enable GPS to continue.");
        return;
      }

      // 2. Check/request foreground permission
      let permission: Location.LocationPermissionResponse;
      try {
        permission = await Location.getForegroundPermissionsAsync();

        if (!isPermissionGranted(permission.status)) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
      } catch (error) {
        setUnavailable(getErrorMessage(error, "Unable to request location permission."));
        return;
      }

      if (!isCurrentRequest()) return;

      if (!isPermissionGranted(permission.status)) {
        setLoading(false);
        setPermissionDenied(true);
        setLocationUnavailable(true);
        setLocationError("Location permission was denied. Allow location access in Settings.");
        return;
      }

      // 3. Use last-known location immediately when available
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: LAST_KNOWN_MAX_AGE_MS,
          requiredAccuracy: LAST_KNOWN_REQUIRED_ACCURACY_METERS,
        });

        if (isCurrentRequest() && isValidLocation(lastKnown)) {
          updateLocation(lastKnown); // Instantly drops `loading` state to `false`
        }
      } catch {
        // Last-known location is optional. Continue to fresh GPS.
      }

      if (!isCurrentRequest()) return;

      // 4. Request a fresh location in parallel without blocking the watcher
      void fetchFreshLocation();

      // 5. Start the live watcher
      await startWatcher();
    };

    void acquireLocation();

    return () => {
      mountedRef.current = false;

      if (initialTimeoutId !== null) {
        clearTimeout(initialTimeoutId);
        initialTimeoutId = null;
      }

      stopWatcher();
    };
  }, [enabled, retryKey, stopWatcher, updateLocation]);

  return {
    location,
    loading,
    permissionDenied,
    servicesDisabled,
    locationUnavailable,
    locationError,
    retry,
    openSettings,
  };
}