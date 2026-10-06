import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.11.2/dist/maplibre-gl.mjs';

const HOME = { center: [0, 15], zoom: 1.15, bearing: 0, pitch: 0 };
const info = document.getElementById('info');
const result = document.getElementById('result');
const sensitivity = document.getElementById('sensitivity');
const weight = document.getElementById('weight');
const budget = document.getElementById('budget');
const mode = document.getElementById('mode');
const normalization = document.getElementById('normalization');
let snapshot;
let selected;
let capitals;
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const numeric = value => value === null ? 'Eksik' : Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 });

const map = new maplibregl.Map({
  container: 'map',
  style: { version: 8, sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>' } }, layers: [{ id: 'osm', type: 'raster', source: 'osm' }] },
  ...HOME, minZoom: 0.5, maxZoom: 12, renderWorldCopies: false, dragRotate: false, pitchWithRotate: false, attributionControl: false
});
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right');
document.getElementById('reset').addEventListener('click', () => map.flyTo(HOME));
weight.addEventListener('input', () => {
  document.getElementById('weight-value').textContent = `${weight.value}%`;
  document.getElementById('economy-value').textContent = `${100 - Number(weight.value)}%`;
});
function updateControls() {
  const all = mode.value === 'all_data';
  weight.parentElement.hidden = all;
  document.getElementById('economy-value').parentElement.hidden = all;
  normalization.parentElement.hidden = !all;
  sensitivity.hidden = all;
}
mode.addEventListener('change', updateControls);
updateControls();
const labels = {
  population_total: 'Nüfus', gdp_current_usd: 'GSYH', manufacturing_va_usd: 'İmalat',
  agricultural_gpv: 'Tarım üretimi', military_expenditure: 'Askerî harcama',
  merchandise_exports: 'Mal ihracatı', hdi: 'İnsani gelişme', disaster_mortality_rate: 'Afet ölüm/kayıp oranı'
};

function renderCountry(feature) {
  if (!snapshot || !feature) return;
  const p = feature.properties;
  const rows = snapshot.observations[p.country_id];
  const contribution = snapshot.contributions?.[p.country_id];
  const observation = (label, row, indicator) => {
    const assumption = snapshot.assumptions.find(item => item.country_id === p.country_id && item.indicator_id === indicator);
    const source = row.source_url ? ` · <a href="${escapeHtml(row.source_url)}" target="_blank" rel="noopener">Kaynak</a>` : '';
    const share = contribution?.category_shares[indicator];
    return `<p><strong>${label}:</strong> ${numeric(row.value)} ${escapeHtml(row.unit ?? '')} (${row.reference_year ?? 'yıl yok'}; ${escapeHtml(row.status)})${source}${share === null ? ' · kategori katkısı yok' : share !== undefined ? ` · kategori payı %${(share * 100).toFixed(3)}` : ''}${assumption ? `<br>Keşif girdisi: ${numeric(assumption.value)}; ${escapeHtml(assumption.kind)}${assumption.actual_reference_year ? `, gerçek yıl ${assumption.actual_reference_year}` : ''}${assumption.source_url ? ` · <a href="${escapeHtml(assumption.source_url)}" target="_blank" rel="noopener">Dayanak</a>` : ''}` : ''}</p>`;
  };
  const details = Object.entries(rows).map(([indicator, row]) => observation(labels[indicator] || indicator, row, indicator)).join('');
  info.innerHTML = `<h2>${escapeHtml(p.country_name)} · ${escapeHtml(p.capital_name)}</h2><p>${Number(feature.geometry.coordinates[1]).toFixed(5)}°, ${Number(feature.geometry.coordinates[0]).toFixed(5)}°</p><p>${escapeHtml(p.selection_note)} · <a href="${escapeHtml(p.source_url)}" target="_blank" rel="noopener">Başkent kaynağı</a></p>${details}<p>${contribution ? `Son çekim payı %${(contribution.share * 100).toFixed(3)}; vektör ${numeric(contribution.length_km)} km.` : 'Çekim katkısı: kapsam eksik olduğu için hesaplanmadı.'}</p>`;
}

function lineFeatures() {
  if (!snapshot.contributions) return [];
  return capitals.features.filter(f => snapshot.contributions[f.properties.country_id].share > 0).map(f => ({
    type: 'Feature', properties: { width: 1 + 7 * Math.sqrt(snapshot.contributions[f.properties.country_id].share) },
    geometry: { type: 'LineString', coordinates: [[0, 0], f.geometry.coordinates] }
  }));
}

function render() {
  const state = snapshot.result;
  if (state.status === 'blocked_missing_data') {
    const countries = new Set(snapshot.missing.map(m => m.country_id)).size;
    result.innerHTML = `<h2>Sonuç hesaplanamadı</h2><p>2025 verisinde ${snapshot.missing.length} gözlem, ${countries} ülkede eksik. Küresel pay, ok ve koordinat üretilmedi.</p><p>Seçilen ayarlar: nüfus %${Math.round(snapshot.config.categories[0].weight * 100)}, ekonomi %${Math.round(snapshot.config.categories[1].weight * 100)}, ${numeric(snapshot.config.budget_km)} km.</p>`;
  } else if (snapshot.mode === 'all_data') {
    const available = Object.values(snapshot.coverage).reduce((a, b) => a + b, 0);
    const categoryRows = Object.entries(snapshot.coverage).map(([id, count]) => `<li>${escapeHtml(labels[id])}: ${count}/195; yıllar ${snapshot.year_ranges[id][0]}–${snapshot.year_ranges[id][1]}</li>`).join('');
    result.innerHTML = `<h2>Sekiz kategori sonucu</h2><p>${state.latitude.toFixed(5)}° enlem, ${state.longitude.toFixed(5)}° boylam</p><p>Orijinden WGS84 uzaklığı: ${numeric(state.displacement_km)} km; yön ${numeric(state.bearing_degrees)}°.</p><p>${available}/1560 ülke–kategori gözlemi mevcut; ${snapshot.missing.length} kayıt eksik. Her ülke için en son mevcut yıl kullanıldı. Eksik kategori o ülkeye katkı vermez; diğer kategorilerin ağırlığı ülke özelinde yükseltilmez.</p><details><summary>Kategori kapsamı ve yıllar</summary><ul>${categoryRows}</ul></details><p>Toplam kapasite dönüşümü: ${escapeHtml(snapshot.normalization)}. HDI min–max, afet oranı ters sıra ile hesaplanır. Sekiz kategori eşit ağırlıklı; bütçe ${numeric(snapshot.config.budget_km)} km.</p><p>Farklı yıllar, göstergeler arası örtüşme ve eksik kapsam nedeniyle bu deneysel bir model sonucudur.</p>`;
  } else {
    result.innerHTML = `<h2>${snapshot.mode === 'exploratory' ? 'Varsayımlı keşif sonucu' : 'Model sonucu'}</h2><p>${state.latitude.toFixed(5)}° enlem, ${state.longitude.toFixed(5)}° boylam</p><p>Net yer değiştirme: ${numeric(state.displacement_km)} km${state.bearing_degrees === null ? '; yönsüz' : `; yön ${numeric(state.bearing_degrees)}°`}.</p><p>195 ülke · 2025 hedef yılı · nüfus %${Math.round(snapshot.config.categories[0].weight * 100)} · ekonomi %${Math.round(snapshot.config.categories[1].weight * 100)} · bütçe ${numeric(snapshot.config.budget_km)} km.</p>${snapshot.mode === 'exploratory' ? '<p>15 boş gözlem için 10 arşiv eski yıl verisi, 4 kaynaklı ek kayıt ve Vatikan GSYH için açık varsayım kullanıldı. Ek kayıtların ikisi 2025 IMF tahminidir.</p>' : ''}<p>Bu koordinat model çıktısıdır; karada olma koşulu uygulanmaz.</p>`;
  }
  if (map.getSource('links')) map.getSource('links').setData({ type: 'FeatureCollection', features: lineFeatures() });
  if (map.getSource('result')) map.getSource('result').setData({ type: 'FeatureCollection', features: state.latitude === null ? [] : [{ type: 'Feature', geometry: { type: 'Point', coordinates: [state.longitude, state.latitude] }, properties: {} }] });
  if (map.getSource('result-link')) map.getSource('result-link').setData({ type: 'FeatureCollection', features: state.latitude === null ? [] : [{ type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [state.longitude, state.latitude]] }, properties: {} }] });
  renderCountry(selected);
}

async function calculate(initial = false) {
  try {
    const response = await fetch(initial ? '/api/snapshot' : '/api/calculate', initial ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ population_weight: Number(weight.value) / 100, budget_km: Number(budget.value), mode: mode.value, normalization: normalization.value }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    snapshot = payload;
    render();
  } catch (error) { result.innerHTML = `<h2>Hesap hatası</h2><p>${escapeHtml(error.message)}</p>`; }
}
fetch('/api/sensitivity').then(response => {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}).then(report => {
  const baseline = report.scenarios.find(s => s.population_weight === 0.5 && s.budget_km === 10000);
  const blocked = report.scenarios.filter(s => s.status === 'blocked_missing_data').length;
  sensitivity.innerHTML = `<h2>Duyarlılık ve belirsizlik</h2><p>${blocked}/${report.scenarios.length} ağırlık ve bütçe senaryosu veri eksikliği nedeniyle engelli. ${baseline.missing_observation_count} gözlem, ${baseline.missing_country_count} ülkede eksik.</p><p>Tam veri koşulunda bütçe, net vektör uzunluğunu doğrusal ölçekler. Ağırlık değişiminin gerçek koordinat etkisi mevcut veriyle hesaplanamaz.</p><p>Eksik değerler için kabul edilmiş tahmin ve sayısal belirsizlik aralığı yoktur. <a href="/api/sensitivity" target="_blank" rel="noopener">Senaryo raporu</a></p>`;
}).catch(error => { sensitivity.textContent = `Duyarlılık raporu yüklenemedi: ${error.message}`; });
document.getElementById('calculate').addEventListener('click', () => calculate());

map.on('load', async () => {
  try {
    const response = await fetch('./capitals.geojson');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    capitals = await response.json();
    if (capitals.type !== 'FeatureCollection' || capitals.features.length !== 195) throw new Error('Başkent kapsamı geçersiz');
    map.addSource('links', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'links', type: 'line', source: 'links', paint: { 'line-color': '#bf6b25', 'line-opacity': 0.45, 'line-width': ['get', 'width'] } });
    map.addLayer({ id: 'arrows', type: 'symbol', source: 'links', layout: { 'symbol-placement': 'line', 'symbol-spacing': 180, 'text-field': '➤', 'text-size': 16, 'text-rotation-alignment': 'map', 'text-keep-upright': false }, paint: { 'text-color': '#9e4816', 'text-halo-color': '#fff', 'text-halo-width': 1 } });
    map.addSource('capitals', { type: 'geojson', data: capitals });
    map.addLayer({ id: 'capital-halo', type: 'circle', source: 'capitals', paint: { 'circle-radius': 10, 'circle-color': '#ffffff', 'circle-opacity': 0.82 } });
    map.addLayer({ id: 'capitals', type: 'circle', source: 'capitals', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 4, 8, 6], 'circle-color': '#08725e', 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.3 } });
    map.addLayer({ id: 'capital-labels', type: 'symbol', source: 'capitals', minzoom: 4, layout: { 'text-field': ['get', 'capital_name'], 'text-size': 12, 'text-offset': [0, 1.2], 'text-anchor': 'top', 'text-optional': true }, paint: { 'text-color': '#183b32', 'text-halo-color': '#fff', 'text-halo-width': 2 } });
    map.addSource('result-link', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'result-link', type: 'line', source: 'result-link', paint: { 'line-color': '#c7332c', 'line-width': 2.5, 'line-dasharray': [2, 2] } });
    map.addSource('origin', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} } });
    map.addLayer({ id: 'origin', type: 'circle', source: 'origin', paint: { 'circle-radius': 10, 'circle-color': '#174a8b', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
    map.addSource('result', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'result', type: 'circle', source: 'result', paint: { 'circle-radius': 10, 'circle-color': '#d75630', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
    map.on('click', 'capitals', event => { selected = event.features[0]; renderCountry(selected); });
    map.on('mouseenter', 'capitals', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'capitals', () => { map.getCanvas().style.cursor = ''; });
    let pointPopup;
    map.on('mouseenter', 'origin', () => {
      map.getCanvas().style.cursor = 'pointer';
      pointPopup?.remove();
      pointPopup = new maplibregl.Popup({ closeButton: false }).setLngLat([0, 0]).setHTML('<strong>Başlangıç noktası</strong><br>0° enlem, 0° boylam<br>Sonuç uzaklığı bu noktadan WGS84 ile ölçülür.').addTo(map);
    });
    map.on('mouseleave', 'origin', () => { map.getCanvas().style.cursor = ''; pointPopup?.remove(); });
    const showResultPopup = () => {
      if (!snapshot?.result || snapshot.result.latitude === null) return;
      map.getCanvas().style.cursor = 'pointer';
      const r = snapshot.result;
      pointPopup?.remove();
      pointPopup = new maplibregl.Popup({ closeButton: false }).setLngLat([r.longitude, r.latitude]).setHTML(`<strong>Hesaplanan sonuç</strong><br>${r.latitude.toFixed(5)}° enlem, ${r.longitude.toFixed(5)}° boylam<br>Başlangıçtan uzaklık: ${numeric(r.displacement_km)} km<br>Yön: ${r.bearing_degrees === null ? 'yönsüz' : `${numeric(r.bearing_degrees)}°`}`).addTo(map);
    };
    map.on('mouseenter', 'result', showResultPopup);
    map.on('click', 'result', showResultPopup);
    map.on('mouseleave', 'result', () => { map.getCanvas().style.cursor = ''; pointPopup?.remove(); });
    await calculate(true);
  } catch (error) { info.textContent = `Harita yüklenemedi: ${error.message}`; }
});


