# Görev durumu

Son güncelleme: 2026-10-03. Üst plan: `WORLD_CAPITAL_PROJECT_PLAN.md`.

| Görev | Durum | Bağımlılık / sonraki adım |
| --- | --- | --- |
| T00 | Tamamlandı | Proje ve ortak doküman düzeni kuruldu. |
| T01 | Tamamlandı | 195 ülke ve kaynaklı başkent kaydı üretildi; D-002. |
| T02 | Tamamlandı | Sekiz aday tanım, kaynak araştırması ve uygunluk matrisi kaydedildi; nihai seçim T05'te. |
| T03 | Tamamlandı | Sekiz ham kaynak arşivlendi/eşlendi; 82.157 benzersiz ülke–gösterge–yıl anahtarı doğrulandı. |
| T04 | Tamamlandı | 195 ülke × 8 gösterge kapsamı, 472 gösterge-yıl sayımı ve kalite/bayrak raporu üretildi. |
| T05 | Tamamlandı | 2025 nüfus ve GSYH; yıl tercihi D-005 ile güncellendi. |
| T06 | Tamamlandı | 390 eski mod kaydı; yeni sekiz kategori modunda 1.560 kayıt, 1.431 sayısal. |
| T07 | Tamamlandı | Eski iki kategori ve yeni sekiz kategori normalizasyon motorları hazır; 129 yeni mod eksik kaydı açık. |
| T08 | Tamamlandı | WGS84 vektör motoru, uç durum ve D-007 keşif senaryosu bileşen denetimi hazır; gerçek küresel sonuç veri çözümüne bağlı. |
| T09 | Tamamlandı | 195 başkentli MapLibre haritası Next.js bileşenine taşındı; GeoJSON `apps/web/public/` içinde yeniden üretilir. |
| T10 | Tamamlandı | D-011 hesap arayüzü Next.js, TypeScript, Tailwind ve shadcn/ui ile çalışır; eski modun veri engeli sürüyor. |
| T11 | Tamamlandı | 20 senaryo raporu ve arayüz özeti hazır; gerçek koordinat duyarlılığı 14 eksik ülke nedeniyle çözülemedi. |
| T12 | Tamamlandı | Capita Atlas çalıştırma ve klasör rehberi güncellendi; sekiz kategori sonucu deneysel, eski mod veri engelli. |

Sıradaki iş: D-009 dört ek kaynaklı kayıt sonrasında kalan 11 boş gözlem için IMF WEO/BM Ulusal Hesaplar ülke-yıl taraması ve karşılaştırılabilirlik kararı; ardından T06–T11 gerçek veri çıktılarının yeniden üretimi. D-008 bütçeyi 10.000 km yaptı. Keşif modu gözlem için hazır; gerçek sonuç engelini kaldırmaz.

Açık konular: 2025 seçili göstergelerdeki 14 eksik ülke için karşılaştırılabilir veri çözümü; alternatif kaynak/yıl/tahmin kullanılırsa ayrı yöntem kararı. T11'in gerçek koordinat duyarlılığı veri çözümünden sonra yeniden çalıştırılmalı.





Güncel varsayılan deneysel mod D-011: sekiz kategori, en son mevcut yıl, 1.431/1.560 sayısal kayıt; eksikler null. Önceki D-010 uzaklık özelliği kaldırıldı. Ayrıntı: docs/all-data-methodology.md.

Arayüz kararı D-012: etkin frontend `apps/web/` Next.js; Python API ve model `scripts/` ile `src/` içinde. Eski statik arayüz `legacy/static-web/` arşivinde. Matematik ve veri politikası değişmedi.

