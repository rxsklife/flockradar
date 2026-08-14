'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { getLegendItem } from '@/lib/legend';
import type { GeoJSONFeature, LocationGeoJSON, MarkerProperties, EntitySummary } from '@/lib/types';
import SearchBar from './SearchBar';
import PrivacyRoute from './PrivacyRoute';
import FilterBar from './FilterBar';
import Legend from './Legend';
import TutorialHint from './TutorialHint';

const MAP_CENTER: [number, number] = [38.5, -92.6];
const MAP_ZOOM = 6;

const TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const DETAILED_TILE_URL = 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
const DETAILED_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const FALLBACK_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const FALLBACK_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const STATE_CENTERS: Record<string, [number, number]> = {
  AL: [32.8, -86.8], AK: [63.6, -152.5], AZ: [34.2, -111.7], AR: [34.8, -92.4],
  CA: [37.2, -119.7], CO: [39.0, -105.5], CT: [41.6, -72.7], DE: [39.0, -75.5],
  FL: [28.6, -81.7], GA: [32.7, -83.5], HI: [20.5, -157.5], ID: [44.1, -114.6],
  IL: [40.0, -89.4], IN: [40.0, -86.3], IA: [42.0, -93.5], KS: [38.5, -98.4],
  KY: [37.5, -85.3], LA: [31.1, -92.0], ME: [45.3, -69.3], MD: [39.0, -76.6],
  MA: [42.3, -71.8], MI: [44.3, -84.7], MN: [46.3, -94.3], MS: [32.7, -89.7],
  MO: [38.5, -92.6], MT: [47.0, -109.5], NE: [41.5, -99.8], NV: [39.3, -117.0],
  NH: [43.7, -71.6], NJ: [40.1, -74.5], NM: [34.4, -106.1], NY: [42.9, -75.5],
  NC: [35.6, -79.4], ND: [47.5, -100.4], OH: [40.3, -82.8], OK: [35.6, -97.5],
  OR: [43.9, -120.6], PA: [40.9, -77.6], RI: [41.7, -71.5], SC: [33.9, -80.9],
  SD: [44.4, -100.3], TN: [35.8, -86.3], TX: [31.5, -99.3], UT: [39.3, -111.7],
  VT: [44.0, -72.7], VA: [37.5, -78.7], WA: [47.4, -120.4], WV: [38.6, -80.6],
  WI: [44.6, -89.8], WY: [43.0, -107.5],
};

type Filters = Record<string, string | undefined>;

const STATUS_COLORS: Record<string, string> = {
  confirmed_active: '#ef4444',
  confirmed_approved_pending: '#f97316',
  proposed: '#eab308',
  previously_deployed_removed: '#8b95a5',
  no_public_disclosure: '#64748b',
  under_review: '#fbbf24',
};

function degreesToCardinal(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

function countCommunityInBounds(
  bounds: L.LatLngBounds,
  zoom: number,
  grids: Map<string, number[]>[] | null,
): number {
  if (!grids) return 0;
  const cellSize = zoom <= 7 ? 1 : zoom <= 10 ? 0.1 : 0.01;
  const grid = grids[zoom <= 7 ? 0 : zoom <= 10 ? 1 : 2];
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const lat0 = Math.floor(sw.lat / cellSize);
  const lat1 = Math.floor(ne.lat / cellSize);
  const lng0 = Math.floor(sw.lng / cellSize);
  const lng1 = Math.floor(ne.lng / cellSize);
  let total = 0;
  for (let lat = lat0; lat <= lat1; lat++) {
    for (let lng = lng0; lng <= lng1; lng++) {
      total += (grid.get(`${lat},${lng}`) ?? []).length;
    }
  }
  return total;
}

function collectCommunityIndices(
  bounds: L.LatLngBounds,
  zoom: number,
  grids: Map<string, number[]>[] | null,
  cap: number,
): number[] {
  if (!grids) return [];
  const cellSize = zoom <= 7 ? 1 : zoom <= 10 ? 0.1 : 0.01;
  const grid = grids[zoom <= 7 ? 0 : zoom <= 10 ? 1 : 2];
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const lat0 = Math.floor(sw.lat / cellSize);
  const lat1 = Math.floor(ne.lat / cellSize);
  const lng0 = Math.floor(sw.lng / cellSize);
  const lng1 = Math.floor(ne.lng / cellSize);
  const out: number[] = [];
  for (let lat = lat0; lat <= lat1; lat++) {
    for (let lng = lng0; lng <= lng1; lng++) {
      const bucket = grid.get(`${lat},${lng}`);
      if (!bucket) continue;
      for (const idx of bucket) {
        out.push(idx);
        if (out.length >= cap) return out;
      }
    }
  }
  return out;
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const PULSE_DURATION_MS = 2400;

function pulseDelayValue(): string {
  const phaseMs = Date.now() % PULSE_DURATION_MS;
  return `-${(phaseMs / 1000).toFixed(3)}s`;
}
function pulseDelayStyle(): string {
  return `animation-delay:${pulseDelayValue()};`;
}

function installPulseSync(map: L.Map): MutationObserver {
  const pane = map.getPane('markerPane') ?? map.getContainer();
  const observer = new MutationObserver((records) => {


    let delay: string | null = null;
    for (const rec of records) {
      for (const node of Array.from(rec.addedNodes)) {
        if (!(node instanceof HTMLElement)) continue;
        const pulses: HTMLElement[] = [];
        if (node.classList.contains('flock-pulse')) {
          pulses.push(node);
        }
        node.querySelectorAll('.flock-pulse').forEach((el) => pulses.push(el as HTMLElement));
        if (pulses.length === 0) continue;
        delay ??= pulseDelayValue();
        for (const el of pulses) {
          el.style.animationDelay = delay;
        }
      }
    }
  });
  observer.observe(pane, { childList: true, subtree: true });
  return observer;
}

function buildIcon(p: MarkerProperties): L.DivIcon {
  const size = 32;
  const pulse =
    p.status === 'confirmed_active'
      ? `<div class="flock-pulse" style="background:${STATUS_COLORS[p.status] || '#ef4444'};${pulseDelayStyle()}"></div>`
      : '';
  const html = `
    <div class="flock-marker">
      ${pulse}
      <img src="/police-marker.png" alt="" draggable="false"
           style="width:${size}px;height:${size}px;display:block;" />
    </div>`;

  return L.divIcon({
    className: '',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function buildCommunityCameraIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div class="flock-marker">
        <div class="flock-camera">
          <img src="/flock-marker.png" alt="" draggable="false" />
        </div>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function popupOptions(): L.PopupOptions {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (!isMobile) return { closeButton: true, maxWidth: 300 };



  const mapEl = document.querySelector('.leaflet-container');
  const mapH = mapEl ? mapEl.clientHeight : window.innerHeight - 230;
  const maxHeight = Math.max(140, Math.min(400, mapH - 310 - 50));
  return {
    closeButton: true,
    maxWidth: 280,
    maxHeight,
    autoPanPaddingTopLeft: L.point(10, 180),
    autoPanPaddingBottomRight: L.point(10, 130),
  };
}

function communityCameraPopupHtml(
  lat: number,
  lng: number,
  address?: string | null,
): string {
  const latS = lat.toFixed(6);
  const lngS = lng.toFixed(6);

  const mapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  return `
    <div class="community-popup" style="min-width: 220px;">
      <p class="community-popup-title" style="margin:0 0 6px;font-weight:600;font-size:13px;color:#e6f0fa;">Community Reported Camera</p>
      ${
        address
          ? `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="display:block;margin:0 0 4px;font-size:12px;color:#20b8c8;text-decoration:none;line-height:1.4;" title="Open in Street View">${escapeHtml(address)}</a>`
          : `<p style="margin:0 0 4px;font-size:12px;color:#8fa3b8;">Looking up address…</p>`
      }
      <p class="community-popup-coords" style="margin:0 0 2px;font-size:12px;color:#8fa3b8;font-family:monospace;">
        ${latS}, ${lngS}
      </p>
      <p style="margin:0 0 8px;font-size:11px;color:#8fa3b8;">
        Crowdsourced, unverified. May not be an actual camera.
      </p>
      <a
        href="${mapsUrl}"
        target="_blank"
        rel="noopener noreferrer"
        style="display:block;text-align:center;padding:6px 10px;border-radius:6px;background:#20b8c8;color:#0f1f30;font-weight:600;font-size:12px;text-decoration:none;"
      >
        Open in Street View ↗
      </a>
    </div>`;
}

const addressCache = new Map<string, string | null>();
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = addressCache.get(key);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { display_name?: string };
    const addr = data.display_name ?? null;
    addressCache.set(key, addr);
    return addr;
  } catch {
    addressCache.set(key, null);
    return null;
  }
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const clusterGroup = useRef<L.MarkerClusterGroup | null>(null);
  const communityLayerRef = useRef<L.LayerGroup | null>(null);



  const forcedCommunityBoundsRef = useRef<L.LatLngBounds | null>(null);


  const communityRebuildRef = useRef<(() => void) | null>(null);




  const communityGridsRef = useRef<Map<string, number[]>[] | null>(null);


  const communityCountsVisibleRef = useRef(true);


  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [filters, setFilters] = useState<Filters>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [markerCount, setMarkerCount] = useState<number | null>(null);
  const [communityTotal, setCommunityTotal] = useState<number | null>(null);
  const [communityOn, setCommunityOn] = useState(true);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [basemap, setBasemap] = useState<'dark' | 'detailed'>('detailed');
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const featuresRef = useRef<GeoJSONFeature[]>([]);


  const tileErrorsRef = useRef(0);
  const fallbackActiveRef = useRef(false);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const userLocationRef = useRef<[number, number] | null>(null);

  const pendingLocRef = useRef<[number, number] | null>(null);
  const pendingAccRef = useRef(40);

  const userDotLayerRef = useRef<L.Layer | null>(null);
  const [showLocateButton, setShowLocateButton] = useState(false);
  const locateCheckRef = useRef<(() => void) | null>(null);

  const pulseObserverRef = useRef<MutationObserver | null>(null);


  const interactedRef = useRef(false);

  const flyToEntity = useCallback((entity: EntitySummary) => {
    const m = map.current;
    if (!m) return;
    const match = featuresRef.current.find((f) => f.properties.entityName === entity.name);
    if (match) {
      const [lng, lat] = match.geometry.coordinates;
      m.flyTo([lat, lng], 10);
      const marker = markersRef.current.get(match.properties.id);
      if (marker) {


        clusterGroup.current?.zoomToShowLayer(marker, () => marker.openPopup());
      }
    } else if (entity.city) {

      const center = STATE_CENTERS[entity.state];
      if (center) m.flyTo(center, 6.5);
    }
  }, []);

  const renderMarkers = useCallback((features: GeoJSONFeature[]) => {
    const group = clusterGroup.current;
    if (!group) return;
    group.clearLayers();
    markersRef.current.clear();

    const markers: L.Marker[] = features.map((feature) => {
      const p = feature.properties;
      const [lng, lat] = feature.geometry.coordinates;
      const marker = L.marker([lat, lng], { icon: buildIcon(p) });



      marker.bindPopup(() => popupHtml(p, lat, lng), popupOptions());
      marker.on('click', () => {
        void reverseGeocode(lat, lng).then((address) => {
          if (marker.isPopupOpen()) {
            marker.setPopupContent(popupHtml(p, lat, lng, address));
          }
        });
      });
      markersRef.current.set(p.id, marker);
      return marker;
    });

    group.addLayers(markers);
  }, []);

  const loadMarkers = useCallback(
    async (f: Filters) => {
      const params = new URLSearchParams();
      if (f.state) params.set('state', f.state);
      if (f.status) params.set('status', f.status);
      if (f.entityType) params.set('entityType', f.entityType);
      if (f.vendor) params.set('vendor', f.vendor);
      if (f.sourceStrength) params.set('sourceStrength', f.sourceStrength);

      const res = await fetch(`/api/markers${params.toString() ? `?${params}` : ''}`);
      const geojson: LocationGeoJSON = await res.json();

      let features = geojson.features;
      if (f.pointType === 'entity_level') {
        features = features.filter((feat) => !feat.properties.isExactLocation);
      } else if (f.pointType === 'exact') {
        features = features.filter((feat) => feat.properties.isExactLocation);
      }

      featuresRef.current = features;
      setMarkerCount(features.length);
      renderMarkers(features);
    },
    [renderMarkers],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value || undefined };


        if (key === 'state') {
          const center = value ? STATE_CENTERS[value] : MAP_CENTER;
          if (center) map.current?.flyTo(center, value ? 6 : MAP_ZOOM);
        }

        loadMarkers(next);
        return next;
      });
    },
    [loadMarkers],
  );


  const toggleCommunityLayer = useCallback(
    async (on: boolean) => {
      const m = map.current;
      if (!m) return;
      setCommunityOn(on);
      communityCountsVisibleRef.current = on;


      clusterGroup.current?.refreshClusters();

      if (!on) {
        forcedCommunityBoundsRef.current = null;
        communityRebuildRef.current = null;
        const layer = communityLayerRef.current as unknown as {
          _sync?: () => void;
        } | null;

        if (layer?._sync) {
          m.off('zoomend', layer._sync);
          m.off('moveend', layer._sync);
        }
        communityLayerRef.current?.remove();
        communityLayerRef.current = null;
        if (layer) (layer as unknown as { _dispose?: () => void })._dispose?.();
        return;
      }


      if (communityLayerRef.current) {
        communityLayerRef.current.addTo(m);
        return;
      }

      setCommunityLoading(true);
      try {
        const res = await fetch('/community-cameras.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: [number, number, number | null][] = await res.json();
        if (data.length === 0) return;
        setCommunityTotal(data.length);






        if (map.current !== m) return;
        const grids: Map<string, number[]>[] = [new Map(), new Map(), new Map()];
        const cellSizes = [1, 0.1, 0.01];
        for (let i = 0; i < data.length; i++) {
          const [lat, lng] = data[i];
          for (let g = 0; g < cellSizes.length; g++) {
            const key = `${Math.floor(lat / cellSizes[g])},${Math.floor(lng / cellSizes[g])}`;
            let bucket = grids[g].get(key);
            if (!bucket) {
              bucket = [];
              grids[g].set(key, bucket);
            }
            bucket.push(i);
          }
        }
        communityGridsRef.current = grids;


        clusterGroup.current?.refreshClusters();




        if (map.current !== m) return;









        const group = L.layerGroup();
        let iconGroup: L.LayerGroup | null = null;
        let rebuildTimer: ReturnType<typeof setTimeout> | null = null;



        let buildGen = 0;


        let disposed = false;
        const isAlive = () => !disposed && map.current === m;

        const rebuildIcons = () => {
          if (!isAlive()) return;
          buildGen += 1;
          const gen = buildGen;





          let openLatLng: [number, number] | null = null;
          if (iconGroup) {
            iconGroup.eachLayer((layer) => {
              if (!openLatLng && (layer as L.Marker).isPopupOpen?.()) {
                const ll = (layer as L.Marker).getLatLng();
                if (ll) openLatLng = [ll.lat, ll.lng];
              }
            });
            iconGroup.remove();
            iconGroup = null;
          }
          const z = m.getZoom();
          const forced = forcedCommunityBoundsRef.current;


          const bounds = forced ?? m.getBounds();
          if (!forced && z < 10) return;


          const indices = collectCommunityIndices(bounds, z, communityGridsRef.current, 1200);
          if (indices.length === 0) return;
          const newGroup = L.layerGroup();
          iconGroup = newGroup;
          newGroup.addTo(m);


          const markersByKey = new Map<string, L.Marker>();





          const CHUNK = 150;
          let i = 0;
          const step = () => {
            if (!isAlive() || gen !== buildGen) return;
            const end = Math.min(i + CHUNK, indices.length);
            for (; i < end; i++) {
              const [lat, lng] = data[indices[i]];
              const marker = L.marker([lat, lng], {
                icon: buildCommunityCameraIcon(),
                interactive: true,
                keyboard: true,
                title: 'Community reported camera (click for details)',
              });
              marker.bindPopup(communityCameraPopupHtml(lat, lng), popupOptions());

              marker.on('click', () => {
                void reverseGeocode(lat, lng).then((address) => {
                  if (marker.isPopupOpen()) {
                    marker.setPopupContent(communityCameraPopupHtml(lat, lng, address));
                  }
                });
              });
              markersByKey.set(`${lat.toFixed(6)},${lng.toFixed(6)}`, marker);
              newGroup.addLayer(marker);
            }
            if (i < indices.length) {
              setTimeout(step, 16);
            } else if (openLatLng) {




              const target: [number, number] = openLatLng;
              const restored = markersByKey.get(
                `${target[0].toFixed(6)},${target[1].toFixed(6)}`,
              );
              if (restored) {
                restored.openPopup();
                void reverseGeocode(target[0], target[1]).then((address) => {
                  if (restored.isPopupOpen()) {
                    restored.setPopupContent(
                      communityCameraPopupHtml(target[0], target[1], address),
                    );
                  }
                });
              }
            }
          };
          setTimeout(step, 16);
        };

        const scheduleRebuild = () => {
          if (rebuildTimer) clearTimeout(rebuildTimer);
          rebuildTimer = setTimeout(rebuildIcons, 120);
        };




        const syncTiers = () => {
          if (!isAlive()) return;
          const z = m.getZoom();
          const forced = forcedCommunityBoundsRef.current;
          if (forced) {



            if (!m.getBounds().intersects(forced)) {
              forcedCommunityBoundsRef.current = null;
            } else {
              scheduleRebuild();
              return;
            }
          }
          if (z >= 10) {
            scheduleRebuild();
          } else {
            if (iconGroup) {
              iconGroup.remove();
              iconGroup = null;
            }
          }
        };

        m.on('zoomend', syncTiers);
        m.on('moveend', syncTiers);
        syncTiers();

        communityLayerRef.current = group;
        group.addTo(m);
        (group as unknown as { _sync?: () => void })._sync = syncTiers;
        communityRebuildRef.current = () => {
          if (!disposed) scheduleRebuild();
        };
        (group as unknown as { _dispose?: () => void })._dispose = () => {
          disposed = true;
          if (rebuildTimer) clearTimeout(rebuildTimer);
          communityRebuildRef.current = null;
        };
      } catch (err) {
        console.error('Failed to load community layer:', err);
        setCommunityOn(false);
      } finally {
        setCommunityLoading(false);
      }
    },
    [],
  );


  const createTileLayer = useCallback((mode: 'dark' | 'detailed' | 'fallback') => {
    let url: string;
    let attribution: string;
    if (mode === 'fallback') {
      url = FALLBACK_TILE_URL;
      attribution = FALLBACK_TILE_ATTRIBUTION;
    } else if (mode === 'detailed') {
      url = DETAILED_TILE_URL;
      attribution = DETAILED_TILE_ATTRIBUTION;
    } else {
      url = TILE_URL;
      attribution = TILE_ATTRIBUTION;
    }
    const layer = L.tileLayer(url, { attribution, maxZoom: 19 });
    layer.on('tileerror', () => {
      tileErrorsRef.current += 1;

      if (tileErrorsRef.current >= 3 && !fallbackActiveRef.current) {
        fallbackActiveRef.current = true;
        console.warn('FlockRadar: CARTO tiles blocked; switching to OSM fallback basemap');
        const m = map.current;
        if (m) {
          m.removeLayer(layer);
          const fallback = L.tileLayer(FALLBACK_TILE_URL, {
            attribution: FALLBACK_TILE_ATTRIBUTION,
            maxZoom: 19,
          });
          tileLayerRef.current = fallback;
          fallback.addTo(m);
          fallback.bringToBack();
        }
      }
    });
    layer.on('load', () => {
      tileErrorsRef.current = 0;
    });
    return layer;
  }, []);


  const handleBasemapChange = useCallback(
    (mode: 'dark' | 'detailed') => {
      const m = map.current;
      if (!m) return;
      setBasemap(mode);
      const current = tileLayerRef.current;
      if (current) m.removeLayer(current);
      const next = createTileLayer(mode);
      tileLayerRef.current = next;
      next.addTo(m);
      next.bringToBack();
    },
    [createTileLayer],
  );


  const handleMobileFilterChange = useCallback(
    (key: string, value: string) => {
      handleFilterChange(key, value);
      setShowMobileFilters(false);
    },
    [handleFilterChange],
  );

  useEffect(() => {
    if (!('geolocation' in navigator) || !('permissions' in navigator)) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (status.state !== 'granted' || cancelled) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            pendingLocRef.current = [pos.coords.latitude, pos.coords.longitude];
            pendingAccRef.current = pos.coords.accuracy ?? 40;
          },
          () => {},
          { maximumAge: 60000, timeout: 6000 },
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const pending = pendingLocRef.current;
    const m = L.map(mapContainer.current, {
      center: pending ?? MAP_CENTER,
      zoom: pending ? 17 : MAP_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });

    const tileLayer = createTileLayer('detailed');
    tileLayerRef.current = tileLayer;
    tileLayer.addTo(m);



    L.control.zoom({ position: 'bottomright' }).addTo(m);



    const group = L.markerClusterGroup({
      maxClusterRadius: 60,
      chunkedLoading: true,
      chunkInterval: 40,
      chunkDelay: 15,
      disableClusteringAtZoom: 12,



      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) => {



        const verified = cluster.getChildCount();
        const community = communityCountsVisibleRef.current
          ? countCommunityInBounds(cluster.getBounds(), m.getZoom(), communityGridsRef.current)
          : 0;
        const total = verified + community;
        return L.divIcon({
          className: '',
          html: `<div style="width:44px;height:44px;background:#20b8c8;opacity:0.85;border:2px solid #0f1f30;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#0f1f30;font-weight:700;font-size:12px;line-height:1.15;">${total}<span style="font-size:6px;font-weight:600;opacity:0.75;white-space:nowrap;">tap for more</span></div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
      },
    });
    group.addTo(m);
    clusterGroup.current = group;








    group.on('clusterclick', (e) => {
      const cluster = (e as unknown as { layer?: { getBounds?: () => L.LatLngBounds } }).layer;
      const raw = cluster?.getBounds?.();
      if (raw) {
        forcedCommunityBoundsRef.current = raw.pad(1.5);
        let fired = false;
        const settle = () => {
          if (fired) return;
          fired = true;
          m.off('moveend', settle);
          communityRebuildRef.current?.();
        };
        m.once('moveend', settle);



        setTimeout(settle, 1000);
      }
    });

    m.on('zoomend moveend', () => {

    });

    map.current = m;
    (window as unknown as { __flockMap?: L.Map }).__flockMap = m;
    setMapInstance(m);
    setMapReady(true);

    const drawUserDot = (ll: [number, number], accuracy: number) => {
      const dotGroup = L.layerGroup([
        L.circle(ll, {
          radius: Math.max(accuracy, 20),
          color: '#3b82f6',
          weight: 1,
          opacity: 0.35,
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
        }),
        L.circleMarker(ll, {
          radius: 7,
          color: '#ffffff',
          weight: 2.5,
          fillColor: '#3b82f6',
          fillOpacity: 1,
        }),
      ]);
      userDotLayerRef.current?.remove();
      dotGroup.addTo(m);
      userDotLayerRef.current = dotGroup;
    };

    if (pending) {
      const ll = pending as [number, number];
      userLocationRef.current = ll;
      setUserLocation(ll);
      drawUserDot(ll, pendingAccRef.current);
    }





    const pulseObserver = installPulseSync(m);
    pulseObserverRef.current = pulseObserver;
    loadMarkers({});

    void toggleCommunityLayer(true);


    if (!pending && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (map.current !== m) return;
          const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(ll);
          userLocationRef.current = ll;

          const accuracy = pos.coords.accuracy ?? 40;
          drawUserDot(ll, accuracy);

          if (!interactedRef.current) {
            m.setView(ll, 17, { animate: false });
          }
        },
        () => {
          setUserLocation(null);
          userLocationRef.current = null;
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 },
      );
    }


    m.on('dragstart', () => {
      interactedRef.current = true;
    });
    m.on('zoomstart', () => {
      interactedRef.current = true;
    });



    const checkLocateVisibility = () => {
      const ul = userLocationRef.current;
      if (!ul) {
        setShowLocateButton(false);
        return;
      }
      const center = m.getCenter();
      const dist =
        haversineMeters([center.lat, center.lng], ul) ?? Infinity;

      setShowLocateButton(dist > 3000 || m.getZoom() < 15);
    };
    m.on('moveend', checkLocateVisibility);
    m.on('zoomend', checkLocateVisibility);
    locateCheckRef.current = checkLocateVisibility;

    return () => {

      const layer = communityLayerRef.current as unknown as {
        _sync?: () => void;
      } | null;
      if (layer?._sync) {
        m.off('zoomend', layer._sync);
        m.off('moveend', layer._sync);
      }
      const locCheck = locateCheckRef.current;
      if (locCheck) {
        m.off('moveend', locCheck);
        m.off('zoomend', locCheck);
      }
      m.remove();
      map.current = null;
      clusterGroup.current = null;
      communityLayerRef.current = null;
      userDotLayerRef.current?.remove();
      userDotLayerRef.current = null;
      pulseObserverRef.current?.disconnect();
      pulseObserverRef.current = null;
    };
  }, [loadMarkers, toggleCommunityLayer, createTileLayer]);

  return (
    <div className="relative flex-1 w-full min-h-0">
      <div
        ref={mapContainer}
        className={`absolute inset-0 ${basemap === 'detailed' ? 'basemap-detailed' : 'basemap-dark'}`}
      />

      <div className="hidden sm:block">
        <SearchBar onSelect={flyToEntity} />
      </div>
      {mapReady && mapInstance && <PrivacyRoute map={mapInstance} />}
      {mapReady && <TutorialHint />}

      <button
        onClick={() => setShowMobileFilters((v) => !v)}
        className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-steel-100 shadow-lg ring-1 ring-navy-600 sm:hidden"
        aria-label="Toggle filters"
      >
        {showMobileFilters ? 'Close' : 'Filters'}
      </button>

      {markerCount !== null && (
        <div className="absolute left-1/2 top-4 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-navy-950/90 px-3 py-1.5 ring-1 ring-navy-600">
          <div className="text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-steel-300">
              <span className="live-ping shrink-0" aria-hidden="true" />
              {(markerCount + (communityOn && communityTotal ? communityTotal : 0)).toLocaleString()}{' '}
              {(markerCount + (communityOn && communityTotal ? communityTotal : 0)) === 1 ? 'marker' : 'markers'}
            </p>
            {communityOn && communityTotal && (
              <p className="mt-0.5 text-[10px] leading-tight text-steel-400">
                {markerCount.toLocaleString()} verified · {communityTotal.toLocaleString()} community submitted
              </p>
            )}
          </div>
        </div>
      )}

      {markerCount === 0 && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center">
          <div className="mx-4 max-w-sm rounded-lg bg-navy-900/95 p-6 text-center shadow-lg ring-1 ring-navy-600">
            <p className="font-semibold text-steel-100">No matching records</p>
            <p className="mt-2 text-sm text-steel-400">
              No deployments match the current filters. Try clearing a filter or widening the
              search area.
            </p>
            <button
              onClick={() => {
                setFilters({});
                loadMarkers({});
              }}
              className="mt-4 rounded-lg bg-radar-500 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-radar-400"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        communityLayerOn={communityOn}
        onToggleCommunity={toggleCommunityLayer}
        communityLoading={communityLoading}
        basemap={basemap}
        onBasemapChange={handleBasemapChange}
      />
      <Legend />

      {showMobileFilters && (
        <div className="absolute inset-x-0 bottom-16 z-[1000] mx-4 rounded-lg border border-navy-600 bg-navy-900 p-3 shadow-lg sm:hidden">
          <FilterBar
            filters={filters}
            onChange={handleMobileFilterChange}
            variant="mobile"
            communityLayerOn={communityOn}
            onToggleCommunity={toggleCommunityLayer}
            communityLoading={communityLoading}
            basemap={basemap}
            onBasemapChange={handleBasemapChange}
          />
        </div>
      )}

      {showLocateButton && userLocation && (
        <button
          onClick={() => {
            const m = map.current;


            if (m && userLocation) m.setView(userLocation, 17, { animate: false });
          }}
          className="absolute bottom-20 left-4 z-[1000] flex h-11 w-11 items-center justify-center rounded-full border border-navy-600 bg-navy-900 text-radar-400 shadow-lg transition-colors hover:bg-navy-800 hover:text-radar-300 sm:bottom-4"
          aria-label="Snap back to my location"
          title="Back to my location"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      )}
    </div>
  );
}

function popupHtml(
  feature: MarkerProperties,
  lat: number,
  lng: number,
  address?: string | null,
): string {
  const legendItem = getLegendItem(feature.status);
  const rows: string[] = [];
  rows.push(`<div class="popup-body">`);
  rows.push(`<h3 class="popup-title">${escapeHtml(feature.entityName)}</h3>`);
  rows.push(`<div class="popup-row"><span class="popup-label">Status:</span> <span style="color:${legendItem?.color || '#ccc'}">${escapeHtml(legendItem?.label || feature.status)}</span></div>`);
  rows.push(`<div class="popup-row"><span class="popup-label">Vendor:</span> ${escapeHtml(feature.vendor)}</div>`);
  rows.push(`<div class="popup-row"><span class="popup-label">Confidence:</span> <span class="popup-conf-${feature.confidence}">${feature.confidence}</span></div>`);
  rows.push(`<div class="popup-row"><span class="popup-label">Point type:</span> ${feature.isExactLocation ? 'Exact location' : 'Entity-level deployment marker'}</div>`);
  if (feature.isExactLocation && typeof feature.facingDirection === 'number') {
    rows.push(`<div class="popup-row"><span class="popup-label">Facing:</span> ${degreesToCardinal(feature.facingDirection)} (${feature.facingDirection}°)</div>`);
  }
  if (feature.cameraCount != null) rows.push(`<div class="popup-row"><span class="popup-label">Cameras:</span> ${feature.cameraCount}</div>`);
  if (feature.retentionPeriod) rows.push(`<div class="popup-row"><span class="popup-label">Retention:</span> ${escapeHtml(feature.retentionPeriod)}</div>`);
  if (feature.contractValue) rows.push(`<div class="popup-row"><span class="popup-label">Contract value:</span> ${escapeHtml(feature.contractValue)}</div>`);
  if (feature.lastVerifiedAt) rows.push(`<div class="popup-row"><span class="popup-label">Last verified:</span> ${escapeHtml(feature.lastVerifiedAt)}</div>`);
  if (feature.description) rows.push(`<div class="popup-desc">${escapeHtml(feature.description)}</div>`);
  if (feature.sources.length > 0) {
    rows.push(`<div class="popup-sources"><span class="popup-label">Public evidence:</span><ul>`);
    for (const s of feature.sources) {
      rows.push(`<li><a href="${escapeAttr(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title || s.sourceType)} · ${escapeHtml(s.publisher || '')}</a></li>`);
    }
    rows.push(`</ul></div>`);
  }

  const mapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  rows.push(`<div class="popup-address">`);
  rows.push(`<span class="popup-label">Street address</span>`);
  if (address === undefined) {
    rows.push(`<p class="popup-address-line">Looking up address…</p>`);
  } else if (address) {
    rows.push(`<p class="popup-address-line">${escapeHtml(address)}</p>`);
  } else {
    rows.push(`<p class="popup-address-line">No street address found for these coordinates.</p>`);
  }
  rows.push(`</div>`);
  rows.push(`<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="popup-streetview">Open in Street View ↗</a>`);
  rows.push(`<div class="popup-footer"><a href="/correct">Report a correction</a></div>`);
  rows.push(`</div>`);
  return rows.join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;');
}
