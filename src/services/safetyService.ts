export interface SafetyFactors {
  lighting: number;
  activity: number;
  emergencyAccess: number;
  historicalRisk: number;
}

export interface SafetyResult {
  score: number;
  status: "Low Risk" | "Moderate Risk" | "High Risk";
  factors: SafetyFactors;
}

export function calculateSafetyScore(
  factors: SafetyFactors
): SafetyResult {
  const score = Math.round(
    factors.lighting * 0.3 +
    factors.activity * 0.25 +
    factors.emergencyAccess * 0.25 +
    (100 - factors.historicalRisk) * 0.2
  );

  const status =
    score >= 80
      ? "Low Risk"
      : score >= 60
        ? "Moderate Risk"
        : "High Risk";

  return {
    score,
    status,
    factors,
  };
}

export function getDemoSafetyScore(): SafetyResult {
  return calculateSafetyScore({
    lighting: 95,
    activity: 90,
    emergencyAccess: 88,
    historicalRisk: 18,
  });
}