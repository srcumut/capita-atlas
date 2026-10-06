# Sekiz kategorili en son mevcut veri modu

Karar: D-011, 2026-10-03. Bu, önceki ortak 2025 iki kategori modelinden ayrı **deneysel karşılaştırma modu**dur. Varsayılan arayüz modu olmuştur. Orijin (0°,0°), 195 ülke, seçilmiş başkentler, WGS84 ve 10.000 km bütçe korunur. D-010 uzaklık çarpanı arayüz ve hesap yolundan çıkarıldı.

## Veri seçimi

`scripts/build-all-data.py`, T03'ün değiştirilmemiş WDI ve aday gözlem arşivleri ile kaynaklı ek gözlemleri okur. Her ülke–gösterge için **sayısal değeri bulunan en yeni yıl** seçilir. Aynı yıl çakışırsa arşiv WDI/adaya ek kaynaktan önce gelir. Çıktı `data/processed/latest-all-observations.json` dosyasıdır; `--check` aynı girdiden aynı baytları doğrular. Her kaydın gerçek yılı, birimi, kaynağı, durumu ve kaynak dosyası saklanır. Ortak yıl varmış gibi gösterilmez.

195 × 8 = 1.560 olası kaydın 1.431'i sayısaldır; 129'u `null` durumundadır. Kategori kapsamı: nüfus 195, GSYH 194, imalat 188, tarım 136, askerî harcama 161, mal ihracatı 191, HDI 192, afet ölüm/kayıp oranı 174. Sayısal kayıtların bazıları tahminli, bayraklı veya eski yıldandır; kapsama girmeleri eşit kalite anlamına gelmez.

## Paylar ve eksik değer

Sekiz kategori eşit `1/8` ağırlık alır. Bir kategoriye ait dönüşüm yalnız **o göstergede sayısal gözlemi olan ülkeler** arasında hesaplanır; kategori paylarının toplamı 1 olur. Eksik ülkenin ham değeri `null` kalır, bu kategorinin payı da `null` gösterilir ve toplam çekimine bu kategoriden terim eklenmez. Bu, sıfır gözlem veya tahmin iddiası değildir. Ülkenin diğer kategori ağırlıkları özel olarak büyütülmez. Böylece her kategori bütçesi sabit kalır; fakat eksik ülke o kategoride çekim alamaz. Sonuç eksik kapsamın coğrafi dağılımına duyarlıdır.

## Dönüşümler

Nüfus, GSYH, imalat, tarım, askerî harcama ve mal ihracatı için kullanıcı şu dönüşümlerden birini seçer: ham büyüklük payı; maksimuma bölme; pozitif gözlemlerin medyanıyla ölçeksiz `log(1+x/medyan)`; min–max; yüzdelik sıra. Her dönüşüm sonrasında negatif olmayan puanlar kategori toplamına bölünür. Maksimuma bölme bu son adım yüzünden ham payla matematiksel olarak eşdeğerdir. Log ve sıra büyük ülkelerin göreli etkisini azaltır; daha doğru oldukları kanıtlanmış değildir. Min=max veya tüm sıfır durumları açıkça ele alınır; geçersiz kategori toplamı hata verir.

HDI için doğrudan endeks oranı yerine gözlenen aralıkta min–max kullanılır. Afet ölüm/kayıp oranında düşük değer iyi sayılır ve ters yüzdelik sıra uygulanır; sıfır eşitlikleri aynı puanı alır. Bu iki dönüşüm seçilen kapasite normalizasyonundan bağımsızdır. HDI'da en düşük gözlem ve afette en yüksek oran sıfır puan alır; bu **ölçülmüş sıfır refah/dayanıklılık** anlamına gelmez.

## Yorum sınırları

GSYH ile imalat ve ihracat örtüşür; eşit sekiz ağırlık bu bilgiyi çifte sayabilir. HDI bir kapasite toplamı, askerî harcama askerî güç, afet ölüm oranı konumun yerel güvenliği değildir. Farklı yıllar ve kaynak bayrakları gözlem panelinde görünür. Özellikle tarımın eski fiyat bazı ve bazı ülkelerin çok eski yılı karşılaştırmayı zayıflatır. Sonuç deneysel aday koordinattır; bilimsel doğruluk veya tek dünya başkenti iddiası değildir. Veri güncellemesi ve ağırlık duyarlılığı sonraki çalışmadır.
