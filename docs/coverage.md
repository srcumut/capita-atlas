# T04 — Kapsam raporu

Üretim: 2026-10-03; `node scripts/report-t04.mjs`. Evren: T01'in 195 ülkesi. “Değer” yalnız sayısal kaynak gözlemidir; boş satır ile kayıtsız ülke ayrı sayılır. Kaynağın son yılı ortak model yılı olarak seçilmemiştir.

| Gösterge | Kaynak yıl aralığı | Değerli ülke (herhangi yıl) | Kaynak son yılı | Son yılda değer | Son yılda boş satır | Son yılda satır yok |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| population_total | 1960–2025 | 194/195 | 2025 | 194 | 0 | 1 |
| gdp_current_usd | 1960–2025 | 193/195 | 2025 | 181 | 13 | 1 |
| manufacturing_va_usd | 1960–2025 | 188/195 | 2025 | 130 | 64 | 1 |
| agricultural_gpv | 1961–2024 | 136/195 | 2024 | 133 | 0 | 62 |
| hdi | 1990–2023 | 192/195 | 2023 | 192 | 2 | 1 |
| military_expenditure | 1949–2025 | 161/195 | 2025 | 149 | 16 | 30 |
| merchandise_exports | 1948–2025 | 191/195 | 2025 | 191 | 0 | 4 |
| disaster_mortality_rate | 2005–2025 | 174/195 | 2025 | 7 | 0 | 188 |

Ülke × gösterge ayrıntısı [country-indicator-coverage.csv](../data/quality/country-indicator-coverage.csv), tüm yıl sayımları [year-coverage.csv](../data/quality/year-coverage.csv) dosyasındadır. Yıllık tabloda payda her zaman 195'tir; kaynak yıl aralığı dışında satır üretilmez.

## Son kaynak yılında sekiz gösterge

4/195 ülkede sekiz göstergenin de kendi kaynak son yılında sayısal değer vardır. Bu yıllar farklı olduğundan eşzamanlı tam veri anlamına gelmez.

## Kaynak son yılında değeri olmayan ülkeler

- **population_total (2025):** 1 ülke — VAT.
- **gdp_current_usd (2025):** 14 ülke — AFG, ARE, BHS, CUB, ERI, LBN, LIE, MCO, PRK, SMR, SSD, SYR, VAT, YEM.
- **manufacturing_va_usd (2025):** 65 ülke — AFG, AND, ARE, BGR, BHS, BLZ, BOL, BRB, BTN, CAF, CAN, COG, CUB, DJI, DZA, ERI, GIN, GMB, IRN, ISR, JPN, KIR, LBN, LBR, LBY, LIE, LSO, MCO, MDG, MHL, MNE, MWI, NER, NRU, NZL, PER, PLW, PNG, PRK, PSE, SDN, SLB, SLE, SMR, SOM, SRB, SSD, SUR, SYR, TCD, TGO, TJK, TKM, TLS, TON, TTO, TUN, TUR, TUV, TZA, USA, VAT, VEN, VUT, YEM.
- **agricultural_gpv (2024):** 62 ülke — AFG, AGO, ALB, AND, ARE, ARG, ARM, ATG, AUS, AUT, AZE, BEL, BGD, BHR, BHS, BIH, BLZ, BOL, BRA, BRB, BRN, BTN, BWA, COD, COM, CUB, DJI, DMA, DZA, FSM, GAB, GTM, HTI, KIR, LBR, LBY, LIE, LSO, MCO, MHL, MMR, MNE, MRT, NIC, NRU, PLW, PNG, PRK, PSE, SLB, SMR, SOM, SSD, STP, SWZ, SYR, TON, TUV, UGA, UZB, VAT, VEN.
- **hdi (2023):** 3 ülke — MCO, PRK, VAT.
- **military_expenditure (2025):** 46 ülke — AFG, AND, ARE, ATG, BHS, BRB, BRN, BTN, COM, CUB, DJI, DMA, ERI, FSM, GRD, KIR, KNA, LAO, LBY, LCA, LIE, MCO, MDV, MHL, MMR, NRU, PLW, PRK, PSE, QAT, SDN, SLB, SMR, STP, SUR, SYR, TKM, TON, TUV, UZB, VAT, VCT, VEN, VUT, WSM, YEM.
- **merchandise_exports (2025):** 4 ülke — LIE, MCO, SMR, VAT.
- **disaster_mortality_rate (2025):** 188 ülke — AFG, ALB, AND, ARE, ARG, ARM, ATG, AUS, AUT, AZE, BDI, BEL, BEN, BFA, BGD, BGR, BHR, BHS, BIH, BLR, BLZ, BOL, BRA, BRB, BRN, BTN, BWA, CAF, CAN, CHE, CHL, CHN, CIV, CMR, COD, COG, COL, COM, CPV, CRI, CUB, CYP, CZE, DEU, DJI, DMA, DNK, DOM, DZA, ECU, EGY, ERI, ESP, EST, ETH, FIN, FJI, FRA, FSM, GAB, GBR, GEO, GHA, GIN, GMB, GNB, GNQ, GRC, GRD, GTM, GUY, HND, HRV, HTI, HUN, IDN, IND, IRL, IRN, IRQ, ISL, ISR, ITA, JAM, JOR, JPN, KAZ, KGZ, KHM, KIR, KNA, KOR, KWT, LAO, LBN, LBR, LBY, LCA, LIE, LKA, LSO, LTU, LUX, LVA, MAR, MCO, MDA, MDG, MDV, MEX, MHL, MKD, MLI, MLT, MMR, MNE, MNG, MRT, MUS, MWI, NAM, NGA, NIC, NLD, NOR, NPL, NRU, NZL, OMN, PAK, PAN, PER, PHL, PLW, PNG, POL, PRK, PRT, PRY, PSE, QAT, ROU, RUS, RWA, SAU, SDN, SEN, SGP, SLB, SLE, SLV, SMR, SRB, SSD, STP, SUR, SVK, SVN, SWE, SWZ, SYC, SYR, TCD, TGO, THA, TJK, TKM, TLS, TON, TTO, TUN, TUR, TUV, TZA, UGA, UKR, URY, USA, UZB, VAT, VCT, VEN, VNM, VUT, WSM, YEM, ZAF, ZWE.
