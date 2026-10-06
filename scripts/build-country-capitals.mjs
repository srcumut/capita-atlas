import fs from 'node:fs';

const countries = JSON.parse(fs.readFileSync('data/raw/world-countries.json', 'utf8'));
const lines = fs.readFileSync('data/raw/cities500/cities500.txt', 'utf8').trimEnd().split('\n');
const cities = new Map();
const byId = new Map();
for (const line of lines) {
  const c = line.split('\t');
  byId.set(c[0], { id: c[0], name: c[1], lat: c[4], lon: c[5] });
  if (c[7] !== 'PPLC') continue;
  const key = c[8];
  if (!cities.has(key)) cities.set(key, []);
  cities.get(key).push({ id: c[0], name: c[1], lat: c[4], lon: c[5] });
}
const selected = countries.filter(c => c.unMember && c.cca3 !== 'VAT' || ['VAT', 'PSE'].includes(c.cca3));
if (selected.length !== 195 || selected.filter(c => c.cca3 !== 'VAT' && c.cca3 !== 'PSE').length !== 193) throw new Error('UN scope count changed');
const geoCountries = new Set(fs.readFileSync('data/raw/countryInfo.txt', 'utf8').split('\n').filter(x => x && !x.startsWith('#')).map(x => x.split('\t')[0]));
const overrides = { ISR: '281184', PSE: '282239' };
const csv = rows => rows.map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n') + '\n';
const countryRows = [['country_id','name','iso2','membership','scope_source_url']];
const capitalRows = [['country_id','capital_name','latitude','longitude','geonames_id','source_url','selection_note']];
const ids = new Set();
for (const c of selected.sort((a,b) => a.cca3.localeCompare(b.cca3))) {
  const options = cities.get(c.cca2) || [];
  const city = overrides[c.cca3] ? byId.get(overrides[c.cca3]) : options[0];
  if (!city || options.length > 1) throw new Error(`Ambiguous or missing capital: ${c.cca3}`);
  if (!geoCountries.has(c.cca2)) throw new Error(`No GeoNames country: ${c.cca3}`);
  if (ids.has(c.cca3)) throw new Error(`Duplicate country: ${c.cca3}`);
  ids.add(c.cca3);
  if (!Number.isFinite(Number(city.lat)) || Number(city.lat) < -90 || Number(city.lat) > 90 || !Number.isFinite(Number(city.lon)) || Number(city.lon) < -180 || Number(city.lon) > 180) throw new Error(`Invalid coordinates: ${c.cca3}`);
  const status = ['VAT','PSE'].includes(c.cca3) ? 'UN observer state' : 'UN member state';
  countryRows.push([c.cca3,c.name.common,c.cca2,status,status === 'UN member state' ? 'https://www.un.org/about-us/member-states' : 'https://www.un.org/en/node/123012']);
  const sourceCapital = c.capital?.join('; ') || '';
  const note = overrides[c.cca3] ? (c.cca3 === 'PSE' ? 'Ramallah administrative seat; capital status disputed; coordinate choice is a model convention.' : 'Jerusalem selected from GeoNames; international status disputed.') : sourceCapital !== city.name ? `GeoNames PPLC selected; reference capital label: ${sourceCapital}` : 'GeoNames PPLC';
  capitalRows.push([c.cca3,city.name,city.lat,city.lon,city.id,`https://www.geonames.org/${city.id}/`,note]);
}
fs.mkdirSync('data', {recursive:true});
fs.writeFileSync('data/countries.csv',csv(countryRows));
fs.writeFileSync('data/capitals.csv',csv(capitalRows));
console.log(`countries=${countryRows.length-1} capitals=${capitalRows.length-1}`);
console.log(capitalRows.filter(r => r[6].startsWith('GeoNames PPLC selected')).map(r => `${r[0]}: ${r[1]} (${r[6]})`).join('\n'));
