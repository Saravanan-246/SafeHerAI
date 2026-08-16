/*
 * SafetyData represents static area-level safety
 * signals for the HomeScreen overview card.
 *
 * All fields are nullable.  null means the signal
 * is not available from any verified source.
 *
 * WHAT IS REAL (per-route analysis):
 *   Real-time safety analysis is performed for
 *   each planned route via Overpass API, covering:
 *   - Police station proximity
 *   - Hospital / clinic / pharmacy proximity
 *   - Emergency facility presence
 *   - Public activity density (restaurants, shops,
 *     bus stops, cafes)
 *
 * WHAT IS NOT AVAILABLE:
 *   - crimeExposure: no verified real-time crime
 *     dataset is accessible for the current region
 *     without a paid or region-specific API.
 *   - lighting: no real IoT or municipal
 *     streetlight dataset is connected.
 *   - historicalRisk: NCRB aggregate data exists
 *     at district level only, not real-time or
 *     street-level.
 */

export interface SafetyData {
  score: number | null;
  status:
    | "Low Risk"
    | "Moderate Risk"
    | "High Risk"
    | "Unavailable";
  location: string | null;
  lighting: string | null;
  activity: string | null;
  emergencyDistance: string | null;
}

export const safetyData: SafetyData = {
  score: null,
  status: "Unavailable",
  location: null,
  lighting: null,
  activity: null,
  emergencyDistance: null,
};