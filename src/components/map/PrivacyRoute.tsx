'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import L from 'leaflet';

interface RoutePoint {
  lat: number;
  lng: number;
}

interface ValhallaManeuver {
  instruction: string;
  length: number;
  time: number;
  type: number;
  begin_shape_index: number;
}

interface RouteResult {
  geometry: [number, number][];
  distanceM: number;
  durationS: number;
  cameraHits: { lat: number; lng: number; distM: number }[];
  maneuvers: ValhallaManeuver[];
}

interface PrivacyRouteProps {
  map: L.Map | null;
}

const EXPOSURE_RADIUS_M = 120;

interface SuggestItem {
  label: string;
  point: RoutePoint;
}

function runDemoSimulation(
  pathRef: { current: ReturnType<typeof buildPath> | null },
  onTick: (p: RoutePoint) => void,
): number {
  let dist = 0;
  return window.setInterval(() => {
    const path = pathRef.current;
    if (!path) return;
    dist += DEMO_SPEED;
    onTick(pointAtDistance(path, dist));
  }, 1000);
}

function LocationSuggestions({
  value,
  onValueChange,
  onPick,
  onClearPoint,
  placeholder,
  trailing,
}: {
  value: string;
  onValueChange: (v: string) => void;
  onPick: (label: string, point: RoutePoint) => void;
  onClearPoint: () => void;
  placeholder: string;
  trailing?: ReactNode;
}) {
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const refreshPos = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);
  const seqRef = useRef(0);

  const close = () => {
    setOpen(false);
    setSuggestions([]);
  };

  useEffect(() => {
    if (!open || suggestions.length === 0) return;
    window.addEventListener('scroll', refreshPos, true);
    window.addEventListener('resize', refreshPos);
    return () => {
      window.removeEventListener('scroll', refreshPos, true);
      window.removeEventListener('resize', refreshPos);
    };
  }, [open, suggestions.length, refreshPos]);

  const fetchSuggestions = (q: string) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = window.setTimeout(async () => {
      const seq = ++seqRef.current;
      try {
        const data = (await fetchJson(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en`,
        )) as { features?: { properties?: Record<string, string>; geometry?: { coordinates?: number[] } }[] };
        const items: SuggestItem[] = [];
        for (const f of data.features ?? []) {
          const p = f.properties ?? {};
          const coord = f.geometry?.coordinates;
          if (!coord || coord.length < 2) continue;
          const streetPart =
            p.housenumber && p.street ? `${p.housenumber} ${p.street}` : (p.street ?? null);
          const label = [streetPart ?? p.name ?? null, p.city, p.state]
            .filter(Boolean)
            .join(', ');
          items.push({ label: label || p.name || 'Location', point: { lat: coord[1], lng: coord[0] } });
        }
        if (seq !== seqRef.current) return;
        setSuggestions(items.slice(0, 5));
        setActive(0);
        setOpen(items.length > 0);
        refreshPos();
      } catch {
        if (seq === seqRef.current) {
          setSuggestions([]);
          setOpen(false);
        }
      }
    }, 250);
  };

  const pick = (item: SuggestItem) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    seqRef.current += 1;
    onPick(item.label, item.point);
    close();
  };

  return (
    <div className="relative shrink-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onFocus={() => {
          refreshPos();
          if (suggestions.length) setOpen(true);
        }}
        onChange={(e) => {
          onValueChange(e.target.value);
          onClearPoint();
          fetchSuggestions(e.target.value);
        }}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => (a + 1) % suggestions.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
          } else if (e.key === 'Enter' && suggestions[active]) {
            e.preventDefault();
            pick(suggestions[active]);
          } else if (e.key === 'Escape') {
            close();
          }
        }}
        onBlur={() => window.setTimeout(close, 150)}
        placeholder={placeholder}
        className="hud-chip w-full bg-navy-900/60! px-3 py-2 pr-16 text-[16px] text-steel-100 placeholder:text-steel-500 sm:text-sm"
      />
      {trailing}
      {open && suggestions.length > 0 && pos &&
        createPortal(
          <div
            className="fixed z-[2000] overflow-hidden rounded-md border border-navy-600 bg-navy-950/95 shadow-xl backdrop-blur-md"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {suggestions.map((s, i) => (
              <button
                key={s.label + i}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={`block w-full px-3 py-2 text-left text-xs transition-colors ${
                  i === active ? 'bg-radar-500/15 text-radar-200' : 'text-steel-300 hover:bg-navy-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

const DEMO =
  typeof window !== 'undefined'
    ? Number(new URLSearchParams(window.location.search).get('demo') ?? 0)
    : 0;

const DEMO_SPEED = 14 * Math.max(1, DEMO);

const DEMO_POINT = { lat: 27.9475, lng: -82.4584 };

function buildPath(geometry: [number, number][]): { pts: [number, number][]; cum: number[] } {
  const cum = [0];
  let total = 0;
  for (let i = 1; i < geometry.length; i++) {
    const a = geometry[i - 1];
    const b = geometry[i];
    total += Math.hypot(
      (b[1] - a[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180),
      (b[0] - a[0]) * 111320,
    );
    cum.push(total);
  }
  return { pts: geometry, cum };
}

function pointAtDistance(path: { pts: [number, number][]; cum: number[] }, d: number) {
  const { pts, cum } = path;
  const total = cum[cum.length - 1];
  const target = Math.min(d, total);
  for (let i = 1; i < cum.length; i++) {
    if (cum[i] >= target) {
      const seg = cum[i] - cum[i - 1];
      const t = seg === 0 ? 0 : (target - cum[i - 1]) / seg;
      const a = pts[i - 1];
      const b = pts[i];
      return { lat: a[0] + (b[0] - a[0]) * t, lng: a[1] + (b[1] - a[1]) * t };
    }
  }
  return { lat: pts[pts.length - 1][0], lng: pts[pts.length - 1][1] };
}

const MANEUVER_ICONS: Record<number, string> = {
  1: '●',
  2: '↗',
  3: '↖',
  4: '🏁',
  5: '↑',
  6: '🏁',
  7: '🏁',
  8: '↗',
  9: '↗',
  10: '→',
  11: '←',
  12: '↗',
  13: '↖',
  14: '⤴',
  15: '←',
  16: '⤵',
  17: '↑',
  18: '↗',
  19: '↖',
  20: '↗',
  21: '↩',
  22: '↩',
  23: '↗',
  24: '↖',
  25: '↗',
  26: '↖',
};

const GH_KEY = (process.env.NEXT_PUBLIC_GRAPHHOPPER_KEY ?? '').trim();

const GH_SIGN_TO_VALHALLA: Record<number, number> = {
  [-98]: 21,
  [-8]: 21,
  [-7]: 24,
  [-6]: 21,
  [-3]: 16,
  [-2]: 11,
  [-1]: 13,
  0: 5,
  1: 12,
  2: 10,
  3: 14,
  4: 4,
  5: 5,
  6: 21,
  7: 23,
  8: 21,
};

function navGlyph(type: number): string {
  switch (type) {
    case 1:
    case 5:
    case 17:
      return '↑';
    case 2:
    case 8:
    case 9:
    case 12:
    case 18:
    case 20:
    case 23:
    case 25:
      return '↗';
    case 3:
    case 13:
    case 19:
    case 24:
    case 26:
      return '↖';
    case 10:
      return '→';
    case 11:
    case 15:
      return '←';
    case 14:
      return '⤴';
    case 16:
      return '⤵';
    case 21:
    case 22:
      return '↩';
    default:
      return '🏁';
  }
}

function distToSegment(p: RoutePoint, a: [number, number], b: [number, number]): number {
  const cos = Math.cos((p.lat * Math.PI) / 180);
  const px = p.lng * 111320 * cos;
  const py = p.lat * 111320;
  const ax = a[1] * 111320 * cos;
  const ay = a[0] * 111320;
  const bx = b[1] * 111320 * cos;
  const by = b[0] * 111320;
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distMeters(a: RoutePoint, b: RoutePoint): number {
  const cos = Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  const dx = (b.lng - a.lng) * 111320 * cos;
  const dy = (b.lat - a.lat) * 111320;
  return Math.sqrt(dx * dx + dy * dy);
}

function fmtDur(s: number): string {
  const min = Math.floor(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return `${h} hr${m ? ` ${m} min` : ''}`;
  const d = Math.floor(h / 24);
  const hr = h % 24;
  return `${d} day${d > 1 ? 's' : ''}${hr ? ` ${hr} hr` : ''}`;
}

function fmtInstr(text: string): string {
  return text.replace(/\bI (\d)/g, 'I-$1');
}

function projectToRoute(pos: RoutePoint, geometry: [number, number][]) {
  let index = 0;
  let distM = Infinity;
  for (let i = 0; i < geometry.length - 1; i++) {
    const d = distToSegment(pos, geometry[i], geometry[i + 1]);
    if (d < distM) {
      distM = d;
      index = i;
    }
  }
  return { index, distM };
}

async function fetchJson(
  url: string,
  timeoutMs = 12000,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
  retries = 1,
): Promise<unknown> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
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
  const [fromPt, setFromPt] = useState<RoutePoint | null>(null);
  const [toPt, setToPt] = useState<RoutePoint | null>(null);
  const [fromIsMyLocation, setFromIsMyLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const myLocationRef = useRef<RoutePoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [candidateCount, setCandidateCount] = useState(0);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const camerasRef = useRef<[number, number][] | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [fullscreenNav, setFullscreenNav] = useState(false);
  const [navPos, setNavPos] = useState<RoutePoint | null>(null);
  const [navMinimized, setNavMinimized] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const voiceOnRef = useRef(true);
  const prevStepRef = useRef(-1);
  const fullscreenNavRef = useRef(false);
  const lastNavPosRef = useRef<RoutePoint | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const rerouteLockRef = useRef(0);
  const mapRef = useRef<L.Map | null>(null);
  const liveDotRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  const drawLiveDot = useCallback((p: RoutePoint) => {
    const m = mapRef.current;
    if (!m) return;
    liveDotRef.current?.remove();
    liveDotRef.current = L.layerGroup([
      L.circle([p.lat, p.lng], {
        radius: 30,
        color: '#3b82f6',
        weight: 1,
        opacity: 0.35,
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
      }),
      L.circleMarker([p.lat, p.lng], {
        radius: 7,
        color: '#ffffff',
        weight: 2.5,
        fillColor: '#3b82f6',
        fillOpacity: 1,
      }),
    ]).addTo(m);
  }, []);


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

  const stopNavigation = useCallback(() => {
    if (watchIdRef.current !== null) {
      if (DEMO) clearInterval(watchIdRef.current);
      else navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    liveDotRef.current?.remove();
    liveDotRef.current = null;
    setNavigating(false);
  }, []);

  const resultRef = useRef(result);
  const findRouteRef = useRef<() => Promise<void>>(async () => {});

  const handlePosition = useCallback((p: RoutePoint) => {
    const res = resultRef.current;
    if (!res) return;
    const last = lastNavPosRef.current;
    lastNavPosRef.current = p;
    setNavPos(p);
    drawLiveDot(p);
    if (!fullscreenNavRef.current && last && (DEMO || distMeters(last, p) > 15)) {
      fullscreenNavRef.current = true;
      setFullscreenNav(true);
    }
    const { index, distM } = projectToRoute(p, res.geometry);
    const passed = res.maneuvers.filter((mv) => mv.begin_shape_index <= index).length;
    const step = Math.max(0, passed - 1);
    if (voiceOnRef.current && step !== prevStepRef.current && distM < 500) {
      const mv = res.maneuvers[step];
      if (mv?.instruction) {
        window.speechSynthesis?.cancel();
        const u = new SpeechSynthesisUtterance(fmtInstr(mv.instruction));
        u.rate = 0.95;
        window.speechSynthesis?.speak(u);
      }
    }
    prevStepRef.current = step;
    setActiveStep(step);
    const now = Date.now();
    if (distM > 50 && now - rerouteLockRef.current > 10000) {
      rerouteLockRef.current = now;
      myLocationRef.current = p;
      setFromIsMyLocation(true);
      setFrom('My location');
      findRouteRef.current();
    }
  }, [drawLiveDot]);

  const startNavigation = useCallback(() => {
    if (!result) return;
    setError(null);
    setActiveStep(0);
    rerouteLockRef.current = 0;
    setVoiceOn(true);
    voiceOnRef.current = true;
    setNavMinimized(false);
    setOpen(false);
    setFullscreenNav(true);
    fullscreenNavRef.current = true;
    setNavigating(true);
    if (DEMO) {
      const demoPath = buildPath(result.geometry);
      watchIdRef.current = runDemoSimulation({ current: demoPath }, handlePosition);
      return;
    }
    if (!('geolocation' in navigator)) {
      setError('Location tracking is not available in this browser.');
      setNavigating(false);
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handlePosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Location tracking is unavailable.'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }, [result, handlePosition]);

  useEffect(
    () => () => {
      if (watchIdRef.current !== null) {
        if (DEMO) clearInterval(watchIdRef.current);
        else navigator.geolocation.clearWatch(watchIdRef.current);
      }
      liveDotRef.current?.remove();
      liveDotRef.current = null;
    },
    [],
  );

  const clearRoute = useCallback(() => {
    stopNavigation();
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
  }, [map, stopNavigation]);

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
        ? myLocationRef.current ?? (fromPt ?? (await geocode(from)))
        : (fromPt ?? (await geocode(from)));
      const end = toPt ?? (await geocode(to));


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
        retries = 1,
        timeoutMs = 20000,
      ): Promise<{
        geometry: [number, number][];
        distance: number;
        duration: number;
        maneuvers: ValhallaManeuver[];
      }> => {
        const payload = {
          locations: [
            { lat: start.lat, lon: start.lng },
            { lat: end.lat, lon: end.lng },
          ],
          costing: 'auto',
          units: 'miles',
          ...(excludePolys.length ? { exclude_polygons: excludePolys } : {}),
        };
        const res = (await fetchJson('https://valhalla1.openstreetmap.de/route', timeoutMs, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }, retries)) as {
          trip?: {
            legs: { shape: string; maneuvers?: ValhallaManeuver[] }[];
            summary: { length: number; time: number };
          };
        };
        if (!res.trip?.legs?.length) throw new Error('No route found between these points.');

        const coords = res.trip.legs.flatMap((l) => decodePolyline(l.shape));
        const maneuvers = res.trip.legs.flatMap((l) => l.maneuvers ?? []);
        return {
          geometry: coords,
          distance: Math.round(res.trip.summary.length * 1609.344),
          duration: res.trip.summary.time,
          maneuvers,
        };
      };

      const ghRoute = async (): Promise<{
        geometry: [number, number][];
        distance: number;
        duration: number;
        maneuvers: ValhallaManeuver[];
      }> => {
        const res = (await fetchJson(
          `https://graphhopper.com/api/1/route?key=${encodeURIComponent(GH_KEY)}`,
          20000,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              points: [
                [start.lng, start.lat],
                [end.lng, end.lat],
              ],
              points_encoded: false,
              instructions: true,
              vehicle: 'car',
              locale: 'en',
            }),
          },
        )) as {
          paths?: {
            distance: number;
            time: number;
            instructions: {
              distance: number;
              time: number;
              text: string;
              sign: number;
              interval: [number, number];
            }[];
            points: { coordinates: [number, number][] };
          }[];
        };
        const path = res.paths?.[0];
        if (!path) throw new Error('No route found between these points.');
        const coords = path.points.coordinates.map(([ln, la]) => [la, ln] as [number, number]);
        const maneuvers: ValhallaManeuver[] = (path.instructions ?? []).map((inst) => ({
          begin_shape_index: inst.interval?.[0] ?? 0,
          instruction: inst.text,
          length: (inst.distance ?? 0) / 1609.344,
          time: Math.round((inst.time ?? 0) / 1000),
          type: GH_SIGN_TO_VALHALLA[inst.sign] ?? 5,
        }));
        return {
          geometry: coords,
          distance: Math.round(path.distance),
          duration: Math.round(path.time / 1000),
          maneuvers,
        };
      };

      const boxAround = (lat: number, lng: number, m: number): number[][] => {
        const dLat = m / 111320.0;
        const dLng = m / (111320.0 * Math.cos((lat * Math.PI) / 180));
        return [
          [lat - dLat, lng - dLng],
          [lat - dLat, lng + dLng],
          [lat + dLat, lng + dLng],
          [lat + dLat, lng - dLng],
          [lat - dLat, lng - dLng],
        ];
      };


      let valhallaServed = true;
      let route: Awaited<ReturnType<typeof valhallaRoute>>;
      if (GH_KEY) {
        try {
          route = await valhallaRoute([], 1, 10000);
        } catch {
          route = await ghRoute();
          valhallaServed = false;
        }
      } else {
        route = await valhallaRoute([], 2);
      }
      const excluded = new Set<string>();
      let pass = 0;
      while (valhallaServed && pass < 3) {
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
      m.fitBounds(polyline.getBounds(), {
        paddingTopLeft: [150, 340],
        paddingBottomRight: [60, 60],
      });

      setResult({
        geometry,
        distanceM: Math.round(route.distance),
        durationS: Math.round(route.duration),
        cameraHits,
        maneuvers: route.maneuvers,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(
        /abort|timed? ?out/i.test(msg)
          ? 'The route service is busy or unreachable right now. Please try again in a moment.'
          : msg || 'Route failed. Try different locations.',
      );
    } finally {
      setLoading(false);
    }
  }, [map, from, to, fromPt, toPt, fromIsMyLocation, clearRoute, getCameras]);

  useEffect(() => {
    findRouteRef.current = handleFindRoute;
    resultRef.current = result;
  });

  const fmtDist = (m: number) => {
    const ft = m * 3.28084;
    if (ft < 1000) return `${Math.round(ft)} ft`;
    const mi = ft / 5280;
    return mi < 10 ? `${mi.toFixed(2)} mi` : `${Math.round(mi)} mi`;
  };
  const useMyLocation = useCallback(() => {
    if (DEMO) {
      myLocationRef.current = DEMO_POINT;
      setFromIsMyLocation(true);
      setFrom('My location');
      setLocating(false);
      setError(null);
      return;
    }
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

  const exportDirections = useCallback(() => {
    if (!result) return;
    const lines = [
      'PRIVACY ROUTE',
      `From: ${from}  To: ${to}`,
      `${fmtDist(result.distanceM)} · ${fmtDur(result.durationS)} drive`,
      `Cameras within 400 ft: ${result.cameraHits.length}`,
      '',
      ...result.maneuvers.map(
        (mv, i) => `${i + 1}. ${fmtInstr(mv.instruction)} (${fmtDist(Math.round(mv.length * 1609.344))})`,
      ),
      '',
      'Route computed with Valhalla routing (OpenStreetMap). Red circles mark camera exposure zones.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'privacy-route.txt';
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, [result, from, to]);

  const saveRoutePhoto = useCallback(async () => {
    if (!map) return;
    setSavingPhoto(true);
    setError(null);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(map.getContainer(), {
        useCORS: true,
        backgroundColor: '#0a1622',
        scale: 2,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'privacy-route.png';
      a.click();
    } catch {
      setError('Could not capture the map photo. Try again.');
    } finally {
      setSavingPhoto(false);
    }
  }, [map]);

  const [panelMaxH, setPanelMaxH] = useState<number | undefined>(undefined);
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const measure = () => {
      const el = panelRef.current;
      if (!el) return;
      const filtersBtn = document.querySelector('button[aria-label="Toggle filters"]');
      const btnVisible = !!filtersBtn && getComputedStyle(filtersBtn).display !== 'none';
      const footer = document.querySelector('footer');
      const boundary =
        btnVisible && filtersBtn
          ? filtersBtn.getBoundingClientRect().top
          : footer
            ? footer.getBoundingClientRect().top
            : window.innerHeight;
      const top = el.getBoundingClientRect().top;
      setPanelMaxH(Math.max(140, Math.round(boundary - 12 - top)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, result]);

  const navRef = useRef<HTMLDivElement | null>(null);
  const [navMaxH, setNavMaxH] = useState<number | undefined>(undefined);
  useEffect(() => {
    const measure = () => {
      const filtersBtn = document.querySelector('button[aria-label="Toggle filters"]');
      const btnVisible = !!filtersBtn && getComputedStyle(filtersBtn).display !== 'none';
      const footer = document.querySelector('footer');
      const boundary =
        btnVisible && filtersBtn
          ? filtersBtn.getBoundingClientRect().top
          : footer
            ? footer.getBoundingClientRect().top
            : window.innerHeight;
      const el = navRef.current;
      const top = el ? el.getBoundingClientRect().top : 12;
      setNavMaxH(Math.max(140, Math.round(boundary - 12 - top)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [navigating, fullscreenNav, result]);

  const navPath = useMemo(() => (result ? buildPath(result.geometry) : null), [result]);
  const navMatched =
    navPath && result && navPos
      ? projectToRoute(navPos, result.geometry).index
      : 0;
  const navCur = result?.maneuvers[activeStep];
  const navNext = result?.maneuvers[activeStep + 1];
  const distToTurn = navPath && navNext
    ? Math.max(0, navPath.cum[navNext.begin_shape_index] - navPath.cum[navMatched])
    : 0;
  const totalM = navPath ? navPath.cum[navPath.cum.length - 1] : 0;
  const remainingM = navPath ? Math.max(0, totalM - navPath.cum[navMatched]) : 0;
  const remainingS = result
    ? result.maneuvers.slice(activeStep).reduce((a, mv) => a + (mv.time ?? 0), 0)
    : 0;
  const progressPct = totalM > 0 ? Math.min(100, Math.round(((totalM - remainingM) / totalM) * 100)) : 0;

  return (
    <>
      <div className="absolute left-1/2 top-4 z-[1000] flex -translate-x-1/2 flex-col items-center">
      <div className={navigating && navMinimized ? 'nav-active rounded-md' : ''}>
        <button
          onClick={() => {
            if (navigating) {
              fullscreenNavRef.current = true;
              setFullscreenNav(true);
              setNavMinimized(false);
              return;
            }
            setOpen((v) => !v);
            if (open) clearRoute();
          }}
          className="hud-chip px-4 py-2 text-xs"
        >
        <span className="flex items-center justify-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- small inline icon */}
          <img
            src="/privacy-shield-white.png"
            alt=""
            className="h-4 w-4"
            draggable={false}
          />
          Privacy Route
        </span>
        </button>
      </div>

      {open && (
        <div
          ref={panelRef}
          className="hud-panel mt-1 flex w-72 flex-col space-y-2 overflow-hidden p-3 sm:w-80"
          style={{ maxHeight: panelMaxH }}
        >
          <LocationSuggestions
            value={from}
            onValueChange={setFrom}
            onPick={(label, pt) => {
              setFrom(label);
              setFromPt(pt);
              if (fromIsMyLocation) setFromIsMyLocation(false);
            }}
            onClearPoint={() => setFromPt(null)}
            placeholder="From (address or city)..."
            trailing={
              <button
                onClick={useMyLocation}
                disabled={locating}
                className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-md transition-colors disabled:opacity-50 ${
                  fromIsMyLocation
                    ? 'border-radar-500/60 bg-radar-500/15 text-radar-300'
                    : 'border-navy-500/50 bg-navy-950/60 text-steel-300 hover:border-radar-500/60 hover:text-radar-300'
                }`}
                title="Use your current location as the start point"
              >
                {locating ? '…' : '📍 My location'}
              </button>
            }
          />
          <LocationSuggestions
            value={to}
            onValueChange={setTo}
            onPick={(label, pt) => {
              setTo(label);
              setToPt(pt);
            }}
            onClearPoint={() => setToPt(null)}
            placeholder="To (address or city)..."
          />
          <button
            onClick={handleFindRoute}
            disabled={loading}
            className="btn-primary w-full px-3! py-2! text-sm! disabled:opacity-50"
          >
            {loading ? 'Finding route…' : 'Find route'}
          </button>

          {error && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-400">
              {error}
            </p>
          )}

          {result && (
            <div className="relative flex min-h-0 flex-1 flex-col space-y-1.5 rounded-md border border-navy-600 bg-navy-950 px-2.5 py-2 text-[11px] text-steel-300">
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
                  ? '✅ 0 cameras within 400 ft'
                  : `⚠️ ${result.cameraHits.length} camera${result.cameraHits.length > 1 ? 's' : ''} within 400 ft`}
              </p>
              <p className="text-steel-500">
                Least-exposed of {candidateCount} candidate routes.
              </p>
              {result.cameraHits.length > 0 && (
                <p className="text-steel-400">Red circles mark camera exposure zones.</p>
              )}
              <div className="flex min-h-0 flex-1 flex-col border-t border-navy-700 pt-1.5">
                <p className="mb-1 shrink-0 font-semibold text-steel-100">
                  Turn-by-turn{result.maneuvers.length > 0 ? ` · ${result.maneuvers.length} steps` : ''}
                </p>
                <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
                  {result.maneuvers.map((mv, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-1.5 rounded-md px-1.5 py-1 transition-colors ${
                        i === activeStep && navigating
                          ? 'bg-radar-500/15 ring-1 ring-radar-500/40'
                          : i === activeStep
                            ? 'bg-navy-800'
                            : ''
                      }`}
                    >
                      <span className="mt-px w-4 shrink-0 text-center text-[11px] leading-4 text-radar-300">
                        {MANEUVER_ICONS[mv.type] ?? '·'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] leading-snug text-steel-100">{fmtInstr(mv.instruction)}</p>
                        <p className="text-[10px] text-steel-500">
                          {fmtDist(Math.round(mv.length * 1609.344))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="shrink-0 space-y-1.5">
                {navigating && navMinimized ? (
                  <>
                    <button
                      onClick={() => setNavMinimized(false)}
                      className="btn-primary mt-1.5 w-full px-2! py-1! text-[11px]!"
                    >
                      ▶ Resume navigation
                    </button>
                    <button
                      onClick={() => {
                        stopNavigation();
                        fullscreenNavRef.current = false;
                        setFullscreenNav(false);
                        setNavMinimized(false);
                      }}
                      className="mt-1 w-full rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                    >
                      ■ Stop navigation
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      if (navigating) {
                        stopNavigation();
                        fullscreenNavRef.current = false;
                        setFullscreenNav(false);
                        setNavMinimized(false);
                      } else {
                        startNavigation();
                      }
                    }}
                    className={`mt-1.5 w-full px-2! py-1! text-[11px]! ${
                      navigating
                        ? 'rounded-md border border-red-500/40 bg-red-500/10 font-semibold text-red-400 transition-colors hover:bg-red-500/20'
                        : 'btn-primary'
                    }`}
                  >
                    {navigating ? '■ Stop navigation' : '▶ Start navigation'}
                  </button>
                )}
                {navigating && (
                  <p className="pt-1 text-center text-[10px] text-steel-500">
                    {DEMO
                      ? 'Demo mode: simulating a moving position along the route.'
                      : 'Tracking your position on this device. Auto-reroutes if you leave the route.'}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 pt-0.5">
                <button
                  onClick={saveRoutePhoto}
                  disabled={savingPhoto}
                  className="btn-secondary flex-1 px-2! py-1! text-[11px]! disabled:opacity-50"
                >
                  {savingPhoto ? 'Capturing…' : 'Save route photo'}
                </button>
                <button
                  onClick={exportDirections}
                  className="btn-secondary flex-1 px-2! py-1! text-[11px]!"
                >
                  Directions (.txt)
                </button>
              </div>
              <button
                onClick={clearRoute}
                className="btn-secondary mt-1 w-full px-2! py-1! text-[11px]!"
              >
                Clear route
              </button>
                </div>
            </div>
          )}
        </div>
      )}
      </div>
      {navigating && fullscreenNav && !navMinimized && result && (
        <div className="pointer-events-none fixed inset-0 z-[2000] flex items-start justify-center p-3 sm:p-6">
          <div
            ref={navRef}
            className="pointer-events-auto hud-panel flex w-full max-w-md flex-col space-y-2 overflow-hidden p-3"
            style={{ maxHeight: navMaxH }}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const next = !voiceOn;
                  setVoiceOn(next);
                  voiceOnRef.current = next;
                }}
                aria-label="Toggle voice guidance"
                title="Voice guidance"
                className={`hud-chip px-2! py-1! ${
                  voiceOn ? 'text-radar-300!' : 'text-steel-400 hover:text-radar-300'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  {voiceOn && (
                    <>
                      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                    </>
                  )}
                </svg>
              </button>
              <span className="mono-data whitespace-nowrap text-[9px] tracking-[0.16em] text-steel-500 sm:text-[10px] sm:tracking-[0.2em]">
                NAVIGATION{' '}
                <span className="text-steel-300">{fmtDist(remainingM)}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setNavMinimized(true);
                    setOpen(true);
                  }}
                  aria-label="Minimize navigation"
                  className="hud-chip px-2! py-1! text-[10px]! font-bold! text-steel-300 hover:text-radar-300 sm:px-2.5! sm:text-[11px]!"
                >
                  −
                </button>
                <button
                  onClick={() => {
                    fullscreenNavRef.current = false;
                    setFullscreenNav(false);
                  }}
                  className="hud-chip px-2! py-1! text-[9px]! tracking-[0.12em]! text-steel-200 hover:text-radar-300 sm:px-3! sm:py-1.5! sm:text-[10px]! sm:tracking-[0.14em]!"
                >
                  EXIT
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-col items-center justify-center gap-3 px-1 text-center sm:gap-6">
              {navCur && (
                <span className="text-6xl leading-none text-radar-300 sm:text-8xl">
                  {navGlyph(navCur.type)}
                </span>
              )}
              <p className="max-w-md text-lg font-semibold leading-snug text-steel-100 sm:text-2xl">
                {fmtInstr(navCur?.instruction ?? '')}
              </p>
              <p className="mono-data text-4xl font-bold text-radar-300 sm:text-6xl">
                {(() => {
                  const t = fmtDist(distToTurn);
                  const sp = t.indexOf(' ');
                  return (
                    <>
                      {sp > 0 ? t.slice(0, sp) : t}
                      {sp > 0 && (
                        <span className="ml-1 text-2xl font-medium text-radar-300/80 sm:text-3xl">
                          {t.slice(sp + 1)}
                        </span>
                      )}
                    </>
                  );
                })()}
              </p>
              {navNext && (
                <div className="hud-chip max-w-full justify-start gap-2.5 overflow-hidden rounded-md px-3 py-2 text-left text-xs text-steel-300 sm:gap-3 sm:px-3.5 sm:text-sm">
                  <span className="shrink-0 text-base leading-none text-steel-100 sm:text-lg">
                    {navGlyph(navNext.type)}
                  </span>
                  <span className="truncate">{fmtInstr(navNext.instruction)}</span>
                </div>
              )}
            </div>
            <div className="space-y-2 border-t border-navy-700 pt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-800">
                <div className="h-full rounded-full bg-radar-500" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="mono-data min-w-0 truncate whitespace-nowrap text-[9px] text-steel-500 sm:text-[10px]">
                  {remainingM > 0 ? `${fmtDist(remainingM)} · ${fmtDur(remainingS)} remaining` : 'Arrived'}
                </span>
                <button
                  onClick={() => {
                    stopNavigation();
                    fullscreenNavRef.current = false;
                    setFullscreenNav(false);
                    setOpen(true);
                    clearRoute();
                  }}
                className="btn-secondary whitespace-nowrap border-red-800/80! bg-red-950/50! px-3! py-1.5! text-[10px]! text-red-200! transition-colors hover:border-red-500! hover:bg-red-900/60! hover:text-red-100! sm:text-[11px]!"
              >
                END NAVIGATION
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
