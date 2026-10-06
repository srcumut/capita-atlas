# T12 demo senaryoları — 0.1.0-preview

Tarih: 2026-10-03. Senaryolar mevcut kaynak gözlemlerini ve model davranışını ayırır; sentetik doğrulama değerleri gerçek sonuç olarak gösterilmez.

| Senaryo | Adımlar | Beklenen gözlem |
| --- | --- | --- |
| İlk açılış | README'deki yerel sunucuyu açın. | 195 başkent yüklenir. Sonuç paneli 14 ülkedeki 15 eksik 2025 gözlemi nedeniyle küresel pay/ok/koordinat üretilemediğini bildirir. |
| Kaynak ve eksik | Bir başkente tıklayın; örneğin VAT ve tam kaydı olan bir ülkeyi karşılaştırın. | Ülke paneli ham değer, birim, 2025 yılı, durum ve kaynak bağlantısını gösterir. VAT'ta nüfus ve GSYH eksiktir; `Eksik` sıfır değildir. |
| Ağırlık ve bütçe | Nüfus ağırlığını %75, bütçeyi 250 km yapıp Hesapla'ya basın; ardından %0 veya 0 km deneyin. | Seçilen ayarlar görünür; veri engeli devam eder. Sıfır ağırlık/bütçe eksik kaynak gözlemlerini doldurmaz. |
| Harita hareketi | Yakınlaştırın, sürükleyin ve Başlangıç görünümü'ne basın. | Kamera değişir; hesap sonucu ve eksik kapsam sayısı değişmez. |
| Duyarlılık | Duyarlılık bölümündeki senaryo raporunu açın. | 20/20 senaryo `blocked_missing_data`; koordinatlar `null`. Matematiksel üst sınırlar gerçek koordinat etkisi değildir. |
| Matematiksel uç durumlar | `python scripts/check-t07.py` ve `python scripts/check-t08.py` çalıştırın. | Sentetik tam kapsamda pay toplamı/oran/sıra bağımsızlığı; WGS84 1.000 km, eşit zıt çekimde yönsüz sıfır, geçersiz kapsam ve belirsiz yön hataları denetlenir. Bu kontrol gerçek koordinat yayınlamaz. |

Harita betikleri ve karoları çevrimiçi olduğundan görsel demo ağ bağlantısına bağlıdır. `GET /api/snapshot` ve `GET /api/sensitivity` sayısal durumu haritadan bağımsız gösterir.
