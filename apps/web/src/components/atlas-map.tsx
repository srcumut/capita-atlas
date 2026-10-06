"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map } from "maplibre-gl";
import type { CapitalFeature, Capitals, Snapshot } from "@/lib/model";
import { formatNumber } from "@/lib/model";

const home = { center: [0, 15] as [number, number], zoom: 1.15, bearing: 0, pitch: 0 };
const empty = (): GeoJSON.FeatureCollection => ({ type: "FeatureCollection", features: [] });
const svgNS = "http://www.w3.org/2000/svg";

function drawLines(map: Map, svg: SVGSVGElement | null, capitals: Capitals | null, snapshot: Snapshot | null) {
  if (!svg || !capitals || !snapshot) return;
  const origin = map.project([0, 0]);
  const width = map.getContainer().clientWidth;
  const height = map.getContainer().clientHeight;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  let links = svg.querySelector<SVGPathElement>(".atlas-vector-links");
  let resultLink = svg.querySelector<SVGPathElement>(".atlas-result-link");
  if (!links) { links = document.createElementNS(svgNS, "path"); links.setAttribute("class", "atlas-vector-links"); svg.append(links); }
  if (!resultLink) { resultLink = document.createElementNS(svgNS, "path"); resultLink.setAttribute("class", "atlas-result-link"); svg.append(resultLink); }
  const segments = snapshot.contributions ? capitals.features.flatMap(feature => {
    if ((snapshot.contributions?.[feature.properties.country_id]?.share ?? 0) <= 0) return [];
    const point = map.project(feature.geometry.coordinates as [number, number]);
    return [`M${origin.x.toFixed(1)},${origin.y.toFixed(1)}L${point.x.toFixed(1)},${point.y.toFixed(1)}`];
  }) : [];
  links.setAttribute("d", segments.join(""));
  const result = snapshot.result;
  if (result.latitude == null || result.longitude == null) resultLink.setAttribute("d", "");
  else {
    const point = map.project([result.longitude, result.latitude]);
    resultLink.setAttribute("d", `M${origin.x.toFixed(1)},${origin.y.toFixed(1)}L${point.x.toFixed(1)},${point.y.toFixed(1)}`);
  }
}

export function AtlasMap({ snapshot, onCountry, onError, resetSignal }: {
  snapshot: Snapshot | null; onCountry: (feature: CapitalFeature) => void;
  onError: (message: string) => void; resetSignal: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState("Harita katmanları yükleniyor");
  const mapRef = useRef<Map | null>(null);
  const capitalsRef = useRef<Capitals | null>(null);
  const resultMarkerRef = useRef<maplibregl.Marker | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const snapshotRef = useRef(snapshot);
  const countryRef = useRef(onCountry);
  const errorRef = useRef(onError);
  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);
  useEffect(() => { countryRef.current = onCountry; }, [onCountry]);
  useEffect(() => { errorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: { version: 8, sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>' } }, layers: [{ id: "osm", type: "raster", source: "osm" }] },
      ...home, minZoom: 0.5, maxZoom: 12, renderWorldCopies: false, dragRotate: false,
      pitchWithRotate: false, attributionControl: false,
    });
    mapRef.current = map;
    map.on("move", () => drawLines(map, svgRef.current, capitalsRef.current, snapshotRef.current));
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    const markers: maplibregl.Marker[] = [];
    let popup: maplibregl.Popup | null = null;
    const showPopup = (coordinates: [number, number], title: string, lines: string[]) => {
      popup?.remove();
      const root = document.createElement("div");
      root.className = "atlas-popup";
      const heading = document.createElement("strong");
      heading.textContent = title;
      root.append(heading);
      lines.forEach(line => { const row = document.createElement("span"); row.textContent = line; root.append(row); });
      popup = new maplibregl.Popup({ closeButton: false, maxWidth: "260px" }).setLngLat(coordinates).setDOMContent(root).addTo(map);
    };
    let initialized = false;
    const initializeLayers = async () => {
      if (initialized) return;
      initialized = true;
      setPhase("Başkent verisi yükleniyor");
      try {
        const response = await fetch("/capitals.geojson");
        if (!response.ok) throw new Error(`Başkent verisi: HTTP ${response.status}`);
        const capitals = await response.json() as Capitals;
        if (capitals.type !== "FeatureCollection" || capitals.features.length !== 195) throw new Error("Başkent kapsamı 195 değil");
        setPhase("Harita katmanları hazırlanıyor");
        capitalsRef.current = capitals;
        for (const feature of capitals.features) {
          const element = document.createElement("button");
          element.type = "button";
          element.className = "capital-marker";
          element.title = `${feature.properties.capital_name}, ${feature.properties.country_name}`;
          element.setAttribute("aria-label", element.title);
          element.addEventListener("click", () => countryRef.current(feature as CapitalFeature));
          markers.push(new maplibregl.Marker({ element, anchor: "center" }).setLngLat(feature.geometry.coordinates as [number, number]).addTo(map));
        }
        const originElement = document.createElement("button");
        originElement.type = "button";
        originElement.className = "origin-marker";
        originElement.title = "Başlangıç noktası (0°, 0°)";
        originElement.setAttribute("aria-label", originElement.title);
        originElement.addEventListener("mouseenter", () => showPopup([0, 0], "Başlangıç noktası", ["0° enlem · 0° boylam", "Uzaklık WGS84 ile bu noktadan ölçülür."]));
        originElement.addEventListener("mouseleave", () => popup?.remove());
        markers.push(new maplibregl.Marker({ element: originElement, anchor: "center" }).setLngLat([0, 0]).addTo(map));
        map.addSource("links", { type: "geojson", data: empty() });
        map.addLayer({ id: "links", type: "line", source: "links", paint: { "line-color": "#e6aa6d", "line-opacity": 0.35, "line-width": ["get", "width"] } });
        map.addSource("capitals", { type: "geojson", data: capitals });
        map.addLayer({ id: "capital-halo", type: "circle", source: "capitals", paint: { "circle-radius": 8, "circle-color": "#ffffff", "circle-opacity": 0.65 } });
        map.addLayer({ id: "capitals", type: "circle", source: "capitals", paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 3.5, 8, 6], "circle-color": "#15856d", "circle-stroke-color": "#ffffff", "circle-stroke-width": 1.3 } });
        map.addLayer({ id: "capital-labels", type: "symbol", source: "capitals", minzoom: 4, layout: { "text-field": ["get", "capital_name"], "text-size": 12, "text-offset": [0, 1.2], "text-anchor": "top", "text-optional": true }, paint: { "text-color": "#143d34", "text-halo-color": "#fff", "text-halo-width": 2 } });
        map.addSource("result-link", { type: "geojson", data: empty() });
        map.addLayer({ id: "result-link", type: "line", source: "result-link", paint: { "line-color": "#da6946", "line-width": 2.5, "line-dasharray": [2, 2] } });
        map.addSource("origin", { type: "geojson", data: { type: "Feature", geometry: { type: "Point", coordinates: [0, 0] }, properties: {} } });
        map.addLayer({ id: "origin", type: "circle", source: "origin", paint: { "circle-radius": 9, "circle-color": "#346aa0", "circle-stroke-color": "#fff", "circle-stroke-width": 2.5 } });
        map.addSource("result", { type: "geojson", data: empty() });
        map.addLayer({ id: "result-halo", type: "circle", source: "result", paint: { "circle-radius": 18, "circle-color": "#f06e47", "circle-opacity": 0.22 } });
        map.addLayer({ id: "result", type: "circle", source: "result", paint: { "circle-radius": 9, "circle-color": "#d85b39", "circle-stroke-color": "#fff", "circle-stroke-width": 2.5 } });
        map.on("click", "capitals", event => { if (event.features?.[0]) countryRef.current(event.features[0] as unknown as CapitalFeature); });
        for (const layer of ["capitals", "origin", "result"]) {
          map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; popup?.remove(); });
        }
        map.on("mouseenter", "origin", () => showPopup([0, 0], "Başlangıç noktası", ["0° enlem · 0° boylam", "Uzaklık WGS84 ile bu noktadan ölçülür."]));
        const showResult = () => {
          const result = snapshotRef.current?.result;
          if (result?.latitude == null || result.longitude == null) return;
          showPopup([result.longitude, result.latitude], "Hesaplanan sonuç", [
            `${result.latitude.toFixed(5)}° enlem · ${result.longitude.toFixed(5)}° boylam`,
            `Başlangıçtan ${formatNumber(result.displacement_km)} km`,
            `Yön: ${result.bearing_degrees == null ? "yönsüz" : `${formatNumber(result.bearing_degrees)}°`}`,
          ]);
        };
        map.on("mouseenter", "result", showResult);
        map.on("click", "result", showResult);
        const resultElement = document.createElement("button");
        resultElement.type = "button";
        resultElement.className = "result-marker";
        resultElement.title = "Hesaplanan sonuç";
        resultElement.setAttribute("aria-label", resultElement.title);
        resultElement.style.display = "none";
        resultElement.addEventListener("mouseenter", showResult);
        resultElement.addEventListener("click", showResult);
        resultElement.addEventListener("mouseleave", () => popup?.remove());
        const resultMarker = new maplibregl.Marker({ element: resultElement, anchor: "center" }).setLngLat([0, 0]).addTo(map);
        resultMarkerRef.current = resultMarker;
        markers.push(resultMarker);
        setReady(true);
        drawLines(map, svgRef.current, capitals, snapshotRef.current);
      } catch (error) { const message = error instanceof Error ? error.message : "Harita yüklenemedi"; setPhase(message); errorRef.current(message); }
    };
    if (map.isStyleLoaded()) void initializeLayers();
    else {
      map.once("load", () => { void initializeLayers(); });
      map.once("style.load", () => { void initializeLayers(); });
      window.setTimeout(() => { void initializeLayers(); }, 1000);
    }
    return () => { popup?.remove(); markers.forEach(marker => marker.remove()); map.remove(); mapRef.current = null; resultMarkerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const capitals = capitalsRef.current;
    if (!ready || !map || !capitals || !snapshot) return;
    const result = snapshot.result;
    const point = result.latitude == null || result.longitude == null ? null : [result.longitude, result.latitude];
    drawLines(map, svgRef.current, capitals, snapshot);
    if (resultMarkerRef.current) {
      resultMarkerRef.current.getElement().style.display = point ? "block" : "none";
      if (point) resultMarkerRef.current.setLngLat(point as [number, number]);
    }
    const links: GeoJSON.Feature<GeoJSON.LineString>[] = snapshot.contributions ? capitals.features.flatMap(feature => {
      const contribution = snapshot.contributions?.[feature.properties.country_id];
      return contribution && contribution.share > 0 ? [{ type: "Feature" as const, properties: { width: 0.6 + 8 * Math.sqrt(contribution.share) }, geometry: { type: "LineString" as const, coordinates: [[0, 0], feature.geometry.coordinates] } }] : [];
    }) : [];
    (map.getSource("links") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: links });
    (map.getSource("result") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: point ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: point } }] : [] });
    (map.getSource("result-link") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: point ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[0, 0], point] } }] : [] });
  }, [snapshot, ready]);

  useEffect(() => { if (resetSignal > 0) mapRef.current?.flyTo(home); }, [resetSignal]);
  return <><div ref={container} className="h-full w-full" role="application" aria-label="Yakınlaştırılabilir dünya haritası" /><svg ref={svgRef} className="atlas-lines" aria-hidden="true" />{!ready && <span className="map-phase">{phase}</span>}</>;
}

