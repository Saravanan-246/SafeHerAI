import type {
  Coordinates,
  Route,
} from "../modules/route/types";

const OSRM_URL = "https://router.project-osrm.org";

export async function getRoutes(
  start: Coordinates,
  destination: Coordinates
): Promise<Route[]> {
  const coordinates =
    `${start.longitude},${start.latitude};` +
    `${destination.longitude},${destination.latitude}`;

  const url =
    `${OSRM_URL}/route/v1/driving/${coordinates}` +
    `?overview=full&geometries=geojson&alternatives=true`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Routing request failed: ${response.status}`
      );
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes?.length) {
      throw new Error("No route found");
    }

    return data.routes.map(
      (route: any, index: number): Route => ({
        id: `route-${index + 1}`,

        distance: route.distance,

        duration: route.duration,

        coordinates: route.geometry.coordinates.map(
          ([longitude, latitude]: [
            number,
            number
          ]) => ({
            latitude,
            longitude,
          })
        ),
      })
    );
  } catch (error) {
    console.error("Route service error:", error);

    throw new Error(
      "Unable to calculate the route. Please try again."
    );
  }
}

