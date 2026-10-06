"""Extract candidate observations from archived UNDP, FAOSTAT, SIPRI and UN SDG files."""
import csv
import hashlib
import io
import json
import subprocess
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
countries = {r['country_id']: r for r in csv.DictReader((ROOT / 'data/countries.csv').open(encoding='utf-8-sig'))}
world = json.load((ROOT / 'data/raw/world-countries.json').open(encoding='utf-8'))
m49 = {str(int(r['ccn3'])): r['cca3'] for r in world if r.get('ccn3') and r.get('cca3') in countries}
name_map = {r['name']: code for code, r in countries.items()}
name_map.update({
    'Congo, DR': 'COD', 'Congo, Republic': 'COG', "Cote d'Ivoire": 'CIV',
    'Gambia, The': 'GMB', 'United States of America': 'USA',
    'Korea, South': 'KOR', 'Timor Leste': 'TLS', 'Viet Nam': 'VNM',
    'Kyrgyz Republic': 'KGZ',
})
out = ROOT / 'data/candidate-observations.csv'
fields = ['country_id', 'source_country_code', 'indicator_id', 'value', 'unit',
          'reference_year', 'source_url', 'retrieved_at', 'status', 'methodology_note']
counts = Counter()
seen = set()

def emit(writer, record):
    key = (record['country_id'], record['indicator_id'], record['reference_year'])
    if key in seen:
        raise ValueError(f'Duplicate country-indicator-year: {key}')
    seen.add(key)
    writer.writerow(record)
    counts[record['indicator_id']] += 1

raw_files = [
    ('UNDP_HDR', 'hdi', 'data/raw/undp/HDR25_Composite_indices_complete_time_series.csv',
     'https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv', '2025 HDR'),
    ('FAOSTAT', 'agricultural_gpv', 'data/raw/faostat/Value_of_Production_E_All_Data_(Normalized).zip',
     'https://bulks-faostat.fao.org/production/Value_of_Production_E_All_Data_(Normalized).zip', 'live QV bulk download; 2014-2016 base'),
    ('SIPRI_MILEX', 'military_expenditure', 'data/raw/sipri/SIPRI-Milex-data-1949-2025_v1.2.xlsx',
     'https://www.sipri.org/sites/default/files/SIPRI-Milex-data-1949-2025_v1.2.xlsx', '2026 v1.2; 2024 dollar base'),
    ('UN_SDG', 'disaster_mortality_rate', 'data/raw/un-sdg/2026_Q3.1_AllData_After_20260930_CSV.zip',
     'https://unstats.un.org/sdgs/indicators/database/archive/2026_Q3.1_AllData_After_20260930_CSV.zip', '2026-09-30 archive'),
    ('UNCTADSTAT', 'merchandise_exports', 'data/raw/unctad/US_TradeMerchTotal.csv.7z',
     'https://unctadstat-api.unctad.org/bulkdownload/US.TradeMerchTotal/US_TradeMerchTotal', 'TradeMerchTotal; updated 2026-03-19'),
]
manifest = []
with out.open('w', newline='', encoding='utf-8') as dest:
    writer = csv.DictWriter(dest, fieldnames=fields)
    writer.writeheader()
    for source, indicator, rel, url, release in raw_files:
        path = ROOT / rel
        stamp = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat()
        terms = {
            'UNDP_HDR': 'https://hdr.undp.org/copyright-and-terms-use',
            'FAOSTAT': 'https://www.fao.org/contact-us/terms/db-terms-of-use/en',
            'SIPRI_MILEX': 'https://www.sipri.org/databases/milex',
            'UN_SDG': 'https://www.un.org/en/about-us/terms-of-use',
            'UNCTADSTAT': 'https://unctadstat.unctad.org/EN/About.html',
        }[source]
        manifest.append({'source_id': source, 'indicator_id': indicator,
                         'raw_path': rel, 'url': url, 'release': release,
                         'terms_url': terms, 'retrieved_at': stamp,
                         'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                         'bytes': path.stat().st_size})
        if source == 'UNDP_HDR':
            for row in csv.DictReader(path.open(encoding='latin-1', newline='')):
                code = row['iso3']
                if code not in countries:
                    continue
                for year in range(1990, 2024):
                    value = row.get(f'hdi_{year}', '').strip()
                    if value == '..':
                        value = ''
                    emit(writer, dict(country_id=code, source_country_code=code,
                        indicator_id=indicator, value=value, unit='index 0-1',
                        reference_year=year, source_url=url, retrieved_at=stamp,
                        status='reported' if value else 'missing',
                        methodology_note='2025 HDR revision; blank source cell' if not value else ''))
        elif source == 'FAOSTAT':
            with zipfile.ZipFile(path) as archive:
                member = next(n for n in archive.namelist() if n.endswith('(Normalized).csv'))
                rows = csv.DictReader(io.TextIOWrapper(archive.open(member), encoding='utf-8-sig', newline=''))
                for row in rows:
                    if row['Item Code'] != '2051' or row['Element Code'] != '58':
                        continue
                    code = m49.get(row['Area Code (M49)'].strip("'"))
                    if code not in countries:
                        continue
                    emit(writer, dict(country_id=code, source_country_code=row['Area Code'],
                        indicator_id=indicator, value=row['Value'], unit=row['Unit'],
                        reference_year=row['Year'], source_url=url, retrieved_at=stamp,
                        status='missing' if not row['Value'] else 'source_flagged' if row['Flag'] else 'reported',
                        methodology_note=f"FAOSTAT Item 2051 Element 58; flag={row['Flag']}"))
        elif source == 'SIPRI_MILEX':
            book = openpyxl.load_workbook(path, data_only=True)
            sheet = book['Constant (2024) US$']
            for row in sheet.iter_rows(min_row=8):
                name = row[0].value
                code = name_map.get(name)
                if code not in countries:
                    continue
                for year_cell, cell in zip(sheet[6][3:], row[3:]):
                    year, value = year_cell.value, cell.value
                    if not isinstance(year, int):
                        continue
                    number = value if isinstance(value, (int, float)) else ''
                    color = cell.font.color
                    indexed = color.indexed if color and color.type == 'indexed' else None
                    status = ('not_applicable' if value == 'xxx' else
                              'missing' if number == '' else
                              'highly_uncertain' if indexed == 10 else
                              'estimated' if indexed == 12 else 'reported')
                    emit(writer, dict(country_id=code, source_country_code=name,
                        indicator_id=indicator, value=number, unit='million constant 2024 USD',
                        reference_year=year, source_url=url, retrieved_at=stamp,
                        status=status,
                        methodology_note=f'SIPRI source cell={value!s}; font_color_index={indexed}'))
            book.close()
        elif source == 'UN_SDG':
            with zipfile.ZipFile(path) as archive:
                member = next(n for n in archive.namelist() if n.endswith('.csv'))
                rows = csv.DictReader(io.TextIOWrapper(archive.open(member), encoding='utf-8-sig', newline=''))
                for row in rows:
                    if row['SeriesCode'] != 'VC_DSR_MTMP' or row['Indicator'] != '13.1.1' or row['Units'] != 'PER_100000_POP':
                        continue
                    code = m49.get(row['GeoAreaCode'])
                    if code not in countries:
                        continue
                    emit(writer, dict(country_id=code, source_country_code=row['GeoAreaCode'],
                        indicator_id=indicator, value=row['Value'], unit='per 100000 people',
                        reference_year=row['TimePeriod'], source_url=url, retrieved_at=stamp,
                        status='missing' if not row['Value'] else f"nature_{row['Nature'] or 'unknown'}",
                        methodology_note=f"release={row['ReleaseName']}; source={row['Source']}; footnote={row['FootNote']}"))
        else:
            content = subprocess.check_output(['tar', '-xOf', str(path), 'US_TradeMerchTotal.csv'])
            rows = csv.DictReader(io.StringIO(content.decode('utf-8-sig')))
            for row in rows:
                if row['Flow'] != '02':
                    continue
                code = m49.get(str(int(row['Economy']))) if row['Economy'].isdigit() else None
                if code not in countries:
                    continue
                value = row['US$ at current prices in millions']
                missing = row['US$ at current prices in millions Missing value']
                emit(writer, dict(country_id=code, source_country_code=row['Economy'],
                    indicator_id=indicator, value=value, unit='million current USD',
                    reference_year=row['Year'], source_url=url, retrieved_at=stamp,
                    status='missing' if missing or not value else 'reported',
                    methodology_note=f"UNCTAD flow 02 Exports; footnote={row['US$ at current prices in millions Footnote']}; missing_marker={missing}"))

(ROOT / 'data/candidate-source-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(dict(counts))
