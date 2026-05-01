import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L, { type DivIcon } from "leaflet";

export interface MapStep {
  id: number;
  order: number;
  title: string;
  latitude: string | number;
  longitude: string | number;
}

interface TourStepRouteMapProps {
  steps: MapStep[];
}

interface ParsedStep extends MapStep {
  lat: number;
  lng: number;
}

const WORLD_CENTER: [number, number] = [20, 0];
const FALLBACK_ZOOM = 2;
const SINGLE_POINT_ZOOM = 14;

function FitToRoute({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length < 2) return;
    map.fitBounds(coordinates, { padding: [40, 40] });
  }, [coordinates, map]);

  return null;
}

function parseSteps(steps: MapStep[]) {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const valid: ParsedStep[] = [];
  let invalidCount = 0;

  for (const step of sorted) {
    const lat = Number(step.latitude);
    const lng = Number(step.longitude);
    const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90;
    const validLng = Number.isFinite(lng) && lng >= -180 && lng <= 180;
    if (!validLat || !validLng) {
      invalidCount += 1;
      continue;
    }

    valid.push({ ...step, lat, lng });
  }

  return { valid, invalidCount };
}

function buildStepMarkerIcon(index: number): DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:999px;background:#6366f1;color:white;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);">${index}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function TourStepRouteMap({ steps }: TourStepRouteMapProps) {
  const { valid, invalidCount } = useMemo(() => parseSteps(steps), [steps]);

  const center = useMemo<[number, number]>(() => {
    if (valid.length === 0) return WORLD_CENTER;
    if (valid.length === 1) return [valid[0].lat, valid[0].lng];
    const avgLat = valid.reduce((sum, item) => sum + item.lat, 0) / valid.length;
    const avgLng = valid.reduce((sum, item) => sum + item.lng, 0) / valid.length;
    return [avgLat, avgLng];
  }, [valid]);

  if (valid.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        No valid step coordinates available to render the route map.
      </div>
    );
  }

  const coordinates = valid.map((item) => [item.lat, item.lng] as [number, number]);
  const zoom = valid.length === 1 ? SINGLE_POINT_ZOOM : FALLBACK_ZOOM;

  return (
    <div className="space-y-2">
      {invalidCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {invalidCount} step{invalidCount === 1 ? "" : "s"} skipped due to invalid coordinates.
        </p>
      ) : null}
      <div className="h-[360px] overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {coordinates.length >= 2 ? (
            <Polyline positions={coordinates} pathOptions={{ color: "#6366f1", weight: 4 }} />
          ) : null}
          <FitToRoute coordinates={coordinates} />
          {valid.map((step, index) => (
            <Marker
              key={step.id}
              position={[step.lat, step.lng]}
              icon={buildStepMarkerIcon(index + 1)}
            >
              <Tooltip direction="top" offset={[0, -16]} opacity={1}>
                <div className="text-xs font-medium">
                  <p>Step {index + 1}</p>
                  <p className="text-muted-foreground">{step.title}</p>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
