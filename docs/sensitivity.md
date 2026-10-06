# T11 — Duyarlılık ve belirsizlik raporu

Tarih: 2026-10-03. Evren: D-002'deki 195 ülke; D-005 gereği 2025 nüfus ve cari USD GSYH. Ana senaryo nüfus/ekonomi 0,5/0,5, bütçe 1.000 km, WGS84 ve başlangıç (0°, 0°). Bu rapor yöntem kararı değiştirmez.

## Yeniden üretilebilir tarama

`scripts/report-t11.py`, nüfus ağırlığı 0, 0,25, 0,5, 0,75, 1 ile bütçe 0, 250, 500, 1.000 km'nin 20 birleşimini kabul edilmiş `src.score` ve `src.vector` modüllerinden geçirir. Makine çıktısı `data/processed/t11-sensitivity.json` dosyasıdır. Her senaryo `blocked_missing_data` döndü: 14 ülkede 15 seçili gözlem eksik. Sıfır ağırlık veya sıfır bütçe bile eksik seçili veriyi doldurmaz; kabul edilmiş tam kapsam kuralı korunur. Hiçbir senaryoda kategori payı, ülke çekimi veya küresel koordinat yoktur.

## Koşullu matematiksel duyarlılık

Bu sonuçlar yalnız 195 ülkenin iki seçili gözlemi çözüldükten sonra uygulanır. Sabit veri ve ağırlık altında bütçe `B` ile net vektör, dolayısıyla net yer değiştirme uzunluğu doğrusal ölçeklenir. Pozitif ve sıfır olmayan net vektörde yön aynı kalır. Sıfır bütçe başlangıç noktasını ve yönsüz sonucu verir. WGS84 üzerinde koordinatların enlem/boylam değerleri doğrusal ölçeklenmek zorunda değildir.

Sabit veride nüfus ve ekonomi kategori birim vektör ortalamaları `P` ve `E` olsun. Net vektör `V(w,B)=B[wP+(1-w)E]` olur. `|P|≤1`, `|E|≤1` olduğundan `w` ağırlığının `Δw` kadar değiştirilmesi net vektörü en çok `2B|Δw|` km değiştirir. Örneğin 1.000 km bütçede 0,5'ten 0,75'e geçişin **üst sınırı** 500 km'dir; gözlenen etki değildir. Gerçek vektör farkı, yön ve koordinat değişimi eksik veri nedeniyle bilinmez. `B` değişiminin net vektör farkı en çok `|ΔB|` km'dir.

## Veri varsayımı ve belirsizlik sınırı

Eksik gözlemler için kabul edilmiş alternatif yıl, kaynak, tahmin dağılımı veya üst sınır yoktur. Bu nedenle sayısal veri belirsizliği aralığı, koordinat güven bölgesi ya da eksik ülkelerin etki sıralaması üretilemez. 181 tam ülkeye indirgeme, eksikleri sıfırlama ve keyfî senaryo değerleri kabul edilmiş küresel modelin sonucu olarak gösterilmez. 2025 cari USD GSYH'nin kur/fiyat etkisi ve kategori ağırlıklarının normatif niteliği de yorum sınırıdır.

## Kontroller ve devir

Tarama 20/20 engelli senaryo ve her birinde 15 eksik gözlem / 14 eksik ülke verdi. T07 ve T08 doğrulama betikleri, ayrıca `node --check web/map.js` başarılı. Tarayıcıda görsel inceleme yapılmadı. T12, gerçek/model/tahmin ayrımını ve bu engeli kullanım belgesine taşımalı. Gerçek küresel duyarlılık koordinatları ancak eksik gözlemler için ayrı karar, kaynak ve belirsizlik yöntemi kaydedildikten sonra üretilebilir.

## 2026-10-03 güncellemesi (D-008)

Bütçe taraması 0/2.500/5.000/10.000 km olarak yeniden üretildi. Tüm gerçek veri senaryoları 15 eksik gözlem nedeniyle hâlâ engelli. Önceki 1.000 km örnekleri tarihsel koşudur; formüldeki üst sınır artık 10.000 km'de ağırlık değişimi için 5.000 km olur.
