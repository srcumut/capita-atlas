# T04 — Veri kalite raporu

Üretim: 2026-10-03; `node scripts/report-t04.mjs`. Kaynak: T03'ün eşlenmiş gözlemleri ve T02 gösterge sözlüğü. Bu rapor bir gösterge seçimi veya eksik veri doldurma kararı vermez.

| Gösterge | Satır | Sayısal | Açık boş | Durumlar | Negatif | Sıfır | Birim sayısı |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| population_total | 12804 | 12774 | 30 | missing: 30; reported: 12774 | 0 | 0 | 1 |
| gdp_current_usd | 12804 | 10994 | 1810 | missing: 1810; reported: 10994 | 0 | 0 | 1 |
| manufacturing_va_usd | 12804 | 7862 | 4942 | missing: 4942; reported: 7862 | 0 | 41 | 1 |
| agricultural_gpv | 7802 | 7802 | 0 | source_flagged: 7802 | 0 | 0 | 1 |
| hdi | 6596 | 5906 | 690 | missing: 690; reported: 5906 | 0 | 0 | 1 |
| military_expenditure | 12705 | 8291 | 4414 | estimated: 1749; highly_uncertain: 99; missing: 2220; not_applicable: 2194; reported: 6443 | 0 | 180 | 1 |
| merchandise_exports | 14520 | 12879 | 1641 | missing: 1641; reported: 12879 | 0 | 10 | 1 |
| disaster_mortality_rate | 2122 | 2122 | 0 | nature_C: 2122 | 0 | 306 | 1 |

Sayısal değer, tanım veya kaynak bayrağı bakımından otomatik olarak model için uygun sayılmaz. Boş değer sıfır sayılmadı. Durum ve yöntem notları T03 dosyalarında aynen korunur.

## Tanım ve karşılaştırılabilirlik

- **population_total:** Population is a stock; country and year coverage must be checked Birim: persons.
- **gdp_current_usd:** Exchange rate and price-year effects; overlaps with manufacturing Birim: current USD.
- **manufacturing_va_usd:** Subset of GDP; double-counting requires T05 assessment Birim: current USD.
- **agricultural_gpv:** Exact aggregate and constant-price base must be frozen at extraction Birim: 1000 USD.
- **hdi:** Index ratio is not quality-of-life ratio; direct category share is unsuitable Birim: index 0-1.
- **military_expenditure:** Spending is not military capability; release base year must be frozen Birim: million constant 2024 USD.
- **merchandise_exports:** Trade value is an incomplete proxy for geopolitical reach; re-exports and hubs need review Birim: million current USD.
- **disaster_mortality_rate:** Zero-heavy volatile harm measure; event attribution and direction need T05 decision Birim: per 100000 people.

## T05 için açık konular

- Ortak referans yılı seçilmedi. [Yıllık kapsam tablosu](../data/quality/year-coverage.csv) ile seçilecek yıllardaki boşluklar ve yakın yıl ihtiyacı incelenmeli.
- HDI ve afet ölüm/kayıp oranı doğrudan kapasite payı değildir; yön/dönüşüm kararı gerekir.
- GSYH ile imalat katma değeri örtüşür. Cari USD ile sabit bazlı USD serileri tek toplam gibi yorumlanmamalı.
- SIPRI tahmin ve belirsizlik durumları, FAOSTAT ve BM SDG yöntem notları gösterge seçimi ve belirsizlik politikasında incelenmeli.
- Kayıtsız ülke ile kaynakta açık boş değer ayrımı korunmalı; ikisi de otomatik sıfırlanmamalı.
