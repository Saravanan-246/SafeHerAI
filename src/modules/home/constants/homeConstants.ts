export const HOME_CONFIG = {
  map: {
    zoom: 16,
    controlsBottomOffset: 150,
    controlSize: 44,
    userMarkerSize: 46,
  },

  sentinelPath: {
    defaultState: "safe" as const,
    defaultTrend: "stable" as const,

    states: {
      safe: "SAFE",
      caution: "CAUTION",
      escalating: "RISK INCREASING",
      critical: "CRITICAL",
    },

    collapsedLabel: {
      safe: "Safe area",
      caution: "Stay aware",
      escalating: "Safety needs attention",
      critical: "Immediate attention needed",
    },
  },

  monitoring: {
    liveLabel: "LIVE",
    updatingLabel: "UPDATING",
  },

  location: {
    loadingTitle: "Locating you",
    loadingSubtitle: "Getting your current position",
  },
} as const;

export const HOME_ACTION_LABELS = {
  startJourney: "Start journey",
  endJourney: "End journey",
  reviewSafety: "Review safety",
  saferRoute: "Safer route",
  confirmSafe: "I'm Safe",
  safeRoute: "Safe Route",
  emergency: "Emergency",
} as const;