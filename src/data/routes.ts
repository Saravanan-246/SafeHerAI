export interface Route {
  id: string;
  title: string;
  distance: string;
  duration: string;
  safetyScore: number;
  recommended?: boolean;
  factors: string[];
}

export const routes: Route[] = [
  {
    id: "1",
    title: "Safer Route",
    distance: "2.4 km",
    duration: "18 min",
    safetyScore: 92,
    recommended: true,
    factors: [
      "Well-lit roads",
      "High pedestrian activity",
      "Emergency services nearby",
    ],
  },
  {
    id: "2",
    title: "Balanced Route",
    distance: "2.1 km",
    duration: "15 min",
    safetyScore: 78,
    factors: [
      "Moderate activity",
      "Good road visibility",
      "Public places nearby",
    ],
  },
  {
    id: "3",
    title: "Fastest Route",
    distance: "1.8 km",
    duration: "12 min",
    safetyScore: 61,
    factors: [
      "Lower pedestrian activity",
      "Limited lighting",
      "Fewer nearby services",
    ],
  },
];