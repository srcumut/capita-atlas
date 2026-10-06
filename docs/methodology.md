# T05 — İlk sürüm metodolojisi

Karar tarihi: 2026-10-03. Kapsam: D-002'deki 195 ülke. Kaynak: T03 arşivi ve T04 kapsam/kalite raporları. Yıl tercihi D-005 ile güncellendi. Bu belge `model-config.json` ile birlikte ilk sürümün hesap sözleşmesidir; bir dünya başkentinin bilimsel olarak tek doğru yerini iddia etmez.

## Gösterge ve yıl seçimi

Ortak gözlem yılı **2025**. Kullanıcının günümüze en yakın veriyi önceliklendirmesi nedeniyle seçili iki serinin arşivdeki en son ortak yılı kullanılır. 2023'te ortak sayısal kapsam 188/195, 2024'te 187/195, 2025'te 181/195'tir. Güncellik tercihinin kapsamı azalttığı açıkça gösterilir; yıllar karıştırılmaz. Yeni kaynak sürümlerinde en son ortak yıl yeniden değerlendirilir ve karar/config güncellenir; sessiz otomatik yıl değişimi yapılmaz.

İlk sürümde yalnız **nüfus** (`population_total`) ve **ekonomik çıktı** (`gdp_current_usd`) çekime girer. Her biri tek göstergeli bir kategoridir. 2025 nüfusu 194/195, GSYH'sı 181/195 ülkede sayısaldır; ortak tam kapsam 181/195'tir. Eksik GSYH: AFG, ARE, BHS, CUB, ERI, LBN, LIE, MCO, PRK, SMR, SSD, SYR, VAT, YEM. Nüfus eksiği VAT'tır. GSYH cari USD cinsinden ülkeler arası kur/fiyat etkisi taşır; bu sonuç ekonomik kapasitenin eksiksiz ölçümü olarak sunulmaz.

Diğer altı aday bu ilk sürüm çekiminden çıkarılmıştır: imalat GSYH'nın alt kümesidir ve çift sayım riski taşır; tarım üretim değeri yalnız 134/195 ülkeyi (2023) kapsar ve 2014–2016 bazlı sabit USD'dir; HDI 192/195 olsa da endeks oranı yaşam kalitesi oranı değildir; askerî harcama 152/195'tir, tahmin/belirsizlik bayrakları ve kapasite vekilliği vardır; mal ihracatı 191/195 olsa da GSYH ile örtüşen ve yeniden ihracattan etkilenen dar bir jeopolitik erişim vekilidir; afet ölüm oranı 78/195'tir, sıfır yoğun, oynak ve ters yönlüdür. Bunlar veri setinden silinmez; daha kapsamlı senaryolar için aday olarak kalır. Sonraki senaryolara ekleme ayrı karar ve duyarlılık incelemesi gerektirir.

## Ağırlık, pay ve bütçe

Kategori ağırlıkları nüfus için **0,5**, ekonomi için **0,5**. Eşitlik veri tarafından belirlenmez; iki farklı kapasiteyi başlangıçta aynı normatif önemde tutan, açıkça değiştirilebilir bir tercihdir. Nüfus ve GSYH pozitif, anlamlı sıfırlı toplam büyüklüklerdir. Her kategori için 195 ülkenin tamamı çözümlendiğinde `p[i,k] = x[i,k] / sum_j x[j,k]`; `q[i] = 0,5 p[i,population] + 0,5 p[i,economy]`. Toplam çekim payı 1 olmalıdır. Her kategorinin tek göstergesi olduğundan kategori içi ağırlık 1'dir. Negatif, sayısal olmayan veya paydası sıfır veri hata doğurur. Eksik değer sıfır değildir.

Toplam bütçe **1.000 km**. Bu bir yer değiştirme ölçeği tercihidir, veri tahmini değildir. İlk sürümde sabit kalır; arayüzde açıkça gösterilir. Başlangıç 0° enlem/0° boylamdır. Mesafe çarpanı 1'dir; bütün başkent yön vektörleri aynı başlangıçtan eşzamanlı toplanır. Başkent yönü ve sonuç için WGS84 elipsoidi kullanılır. Sonuç denize düşerse ham koordinat korunur. Başlangıçla çakışan, karşıt nokta ve net sıfır vektör uç durumları planın 5. bölümündeki şekilde açık durum olarak ele alınır.

## Eksik değer ve yayımlama kuralı

195 ülkelik evrende bir seçili göstergenin değeri eksikse ülke çekim payı ve **tek bir küresel sonuç koordinatı hesaplanmaz**. Yalnız mevcut 181 ülkeyle paydayı yeniden tanımlamak veya eksik ülkeyi sıfır almak yasaktır. T06, eksik kayıtları `null` ve nedenleriyle taşır; kaynakta açık boş ile satır yokluğunu ayırır. Karşılaştırılabilir alternatif kaynak veya gerekçeli yakın yıl/tahmin ancak ayrıca belgelenmiş karar, yöntem ve belirsizlikle kullanılabilir. Şimdiki konfigürasyon bunlara otomatik izin vermez. Bu nedenle mevcut arşivden ilk sürüm için kesin koordinat üretimi veri çözümüne bağlıdır.

T06 veri hattı seçilen yıl ve göstergeleri hazırlayabilir; T07 geçerli tam veri için puan motorunu ve eksik kapsam için açık hata durumunu doğrulayabilir. Eksik 14 ülke çözümlenmeden gerçek veriye dayalı sonuç gösterilemez. İstenirse yalnız açıkça etiketlenmiş sentetik test verisiyle hesap motoru test edilir.

## Yeniden üretim ve sınırlar

Ham kaynaklar değişmez. T06 işlenmiş gözlemlerde kaynak URL'si, sürüm, erişim zamanı, birim, yıl, kaynak bayrağı ve yöntem notunu korur. `model-config.json` sürümlenir. T04 raporlarındaki kapsam ve bayraklar her yeni kaynak sürümünde yeniden denetlenir. 2025 cari USD GSYH ile nüfusun tek kesitteki payları yıllar arası trend veya refah karşılaştırması değildir. Kategori ağırlıkları ve 1.000 km bütçe için T11'de duyarlılık raporu gerekir.

## T08 vektör uygulaması

D-006 gereği her pozitif ülke payı için başlangıçtan başkente WGS84 başlangıç azimutu hesaplanır. Doğu bileşeni `B × q × sin(azimut)`, kuzey bileşeni `B × q × cos(azimut)` km'dir. Ülke kimliği sırasıyla hassas toplam kullanılır. Net büyüklük ve azimut başlangıçtan WGS84 doğrudan jeodezik hesabına verilir. Mesafe çarpanı 1'dir. İlk sürüm bütçe sınırı 0–1.000 km'dir. Çakışan/karşıt yön, yakınsamama ve geçersiz girdiler açık hatadır; 1e-10 km altı net büyüklük yönsüz `zero_result` üretir. Gerçek veri eksikliği `blocked_missing_data` üretir, koordinat üretmez.

## 2026-10-03 bütçe güncellemesi (D-008)

Kullanıcının deneme isteğiyle varsayılan ve üst sınır 10.000 km oldu. Pay ve vektör formülü değişmedi; 1.000 km seçimi de arayüzde yapılabilir. 10.000 km, her ülkenin payıyla ölçeklenmiş vektör uzunluklarının toplamıdır; net sonuç yön iptalinden ötürü daha kısa olabilir. 10.000 km tek WGS84 ilerlemedir, çoklu tur değildir. Önceki 1.000 km rapor sayıları tarihsel koşuya aittir.

## Uzaklığa bağlı çekim senaryosu (D-010)

Ana modelde `gain=0`, `base=1` ve mesafe etkisi yoktur. Deneysel senaryoda başkent `i` için orijinden WGS84 jeodezik mesafe `d_i` km, ham ülke çekim payı `q_i` olsun. `m_i = base + gain × d_i/10.000`; `q'_i = q_i m_i / Σ_j(q_j m_j)`. Vektör uzunluğu `B × q'_i`; yön hesabı ve WGS84 sonuç adımı değişmez. `base` 0,1–5, `gain` 0–5. Payların toplamı yine 1'dir. `gain=0` eski modeli verir. `base` ile `gain` aynı oranda çarpılırsa normalizasyon nedeniyle sonuç aynı kalır; asıl ilişki `gain/base` oranıdır. Uzak ülkeye daha yüksek göreli pay vermek net vektörün mutlak uzunluğunu zorunlu olarak artırmaz; yön iptali devam eder. Eksik gerçek gözlemler bu yöntemle doldurulmaz.
