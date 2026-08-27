'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface ReportCameraProps {
  map: L.Map | null;
  onClose: () => void;
}

const PIN_ICON = L.divIcon({
  className: '',
  html: '<div style="font-size:34px;line-height:1;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5));">&#128205;</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

export default function ReportCamera({ map, onClose }: ReportCameraProps) {
  const pinRef = useRef<L.Marker | null>(null);
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const updatePin = useCallback(
    (lat: number, lng: number, fly = true) => {
      setPos([lat, lng]);
      if (!map) return;
      if (pinRef.current) {
        pinRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: PIN_ICON, draggable: true, zIndexOffset: 1000 }).addTo(map);
        marker.on('dragend', () => {
          const p = marker.getLatLng();
          setPos([p.lat, p.lng]);
        });
        pinRef.current = marker;
      }
      if (fly) map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
    },
    [map],
  );

  const locateMe = useCallback(() => {
    setLocating(true);
    setError(null);
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not available in this browser.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        updatePin(p.coords.latitude, p.coords.longitude);
        setLocating(false);
      },
      () => {
        setError('Could not get your location. Drag the pin instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [updatePin]);

  useEffect(() => {
    let cancelled = false;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          if (!cancelled) updatePin(p.coords.latitude, p.coords.longitude);
        },
        () => {
          // no-op; the user can drag the pin or use the locate button
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
    return () => {
      cancelled = true;
      pinRef.current?.remove();
      pinRef.current = null;
    };
  }, [updatePin]);

  const onFile = useCallback((file: File | null) => {
    if (!file) {
      setPhoto(null);
      setPhotoName(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result));
      setPhotoName(file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  const submit = useCallback(async () => {
    if (!pos) {
      setError('Set the pin location first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/report-camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: pos[0], lng: pos[1], photo, notes: notes.trim() || null }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Report failed. Please try again.');
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError('Report failed. Please try again.');
      setSubmitting(false);
    }
  }, [pos, photo, notes]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[1400] flex items-start justify-center p-3 sm:p-6">
      <div className="pointer-events-auto hud-panel hud-card flex w-full max-w-sm flex-col space-y-2 overflow-hidden p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="mono-data text-[10px] uppercase tracking-[0.18em] text-steel-300">
            Report a camera
          </p>
          <button
            onClick={onClose}
            aria-label="Close report"
            className="hud-chip px-2! py-1! text-[10px]!"
          >
            Cancel
          </button>
        </div>

        {done ? (
          <div className="space-y-2 py-2 text-center">
            <p className="text-sm text-steel-100">Report submitted for review.</p>
            <p className="text-xs text-steel-500">
              The owner will approve it before the camera appears on the map.
            </p>
            <button onClick={onClose} className="btn-primary w-full px-3! py-2! text-xs!">
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-steel-300">
              {pos
                ? `Pin placed at ${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}. Drag it to the exact spot.`
                : 'Locating you...'}
            </p>

            <button
              onClick={locateMe}
              disabled={locating}
              className="btn-secondary w-full px-3! py-2! text-xs! font-semibold!"
            >
              {locating ? 'Locating...' : 'Use my location'}
            </button>

            <label className="block">
              <span className="mb-1 block text-xs text-steel-300">Photo (optional)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                className="hud-chip w-full cursor-pointer px-3! py-2! text-xs! text-steel-300 file:mr-2 file:border-0 file:bg-transparent file:p-0 file:text-xs file:font-semibold file:text-radar-300"
              />
              {photoName && <span className="mt-1 block truncate text-[10px] text-steel-500">{photoName}</span>}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-steel-300">Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. pole-mounted camera at the intersection"
                className="hud-chip w-full resize-none px-3! py-2! text-xs! text-steel-100 placeholder:text-steel-500"
              />
            </label>

            {error && <p className="text-xs text-red-300">{error}</p>}

            <button
              onClick={submit}
              disabled={submitting || !pos}
              className="btn-primary w-full px-3! py-2! text-xs!"
            >
              {submitting ? 'Submitting...' : 'Submit for review'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
