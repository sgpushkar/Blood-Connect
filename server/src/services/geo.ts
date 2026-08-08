/**
 * Geospatial utilities.
 * `distanceKm` is a direct lift of the Haversine formula from the existing frontend `src/lib/utils.ts`.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Calculate the great-circle distance between two lat/lng points in kilometres.
 * Uses the Haversine formula (same implementation as the frontend).
 */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/**
 * Return fuzzy coordinates rounded to ~1 km precision for privacy.
 * Never expose exact donor home coordinates publicly.
 */
export function fuzzyLocation(lat: number, lng: number): { lat: number; lng: number } {
  const precision = 2; // ~1.1 km at the equator
  return {
    lat: Math.round(lat * 10 ** precision) / 10 ** precision,
    lng: Math.round(lng * 10 ** precision) / 10 ** precision,
  };
}

/**
 * Bounding-box filter for initial DB query before precise Haversine check.
 * Returns the min/max lat/lng for a square bounding box around a centre point.
 */
export function boundingBox(centre: LatLng, radiusKm: number) {
  const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
  const lngDelta = radiusKm / (111.32 * Math.cos((centre.lat * Math.PI) / 180));
  return {
    minLat: centre.lat - latDelta,
    maxLat: centre.lat + latDelta,
    minLng: centre.lng - lngDelta,
    maxLng: centre.lng + lngDelta,
  };
}
