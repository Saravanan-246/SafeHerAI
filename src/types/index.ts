export type RiskLevel =
  | "Low Risk"
  | "Moderate Risk"
  | "High Risk";

export type AlertType =
  | "warning"
  | "success"
  | "danger";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Route {
  id: string;
  title: string;
  distance: string;
  duration: string;
  safetyScore: number;
  recommended?: boolean;
  factors: string[];
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  time: string;
  location?: string;
}

export interface SafetyData {
  score: number;
  status: RiskLevel;
  location: string;
  lighting: string;
  activity: string;
  emergencyDistance: string;
  nearbyIncidents: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}