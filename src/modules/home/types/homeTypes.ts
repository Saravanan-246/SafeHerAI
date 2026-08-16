export type SentinelRiskState =
  | "safe"
  | "caution"
  | "escalating"
  | "critical";

export type SentinelRiskTrend =
  | "stable"
  | "rising"
  | "falling";

export type SafetySignalStatus =
  | "positive"
  | "warning"
  | "neutral";

export interface SafetySignal {
  readonly id: string;
  readonly label: string;
  readonly status: SafetySignalStatus;
}

export interface SentinelPathState {
  readonly riskState: SentinelRiskState;
  readonly trend: SentinelRiskTrend;
  readonly message: string;
  readonly signals: readonly SafetySignal[];
}