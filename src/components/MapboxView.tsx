import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Donor } from "../types";
import { BloodGroupChip } from "./Chips";
import StatusPill from "./StatusPill";

// Fix leaflet default icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const CustomMarkerIcon = (color: string) => L.divIcon({
  className: "custom-leaflet-marker",
  html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface MapboxViewProps {
  donors: Donor[];
  centerLat?: number;
  centerLng?: number;
}

// Generate a random coordinate within a certain radius (km) of a center point
function generateRandomPoint(centerLat: number, centerLng: number, radiusKm: number) {
  const y0 = centerLat;
  const x0 = centerLng;
  const rd = radiusKm / 111.3; // roughly 111.3 km per degree
  const u = Math.random();
  const v = Math.random();
  const w = rd * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  // Adjust for longitude shrinking at higher latitudes
  const newLng = x0 + x / Math.cos(y0 * (Math.PI / 180));
  const newLat = y0 + y;
  return { lat: newLat, lng: newLng };
}

export default function MapboxView({ donors, centerLat = 19.0760, centerLng = 72.8777 }: MapboxViewProps) {
  // We use a state to store generated coordinates so they don't bounce around on re-renders
  const [donorLocations, setDonorLocations] = useState<Record<string, { lat: number; lng: number }>>({});

  useEffect(() => {
    const newLocations: Record<string, { lat: number; lng: number }> = {};
    donors.forEach((d) => {
      if (!donorLocations[d.id]) {
        // If distance is provided, use it for radius, else random between 1-15km
        const dist = d.distanceKm ?? (Math.random() * 15 + 1);
        newLocations[d.id] = generateRandomPoint(centerLat, centerLng, dist);
      }
    });
    if (Object.keys(newLocations).length > 0) {
      setDonorLocations(prev => ({ ...prev, ...newLocations }));
    }
  }, [donors, centerLat, centerLng, donorLocations]);

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-3xl border border-line shadow-inner">
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={12} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {donors.map((donor) => {
          const loc = donorLocations[donor.id];
          if (!loc) return null;
          
          const isEligible = donor.eligible !== false;
          const markerColor = isEligible ? "#10B981" : "#F59E0B";

          return (
            <Marker 
              key={donor.id} 
              position={[loc.lat, loc.lng]}
              icon={CustomMarkerIcon(markerColor)}
            >
              <Popup className="rounded-xl">
                <div className="p-1">
                  <div className="flex items-center gap-3">
                    <BloodGroupChip group={donor.bloodGroup} />
                    <div>
                      <h3 className="font-bold text-ink">{donor.name}</h3>
                      <p className="text-xs text-ink-soft">{donor.city}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between gap-4 border-t border-line pt-3 text-xs">
                    <div>
                      <span className="block text-ink-soft">Status</span>
                      <StatusPill tone={isEligible ? "green" : "orange"}>
                        {isEligible ? "Eligible" : "Ineligible"}
                      </StatusPill>
                    </div>
                    <div>
                      <span className="block text-ink-soft">Distance</span>
                      <span className="font-semibold text-ink">{donor.distanceKm?.toFixed(1) || "5.0"} km</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
