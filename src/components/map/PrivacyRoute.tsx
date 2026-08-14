'use client';

import { useCallback, useRef, useState } from 'react';
import L from 'leaflet';

interface RoutePoint {
  lat: number;
  lng: number;
}

interface RouteResult {
  geometry: [number, number][];
  distanceM: number;
  durationS: number;
  cameraHits: { lat: number; lng: number; distM: number }[];
}

interface PrivacyRouteProps {
  map: L.Map | null;
}

const EXPOSURE_RADIUS_M = 120;

async function fetchJson(
  url: string,
  timeoutMs = 12000,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    coords.push([lat * 1e-6, lng * 1e-6]);
  }
  return coords;
}

function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function PrivacyRoute({ map }: PrivacyRouteProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromIsMyLocation, setFromIsMyLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const myLocationRef = useRef<RoutePoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [candidateCount, setCandidateCount] = useState(0);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const camerasRef = useRef<[number, number][] | null>(null);


  const getCameras = useCallback(async (): Promise<[number, number][] | null> => {
    if (camerasRef.current) return camerasRef.current;
    try {
      const data = (await fetchJson('/community-cameras.json')) as [number, number, number | null][];
      camerasRef.current = data.map(([lat, lng]) => [lat, lng]);
      return camerasRef.current;
    } catch {
      return null;
    }
  }, []);

  const clearRoute = useCallback(() => {
    const m = map;
    const group = layerRef.current;
    if (group && m) {

      const all = (group as unknown as { _all?: L.Layer[] })._all ?? [];
      for (const layer of all) m.removeLayer(layer);
      group.remove();
    }
    layerRef.current = null;
    setResult(null);
    setError(null);
  }, [map]);

  const handleFindRoute = useCallback(async () => {
    setError(null);
    setResult(null);
    clearRoute();
    const m = map;
    if (!m) return;
    if (!from.trim() || !to.trim()) {
      setError('Enter both a start and destination.');
      return;
    }

    setLoading(true);
    try {

      const geocode = async (q: string): Promise<RoutePoint> => {
        const data = (await fetchJson(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`,
        )) as { lat: string; lon: string }[];
        if (!data.length) throw new Error(`Could not find "${q}"`);
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      };
      const start: RoutePoint = fromIsMyLocation
        ? myLocationRef.current ?? (await geocode(from))
        : await geocode(from);
      const end = await geocode(to);


      const cameras = await getCameras();





      const scoreRoute = (
        coords: [number, number][],
      ): { cameraHits: RouteResult['cameraHits'] } => {
        const cameraHits: RouteResult['cameraHits'] = [];
        if (!cameras) return { cameraHits };
        const sampled: RoutePoint[] = [];
        for (let i = 0; i < coords.length - 1; i++) {
          const a = coords[i];
          const b = coords[i + 1];
          const segLen = haversineM({ lat: a[0], lng: a[1] }, { lat: b[0], lng: b[1] });
          const steps = Math.max(1, Math.ceil(segLen / 60));
          for (let s = 0; s < steps; s++) {
            const t = s / steps;
            sampled.push({ lat: a[0] + (b[0] - a[0]) * t, lng: a[1] + (b[1] - a[1]) * t });
          }
        }
        const bucket = new Map<string, [number, number][]>();
        const BUCKET = 0.02;
        for (const [lat, lng] of cameras) {
          const key = `${Math.floor(lat / BUCKET)},${Math.floor(lng / BUCKET)}`;
          const arr = bucket.get(key);
          if (arr) arr.push([lat, lng]);
          else bucket.set(key, [[lat, lng]]);
        }
        const seen = new Set<string>();
        for (const p of sampled) {
          const kLat = Math.floor(p.lat / BUCKET);
          const kLng = Math.floor(p.lng / BUCKET);
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const arr = bucket.get(`${kLat + dx},${kLng + dy}`);
              if (!arr) continue;
              for (const [clat, clng] of arr) {
                const d = haversineM({ lat: clat, lng: clng }, p);
                if (d <= EXPOSURE_RADIUS_M) {
                  const key = `${clat.toFixed(4)},${clng.toFixed(4)}`;
                  if (!seen.has(key)) {
                    seen.add(key);
                    cameraHits.push({ lat: clat, lng: clng, distM: Math.round(d) });
                  }
                }
              }
            }
          }
        }
        cameraHits.sort((a, b) => a.distM - b.distM);
        return { cameraHits };
      };

      const valhallaRoute = async (
        excludePolys: number[][][],
      ): Promise<{ geometry: [number, number][]; distance: number; duration: number }> => {
        const payload = {
          locations: [
            { lat: start.lat, lon: start.lng },
            { lat: end.lat, lon: end.lng },
          ],
          costing: 'auto',
          units: 'kilometers',
          ...(excludePolys.length ? { exclude_polygons: excludePolys } : {}),
        };
        const res = (await fetchJson('https://valhalla1.openstreetmap.de/route', 20000, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })) as { trip?: { legs: { shape: string }[]; summary: { length: number; time: number } } };
        if (!res.trip?.legs?.length) throw new Error('No route found between these points.');

        const shape = res.trip.legs.map((l) => l.shape).join('');
        const coords = decodePolyline(shape);
        return {
          geometry: coords,
          distance: res.trip.summary.length * 1000,
          duration: res.trip.summary.time,
        };
      };

      const boxAround = (lat: number, lng: number, m: number): number[][] => {
        const dLat = m / 111320.0;
        const dLng = m / (111320.0 * Math.cos((lat * Math.PI) / 180));
        return [
          [lng - dLng, lat - dLat],
          [lng + dLng, lat - dLat],
          [lng + dLng, lat + dLat],
          [lng - dLng, lat + dLat],
          [lng - dLng, lat - dLat],
        ];
      };


      let route = await valhallaRoute([]);
      const excluded = new Set<string>();
      let pass = 0;
      while (pass < 3) {
        const { cameraHits } = scoreRoute(route.geometry);
        if (cameraHits.length === 0) break;



        const polys: number[][][] = [];
        for (const hit of cameraHits) {
          const key = `${hit.lat.toFixed(4)},${hit.lng.toFixed(4)}`;
          if (!excluded.has(key)) {
            excluded.add(key);
            polys.push(boxAround(hit.lat, hit.lng, 160));
          }
        }
        if (polys.length === 0) break;
        try {
          const newRoute = await valhallaRoute(
            [...Array.from(excluded)].map((k) => {
              const [lat, lng] = k.split(',').map(Number);
              return boxAround(lat, lng, 160);
            }),
          );
          route = newRoute;
        } catch {


          break;
        }
        pass++;
      }

      const geometry = route.geometry;
      const { cameraHits } = scoreRoute(geometry);
      setCandidateCount(pass + 1);


      const polyline = L.polyline(geometry, {
        color: '#20b8c8',
        weight: 5,
        opacity: 0.9,
      }).addTo(m);
      const startMarker = L.circleMarker([start.lat, start.lng], {
        radius: 7,
        color: '#4ade80',
        fillColor: '#4ade80',
        fillOpacity: 1,
      }).addTo(m);
      const endMarker = L.circleMarker([end.lat, end.lng], {
        radius: 7,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 1,
      }).addTo(m);

      const group = L.layerGroup([polyline, startMarker, endMarker]);


      const dangerCircles = cameraHits.map((hit) =>
        L.circle([hit.lat, hit.lng], {
          radius: EXPOSURE_RADIUS_M,
          color: '#ef4444',
          weight: 1,
          opacity: 0.7,
          fillColor: '#ef4444',
          fillOpacity: 0.18,
          interactive: false,
        }),
      );
      if (dangerCircles.length) {
        const dg = L.layerGroup(dangerCircles);
        dg.addTo(m);
        group.addLayer(dg);
      }


      const allLayers: L.Layer[] = [polyline, startMarker, endMarker, ...dangerCircles];
      (group as unknown as { _all?: L.Layer[] })._all = allLayers;

      layerRef.current = group;
      m.fitBounds(polyline.getBounds(), { padding: [50, 50] });

      setResult({
        geometry,
        distanceM: Math.round(route.distance),
        durationS: Math.round(route.duration),
        cameraHits,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Route failed. Try different locations.');
    } finally {
      setLoading(false);
    }
  }, [map, from, to, fromIsMyLocation, clearRoute, getCameras]);

  const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);
  const fmtDur = (s: number) => {
    const min = Math.floor(s / 60);
    return `${min} min`;
  };


  const useMyLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        myLocationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setFromIsMyLocation(true);
        setFrom('My location');
        setLocating(false);
      },
      () => {
        setError('Location permission denied. Enter an address instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return (
    <div className="absolute left-1/2 top-[4.5rem] z-[1000] w-72 -translate-x-1/2 sm:left-4 sm:top-24 sm:w-80 sm:translate-x-0">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (open) clearRoute();
        }}
        className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-center text-sm font-medium text-steel-100 shadow-sm transition-colors hover:border-radar-500/50"
      >
        <span className="flex items-center justify-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- small inline icon */}
          <img
            src="/privacy-shield-white.png"
            alt=""
            className="h-5 w-5"
            draggable={false}
          />
          Privacy Route
        </span>
        <span className="block text-[11px] font-normal text-steel-400">
          Tap to find a drive that avoids Flock cameras
        </span>
      </button>

      {open && (
        <div className="mt-1 space-y-2 rounded-lg border border-navy-600 bg-navy-900 p-3 shadow-lg">
          <div className="relative">
            <input
              type="text"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                if (fromIsMyLocation) setFromIsMyLocation(false);
              }}
              placeholder="From (address or city)..."
              className="w-full rounded-md border border-navy-600 bg-navy-950 px-3 py-2 pr-16 text-sm text-steel-100 placeholder:text-steel-500 focus:border-radar-500 focus:outline-none"
            />
            <button
              onClick={useMyLocation}
              disabled={locating}
              className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                fromIsMyLocation
                  ? 'bg-radar-500/20 text-radar-300 ring-1 ring-radar-500/50'
                  : 'bg-navy-800 text-steel-300 hover:bg-navy-700 hover:text-radar-300'
              }`}
              title="Use your current location as the start point"
            >
              {locating ? '…' : '📍 My location'}
            </button>
          </div>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To (address or city)..."
            className="w-full rounded-md border border-navy-600 bg-navy-950 px-3 py-2 text-sm text-steel-100 placeholder:text-steel-500 focus:border-radar-500 focus:outline-none"
          />
          <button
            onClick={handleFindRoute}
            disabled={loading}
            className="w-full rounded-md bg-radar-500 px-3 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-radar-400 disabled:opacity-50"
          >
            {loading ? 'Finding route…' : 'Find route'}
          </button>

          {error && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-400">
              {error}
            </p>
          )}

          {result && (
            <div className="relative space-y-1.5 rounded-md border border-navy-600 bg-navy-950 px-2.5 py-2 text-[11px] text-steel-300">
              <button
                onClick={clearRoute}
                aria-label="Close route"
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-navy-600 bg-navy-800 text-[10px] text-steel-300 transition-colors hover:bg-red-500/20 hover:text-red-400"
              >
                ✕
              </button>
              <p>
                <span className="font-semibold text-steel-100">{fmtDist(result.distanceM)}</span>{' '}
                · {fmtDur(result.durationS)} drive
              </p>
              <p
                className={
                  result.cameraHits.length === 0
                    ? 'font-semibold text-green-400'
                    : 'font-semibold text-red-400'
                }
              >
                {result.cameraHits.length === 0
                  ? '✅ 0 cameras within 120m'
                  : `⚠️ ${result.cameraHits.length} camera${result.cameraHits.length > 1 ? 's' : ''} within 120m`}
              </p>
              <p className="text-steel-500">
                Least-exposed of {candidateCount} candidate routes.
              </p>
              {result.cameraHits.length > 0 && (
                <p className="text-steel-400">Red circles mark camera exposure zones.</p>
              )}
              <button
                onClick={clearRoute}
                className="mt-1 w-full rounded-md border border-navy-600 px-2 py-1 text-[11px] text-steel-400 transition-colors hover:bg-navy-800"
              >
                Clear route
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
