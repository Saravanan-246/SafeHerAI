export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type RoutePriority =
  | "fast"
  | "balanced"
  | "safest";

export interface SafetyAnalysis {
  crimeExposure?: number;
  activity?: number;
  lighting?: number;
  policeAccess?: number;
  medicalAccess?: number;
  emergencyAccess?: number;
  historicalRisk?: number;
}

export interface Route {
  id: string;

  distance: number;
  duration: number;

  coordinates: Coordinates[];

  safetyScore?: number;
  rank?: number;
  recommended?: boolean;

  safety?: SafetyAnalysis;
}

export interface Destination {
  name: string;
  coordinates: Coordinates;
}

export interface RouteRankingResult extends Route {
  rank: number;
  recommended: boolean;
}