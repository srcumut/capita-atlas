"""Check archived T03 sources and extracted country-year observations."""
import csv
import hashlib
import json
from collections import Counter, defaultdict
from decimal import Decimal
from pathlib import Path

root = Path(__file__).resolve().parents[1]
countries = {r['country_id'] for r in csv.DictReader((root / 'data/countries.csv').open(encoding='utf-8-sig'))}
indicators = {r['indicator_id'] for r in csv.DictReader((root / 'data/indicators.csv').open(encoding='utf-8-sig'))}
manifests = []
for name in ['wdi-source-manifest.json', 'candidate-source-manifest.json']:
    manifests += json.loads((root / 'data' / name).read_text(encoding='utf-8'))
assert {r['indicator_id'] for r in manifests} == indicators
for entry in manifests:
    path = root / entry['raw_path']
    assert path.stat().st_size == entry['bytes']
    assert hashlib.sha256(path.read_bytes()).hexdigest() == entry['sha256']

by_indicator = defaultdict(list)
seen = set()
for name in ['wdi-observations.csv', 'candidate-observations.csv']:
    for row in csv.DictReader((root / 'data' / name).open(encoding='utf-8')):
        assert row['country_id'] in countries
        assert row['indicator_id'] in indicators
        assert row['source_country_code'] and row['unit'] and row['source_url'] and row['retrieved_at']
        assert row['reference_year'].isdigit()
        key = (row['country_id'], row['indicator_id'], row['reference_year'])
        assert key not in seen, key
        seen.add(key)
        if row['value']:
            Decimal(row['value'])
        else:
            assert row['status'] in {'missing', 'not_applicable'}
        by_indicator[row['indicator_id']].append(row)

for indicator, rows in sorted(by_indicator.items()):
    print(indicator, 'rows', len(rows), 'countries', len({r['country_id'] for r in rows}),
          'years', min(int(r['reference_year']) for r in rows), max(int(r['reference_year']) for r in rows),
          'statuses', dict(Counter(r['status'] for r in rows)))
print('Validated', len(manifests), 'raw sources and', len(seen), 'unique observation keys')
