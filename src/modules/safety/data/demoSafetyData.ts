import type { Coordinates } from "../../route/types";

export interface DemoSafetyBubbleData {
  readonly score: number;

  readonly status:
    | "safe"
    | "caution"
    | "high-risk";

  readonly policeAccess: number;
  readonly medicalAccess: number;
  readonly activity: number;
  readonly emergencyAccess: number;

  readonly crimeExposure:
    | "low"
    | "moderate"
    | "high";

  readonly police: {
    readonly name: string;
    readonly distanceMeters: number;
    readonly coordinates: Coordinates;
    readonly address: string;
  };

  readonly medical: {
    readonly name: string;
    readonly distanceMeters: number;
    readonly coordinates: Coordinates;
    readonly address: string;
  };

  readonly sourceLabel: string;
  readonly period: string;
}

export const DEMO_SAFETY_BUBBLE: DemoSafetyBubbleData = {
  score: 82,

  status: "safe",

  policeAccess: 91,
  medicalAccess: 86,
  activity: 72,
  emergencyAccess: 88,

  crimeExposure: "moderate",

  police: {
    name: "Gandhimanagar Police Station",
    distanceMeters: 1200,
    coordinates: {
      latitude: 11.0395,
      longitude: 76.9708,
    },
    address:
      "Gandhimanagar, Coimbatore, Tamil Nadu",
  },

  medical: {
    name: "Coimbatore Medical Centre",
    distanceMeters: 1600,
    coordinates: {
      latitude: 11.0305,
      longitude: 76.9765,
    },
    address:
      "Coimbatore, Tamil Nadu",
  },

  sourceLabel:
    "SafeHerAI demo safety dataset",

  period:
    "Demo scenario",
};