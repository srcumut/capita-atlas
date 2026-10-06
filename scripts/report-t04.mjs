import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/^\uFEFF/, '');
function csv(input) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') { if (quoted && input[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && input[i + 1] === '\n') i++; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (quoted) throw Error('Unclosed CSV quote');
  if (row.length || cell) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}
const countries = csv(read('data/countries.csv'));
const indicators = csv(read('data/indicators.csv'));
const obs = [...csv(read('data/wdi-observations.csv')), ...csv(read('data/candidate-observations.csv'))];
const ids = indicators.map(i => i.indicator_id);
const countryIds = new Set(countries.map(c => c.country_id));
const byKey = new Map(), byIndicator = new Map(ids.map(id => [id, []]));
for (const o of obs) {
  const key = `${o.country_id}|${o.indicator_id}|${o.reference_year}`;
  if (!countryIds.has(o.country_id) || !byIndicator.has(o.indicator_id) || byKey.has(key)) throw Error(`Invalid/duplicate key ${key}`);
  byKey.set(key, o); byIndicator.get(o.indicator_id).push(o);
}
const available = o => !!o && o.value !== '' && Number.isFinite(Number(o.value));
const years = [...new Set(obs.map(o => Number(o.reference_year)))].sort((a,b) => a-b);
const latest = new Map(ids.map(id => [id, Math.max(...byIndicator.get(id).map(o => +o.reference_year))]));
const esc = s => `"${String(s).replaceAll('"', '""')}"`;
const writeCsv = (p, head, rows) => fs.writeFileSync(path.join(root,p), [head,...rows].map(r => r.map(esc).join(',')).join('\n')+'\n');
fs.mkdirSync(path.join(root,'data','quality'), {recursive:true});
const yearRows = [];
for (const id of ids) for (const year of years) {
  const found = countries.map(c => byKey.get(`${c.country_id}|${id}|${year}`));
  const present = found.filter(available).length, blank = found.filter(o => o && !available(o)).length;
  if (present || blank) yearRows.push([id,year,present,blank,195-present-blank]);
}
writeCsv('data/quality/year-coverage.csv',['indicator_id','reference_year','countries_with_value','explicit_blank_rows','countries_without_row'],yearRows);
const matrix = [];
for (const c of countries) for (const id of ids) {
  const rows = byIndicator.get(id).filter(o => o.country_id === c.country_id);
  const values = rows.filter(available);
  matrix.push([c.country_id,id,values.length,rows.length-values.length,values.length ? Math.max(...values.map(o=>+o.reference_year)) : '',
    available(byKey.get(`${c.country_id}|${id}|${latest.get(id)}`)) ? 'yes' : 'no']);
}
writeCsv('data/quality/country-indicator-coverage.csv',['country_id','indicator_id','years_with_value','explicit_blank_rows','latest_value_year','value_in_source_latest_year'],matrix);
let coverage = `# T04 — Kapsam raporu\n\nÜretim: 2026-10-03; \`node scripts/report-t04.mjs\`. Evren: T01'in 195 ülkesi. “Değer” yalnız sayısal kaynak gözlemidir; boş satır ile kayıtsız ülke ayrı sayılır. Kaynağın son yılı ortak model yılı olarak seçilmemiştir.\n\n| Gösterge | Kaynak yıl aralığı | Değerli ülke (herhangi yıl) | Kaynak son yılı | Son yılda değer | Son yılda boş satır | Son yılda satır yok |\n| --- | --- | ---: | ---: | ---: | ---: | ---: |\n`;
for (const id of ids) {
  const r = byIndicator.get(id), min = Math.min(...r.map(o=>+o.reference_year)), max=latest.get(id);
  const yr = yearRows.find(x=>x[0]===id && x[1]===max);
  const ever = new Set(r.filter(available).map(o=>o.country_id)).size;
  coverage += `| ${id} | ${min}–${max} | ${ever}/195 | ${max} | ${yr[2]} | ${yr[3]} | ${yr[4]} |\n`;
}
coverage += `\nÜlke × gösterge ayrıntısı [country-indicator-coverage.csv](../data/quality/country-indicator-coverage.csv), tüm yıl sayımları [year-coverage.csv](../data/quality/year-coverage.csv) dosyasındadır. Yıllık tabloda payda her zaman 195'tir; kaynak yıl aralığı dışında satır üretilmez.\n\n## Son kaynak yılında sekiz gösterge\n\n`;
const full = countries.filter(c=>ids.every(id=>available(byKey.get(`${c.country_id}|${id}|${latest.get(id)}`))));
coverage += `${full.length}/195 ülkede sekiz göstergenin de kendi kaynak son yılında sayısal değer vardır. Bu yıllar farklı olduğundan eşzamanlı tam veri anlamına gelmez.\n\n`;
coverage += `## Kaynak son yılında değeri olmayan ülkeler\n\n`;
for (const id of ids) {
  const absent = countries.filter(c=>!available(byKey.get(`${c.country_id}|${id}|${latest.get(id)}`))).map(c=>c.country_id);
  coverage += `- **${id} (${latest.get(id)}):** ${absent.length} ülke${absent.length ? ` — ${absent.join(', ')}` : ''}.\n`;
}
fs.writeFileSync(path.join(root,'docs','coverage.md'),coverage);
let quality = `# T04 — Veri kalite raporu\n\nÜretim: 2026-10-03; \`node scripts/report-t04.mjs\`. Kaynak: T03'ün eşlenmiş gözlemleri ve T02 gösterge sözlüğü. Bu rapor bir gösterge seçimi veya eksik veri doldurma kararı vermez.\n\n| Gösterge | Satır | Sayısal | Açık boş | Durumlar | Negatif | Sıfır | Birim sayısı |\n| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |\n`;
for (const id of ids) {
  const r=byIndicator.get(id), v=r.filter(available), blanks=r.length-v.length;
  const statuses=[...new Set(r.map(o=>o.status))].sort().map(s=>`${s}: ${r.filter(o=>o.status===s).length}`).join('; ');
  quality += `| ${id} | ${r.length} | ${v.length} | ${blanks} | ${statuses} | ${v.filter(o=>+o.value<0).length} | ${v.filter(o=>+o.value===0).length} | ${new Set(r.map(o=>o.unit)).size} |\n`;
}
quality += `\nSayısal değer, tanım veya kaynak bayrağı bakımından otomatik olarak model için uygun sayılmaz. Boş değer sıfır sayılmadı. Durum ve yöntem notları T03 dosyalarında aynen korunur.\n\n## Tanım ve karşılaştırılabilirlik\n\n`;
for (const i of indicators) quality += `- **${i.indicator_id}:** ${i.qualification} Birim: ${[...new Set(byIndicator.get(i.indicator_id).map(o=>o.unit))].join(', ')}.\n`;
quality += `\n## T05 için açık konular\n\n- Ortak referans yılı seçilmedi. [Yıllık kapsam tablosu](../data/quality/year-coverage.csv) ile seçilecek yıllardaki boşluklar ve yakın yıl ihtiyacı incelenmeli.\n- HDI ve afet ölüm/kayıp oranı doğrudan kapasite payı değildir; yön/dönüşüm kararı gerekir.\n- GSYH ile imalat katma değeri örtüşür. Cari USD ile sabit bazlı USD serileri tek toplam gibi yorumlanmamalı.\n- SIPRI tahmin ve belirsizlik durumları, FAOSTAT ve BM SDG yöntem notları gösterge seçimi ve belirsizlik politikasında incelenmeli.\n- Kayıtsız ülke ile kaynakta açık boş değer ayrımı korunmalı; ikisi de otomatik sıfırlanmamalı.\n`;
fs.writeFileSync(path.join(root,'docs','quality.md'),quality);
console.log(`T04: ${obs.length} gözlem, ${matrix.length} ülke-gösterge, ${yearRows.length} gösterge-yıl; son yıl sekizli tam ${full.length}/195`);
