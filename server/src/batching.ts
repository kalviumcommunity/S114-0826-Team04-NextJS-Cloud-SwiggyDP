export interface PointLike {
  lat: number;
  lng: number;
}

export interface PartnerLike {
  id: string;
  status: string;
  location: {
    coordinates: [number, number];
  };
}

const EARTH_RADIUS_KM = 6371;

export const getDistanceKm = (a: PointLike, b: PointLike): number => {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const deltaLat = ((b.lat - a.lat) * Math.PI) / 180;
  const deltaLng = ((b.lng - a.lng) * Math.PI) / 180;

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const findNearestAvailablePartner = (
  partners: PartnerLike[],
  orderLocation: PointLike,
): PartnerLike | null => {
  const availablePartners = partners.filter((partner) => partner.status === "available");

  if (!availablePartners.length) {
    return null;
  }

  const sorted = [...availablePartners].sort((a, b) => {
    const aDistance = getDistanceKm(
      { lat: orderLocation.lat, lng: orderLocation.lng },
      {
        lat: a.location.coordinates[1],
        lng: a.location.coordinates[0],
      },
    );

    const bDistance = getDistanceKm(
      { lat: orderLocation.lat, lng: orderLocation.lng },
      {
        lat: b.location.coordinates[1],
        lng: b.location.coordinates[0],
      },
    );

    return aDistance - bDistance;
  });

  return sorted[0] ?? null;
};
