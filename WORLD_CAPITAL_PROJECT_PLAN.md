# Capita Atlas — Proje Planı

İlk plan tarihi: 2026-10-02. Bu belge başlangıç kararlarını, açık konuları ve görev sırasını içerir. Güncel uygulama durumu `docs/STATUS.md`, ürün adı ve frontend teknoloji kararı D-012 ile `docs/DECISIONS.md` içindedir.

## 1. Amaç ve bilimsel yaklaşım

Ülkelerin ölçülebilir göstergelerinden türetilen çekim paylarını kullanarak, başlangıç noktasından ülkelerin seçilmiş başkentleri yönündeki vektörlerin eşzamanlı toplamını hesaplayan etkileşimli bir simülatör geliştirmek.

Çıktı gerçek veya bilimsel olarak tek doğru dünya başkenti iddiası taşımaz. Model varsayımları altında hesaplanan aday koordinattır. İstatistiksel doğruluk; veri tanımları, karşılaştırılabilirlik, ölçüm belirsizliği, tekrar üretilebilir hesap ve duyarlılık analiziyle sağlanır. Kategori ağırlıkları, başlangıç noktası ve kilometre bütçesi model tercihleridir; veriden zorunlu olarak çıkmaz.

## 2. Kabul edilen ana model

- Başlangıç koordinatı: 0° enlem, 0° boylam.
- Ülkelerin coğrafi merkezi değil, seçilmiş başkent koordinatı hedef alınır.
- Tüm vektörler aynı başlangıçtan hesaplanır ve aynı anda toplanır.
- Ana modelde mesafe çarpanı 1'dir; uzaklık ülkenin çekim büyüklüğünü artırmaz.
- İlk sürüm tek hamle hesabı ve etkileşimli 2D harita içerir.
- Toplam kapasite göstergelerinde kategori içindeki pay varsayılandır.
- Gerçek büyüklük farkları korunur; sıralama grupları çekim hesabında kullanılmaz.
- Eksik değerler sıfır değil null olarak saklanır.
- Sonuç denize düşerse ham koordinat gösterilir; sessizce karaya taşınmaz.
- Nihai kategori ağırlıkları ve toplam kilometre bütçesi henüz kararlaştırılmadı.

## 3. Gösterge tasarımı

İlk araştırma başlıkları: nüfus, ekonomi, imalat ve üretim, tarımsal kapasite, hayat kalitesi, askerî kapasite, jeopolitik erişim, afet ve iklim dayanıklılığı.

Bu başlıklar henüz onaylanmış veri sütunları değildir. Her biri için ölçülen kavram, birim, kaynak, tarih kapsamı, ülke kapsamı ve uygun dönüşüm tanımlanacak.

- Sanayi/endüstri/imalat aynı kapasiteyi mükerrer ödüllendirmemeli.
- Toplam üretim ile kişi başına üretim farklı kavramlardır.
- Tarım alanı, ürün verimi ve üretim hacmi birbirinin yerine kullanılamaz. Farklı ürünlerin tonları gerekçesiz toplanamaz.
- Askerî harcama, askerî kapasitenin eksik bir vekil göstergesidir.
- Hayat kalitesi endeksinin oranı doğrudan hayat kalitesinin oranı değildir.
- Ülke genelindeki risk ve yaşam koşulları, aday konumun yerel uygunluğu değildir.
- Korelasyon analizi mükerrer bilgiyi araştırır; yüksek korelasyon tek başına gösterge silme gerekçesi değildir.
- PCA veya veriden türetilmiş ağırlıklar değişkenliği açıklayabilir; siyasi veya toplumsal önemi nesnel olarak belirlemez.

## 4. Normalizasyon

### 4.1 Varsayılan: kategori içindeki pay

Pozitif veya sıfır değerli, anlamlı sıfıra sahip toplam kapasite göstergeleri için:

`p[i,k] = x[i,k] / sum_j(x[j,k])`

Her kategorinin toplamı 1 olur; ham büyüklük oranları korunur. Paydanın kapsamı sabit ve belgeli olmalıdır. Eksik ülke verileri varken hesaplanan pay tam dünya payı diye sunulamaz.

Ülke çekim payı: `q[i] = sum_k(w[k] * p[i,k])`, `w[k] >= 0`, `sum_k(w[k]) = 1`.

Bir kategoride birden fazla gösterge varsa önce kategori içi ağırlıklarla birleştirilecek; çok gösterge içeren kategori kendiliğinden daha fazla etki kazanmayacak.

### 4.2 Sonraki faz: normalizasyon karşılaştırma modu

Amaç aynı veri, ülke kapsamı, kategori ağırlıkları ve kilometre bütçesi altında dönüşümün sonucu nasıl değiştirdiğini göstermek.

Planlanan yöntemler:

| Yöntem | Dönüşüm | Not |
| --- | --- | --- |
| Kategori payı | x / toplam(x) | Ana kapasite modeli |
| Maksimuma bölme | x / maksimum(x) | Oranları korur |
| Min–max | (x-min)/(max-min) | En küçük gözlem sıfır olur; oranlar korunmaz |
| Logaritmik dönüşüm | Göstergeye uygun, belgeli log dönüşümü | Büyük farkları sıkıştırır; pozitiflik ve birim kuralları gerekir |
| Sıra/yüzdelik | Belgeli sıra dönüşümü | Büyüklük farklarını kaybeder; yalnız deneysel karşılaştırma |

Karşılaştırmada her yöntem önce negatif olmayan ara puan `t[i,k]` üretir, sonra `p[i,k] = t[i,k] / sum_j(t[j,k])` ile kategori bütçesi yeniden 1'e sabitlenir. Böylece dönüşüm değişikliği kategori ağırlığını istemeden değiştirmez.

Önemli: Pozitif veride maksimuma bölme ardından toplama bölme, doğrudan kategori payıyla aynı sonucu verir. Bu eşdeğerlik test edilecek ve arayüzde açıklanacak; farklıymış gibi sunulmayacak.

Z-puanı negatif değer üretebilir; çekim payına doğrudan uygulanmaz. Ek dönüşüm gerekçesi olmadan mod olarak açılmaz. Min=max, toplam=0, negatif değer, eksik değer ve logaritmada sıfır durumlarında açık hata/uygunsuzluk politikası gerekir. Keyfî sabit eklemek kabul edilmez.

Her göstergede bütün yöntemler uygun olmayabilir. Uygunluk matrisi hazırlanacak; uygulanamayan mod nedeni ile devre dışı gösterilecek. Ham veri, dönüşüm puanı ve nihai kategori payı ayrı gösterilecek.

## 5. Eşzamanlı vektör hesabı

`O`: başlangıç. `B`: toplam çekim bütçesi (km). `q[i]`: ülke çekim payı. `u[i]`: O'dan başkente en kısa jeodezik yolun başlangıç yönüne ait yerel doğu–kuzey birim vektörü.

`v[i] = B * q[i] * u[i]`

`V = sum_i(v[i])`

Sonuç, O'dan V'nin yönünde ve uzunluğunda jeodezik ilerleyerek hesaplanır. Haritanın piksel mesafeleri hesapta kullanılmaz. Birim vektör toplama, uzun mesafede tüm yol boyunca kuvvet uygulamakla aynı değildir; bu model tanımı korunur.

Sabit jeodezi yöntemi seçilecek: WGS84 elipsoidi tercih edilir; küresel yaklaşım seçilirse farkı ölçülüp belgelenir. Kilometre bütçesinin kabul edilen aralığı tanımlanır; çok uzun yolların sarma/çoklu tur anlamı sessizce kabul edilmez.

Başkent başlangıçla çakışırsa yön belirsizliği; karşıt noktada ise yol/yön belirsizliği açıkça ele alınır. Net vektör sıfırsa sonuç başlangıçtır ve yön atanmaz.

## 6. Veri ve eksik değer politikası

Gözlem alanları: country_id, indicator_id, value, unit, reference_year, source_url, retrieved_at, status, methodology_note. Tahminlerde yöntem ve belirsizlik ayrıca tutulur.

- Ham dosyalar değişmeden korunur; işlenmiş dosyalar betikle yeniden üretilebilir.
- Ülke kapsamı veri toplamadan önce tanımlanır. Egemen devletler, bağımlı bölgeler ve tartışmalı statüler için açık kural kullanılır; çift sayım engellenir.
- ISO kodu olmayan varlıklar için belgeli iç kimlik kullanılır.
- Başkent kaydı; seçilen başkent, enlem, boylam, kaynak ve seçim gerekçesini içerir.
- Ortak referans yılı kapsam raporundan sonra seçilir. Farklı yıl kullanımı görünür tutulur.
- Önce karşılaştırılabilir alternatif kaynak aranır; sonra gerekçeli yakın yıl/tahmin değerlendirilebilir.
- Eksik değerler otomatik sıfırlanmaz, otomatik ortalamayla doldurulmaz.
- Tahmin yapılabiliyorsa belirsizlik sonuç koordinatına taşınır. Yapılamıyorsa ülkenin puanı çözülememiş olarak bildirilir.
- Verisi tam ülkelere indirgeme veya ülke özelinde ağırlıkları yeniden dağıtma tarafsız çözüm diye sunulmaz.

## 7. Harita ve arayüz

Önerilen motor: MapLibre GL JS. İlk sürüm 2D, kuzey yukarı, eğim kapalı bir dünya görünümüdür. Harita sağlayıcısı, lisansı ve atıfları ayrıca seçilir.

Başkentler GeoJSON Point verisinden otomatik oluşturulur; elle piksel yerleştirilmez. Koordinat sırası GeoJSON'da boylam, enlemdir.

Katmanlar: dünya sınırları, başkent noktaları, coğrafi bağlantı çizgileri, çekim göstergeleri, başlangıç ve sonuç.

- Fareyle yakınlaştırma/uzaklaştırma, sürükleme, kontroller ve başlangıca dönme.
- Başkent tıklamasıyla ülke paneli: ham değer, kaynak/yıl, kategori payı, çekim katkısı ve veri durumu.
- Bağlantı çizgisinin uzunluğu coğrafi mesafeyi; okun boyutu/kalınlığı çekim büyüklüğünü gösterir. İkisi karıştırılmaz.
- Etiketler yakınlaştırmaya göre açılır; örtüşen noktalar seçilebilir kalır.
- Tarih değiştirme çizgisi geçişleri, harita sınırı ve dünya kopyaları doğru yönetilir.
- Sonuç paneli koordinat, net yer değiştirme, veri kapsamı, kullanılan ağırlıklar ve bütçeyi içerir.

Önerilen teknoloji: veri hazırlamada Python; arayüz ve hesap motorunda TypeScript/React. Önce statik veriyle tarayıcıda çalışan yapı; backend/veritabanı zorunlu değildir. Next.js veya Vite kararı uygulama başlangıcında verilecek.

## 8. Görev listesi ve ayrı sohbetler

Her satır ayrı görev sohbeti olabilir. Bağımlı görevler önceki çıktılar birleştirildikten sonra başlatılır.

| ID | Görev | Çıktı | Bağımlılık / tamamlanma ölçütü |
| --- | --- | --- | --- |
| T00 | Proje ve ortak doküman düzeni | Git deposu, AGENTS.md, docs/STATUS.md, docs/DECISIONS.md, docs/tasks/ | Plan dosyası yerleştirilmiş; çalışma kuralları açık |
| T01 | Ülke kapsamı ve başkentler | countries.csv, capitals.csv, kapsam kararı | T00; benzersiz kimlikler, kaynaklı koordinatlar, çift sayım yok |
| T02 | Veri sözlüğü ve kaynak araştırması | indicators.csv, sources.md, uygunluk matrisi | T00; her kavram ölçülebilir tanıma sahip |
| T03 | Veri toplama ve arşivleme | data/raw/, toplama betikleri, kaynak manifesti | T01–T02; kaynak, birim ve yıl korunmuş |
| T04 | Veri kalite raporu | coverage.md, quality.md | T03; eksik/yıl/tanım sorunları ülke ve gösterge bazında raporlu |
| T05 | Metodoloji ve ağırlık kararı | methodology.md, model-config.json | T04; örtüşmeler, özel gösterge dönüşümleri, bütçe ve eksik veri politikası açık |
| T06 | İşlenmiş veri hattı | data/processed/, doğrulama betikleri | T05; aynı girdiden aynı çıktı; bilinmeyen değerler korunmuş |
| T07 | Normalizasyon ve puan motoru | hesap modülü ve anlamlı testler | T06; oran koruma, kategori toplamları ve eksik veri davranışı doğrulanmış |
| T08 | Jeodezik vektör motoru | vektör/sonuç modülü | T07; sıra bağımsızlığı, eşit zıt çekim, sıfır sonuç, birim ve uç durum testleri |
| T09 | 2D harita temeli | yakınlaştırılabilir harita ve başkent katmanı | T01; veri sözleşmesi sabitlenince motorla paralel yürüyebilir |
| T10 | Harita ve hesap entegrasyonu | ülke paneli, oklar, sonuç, ayarlar | T08–T09; gösterilen puan ve sonuç aynı modelden geliyor |
| T11 | Duyarlılık ve belirsizlik raporu | sağlamlık sonuçları ve arayüz özeti | T10; ağırlık/bütçe/veri varsayımlarının etkisi görünür |
| T12 | İlk sürüm doğrulama ve kullanım belgesi | README, demo senaryoları, sürüm | T11; gerçek/model/tahmin verileri ayrılmış, uç durumlar kontrol edilmiş |

İlk işe T00 ile başlanır; veri toplama T01 ve T02 kararlarından sonra yapılır. Model kodlamasından önce veri kalitesi incelenir.

## 9. Sohbetler arasında ortak havuz

Sohbet hafızası tek doğruluk kaynağı kabul edilmeyecek. Ortak havuz Git deposundaki dosyalardır.

Önerilen düzen:

- WORLD_CAPITAL_PROJECT_PLAN.md: kabul edilen üst plan.
- AGENTS.md: her görevin okuyacağı çalışma kuralları ve doküman yolları.
- docs/STATUS.md: görev durumları, sıradaki işler, engeller.
- docs/DECISIONS.md: karar, gerekçe, tarih, etkilenen dosyalar.
- docs/methodology.md: matematiksel ve istatistiksel yöntemler.
- docs/data-dictionary.md: veri tanımları ve sözleşmeleri.
- docs/tasks/TXX.md: görev kapsamı, kabul ölçütleri, sonuç/devir notu.
- data/raw/, data/processed/, scripts/, src/: veriler ve uygulama.

Yeni sohbet başlatma talimatı:

> WORLD_CAPITAL_PROJECT_PLAN.md, AGENTS.md, docs/STATUS.md, docs/DECISIONS.md ve ilgili görev dosyasını oku. TXX görevini bağımlılıkları hazırsa tamamla. Kabul edilen metodolojiyi sessizce değiştirme. Çıktıları ve kontrolleri kaydet; görev dosyasına tamamlananları, değişen dosyaları, belirsizlikleri ve sonraki göreve devir notunu yaz.

Başlangıçta görevleri sırayla yürütmek önerilir. Paralel iş gerekirse ayrı dal/worktree ve ayrık dosya sorumluluğu kullanılır; her iş sonrasında farklar incelenip ortak dala birleştirilir. Worktree diğer worktree'nin yeni dosyalarını otomatik almaz; Git üzerinden birleştirme gerekir. Aynı STATUS/DECISIONS dosyasını eşzamanlı düzenlemek yerine görev notları entegrasyon sırasında işlenir.

## 10. İleride eklenecek özellikler

### Faz 2 — Karşılaştırma ve deneyler

- [ ] Göstergeye uygun alternatif normalizasyon modları.
- [ ] Aynı koşullarda yöntemlerin koordinatlarını ve ülke katkılarını yan yana karşılaştırma.
- [ ] Mesafe katsayısı modu: `q'[i] = q[i] * (d[i]/d*)^alpha / sum_j(q[j]*(d[j]/d*)^alpha)`. Ana model alpha=0 durumunda çarpanı açıkça 1 kabul eder; 0^0 hesaplanmaz. Mesafe sıfır uç durumu tanımlanır.
- [ ] Mesafe telafisinin normatif bir tercih olduğunu açıklayan arayüz.
- [ ] Alternatif ağırlık senaryoları ve parametre taraması.
- [ ] Ülke çıkarma/ekleme etkisi; değişen paydalar açıkça gösterilir.
- [ ] Senaryo kaydetme/dışa aktarma: veri sürümü, ülke kapsamı, ağırlıklar, dönüşümler, bütçe, jeodezi yöntemi ve sonuç.

### Faz 3 — Harita ve yer seçimi modelleri

- [ ] Farklı başlangıç noktaları ve başlangıç duyarlılığı.
- [ ] Küre/alternatif projeksiyon görünümleri; sadece görünüm değişirse hesap sonucu aynı kalır.
- [ ] İteratif çekim ve denge modu; yakınsama şartları ve model anlamı ayrı belgelenir.
- [ ] Ağırlıklı jeodezik toplam mesafeyi en aza indiren model; ayrı amaç fonksiyonu olarak sunulur.
- [ ] Karayla sınırlı çözüm ve mevcut şehir adayları.
- [ ] Yerel su, afet, iklim, altyapı ve genişleme verileriyle aday uygunluğu.
- [ ] Tarihsel veri karşılaştırması; sabit tanım/kapsam ve fiyat bazlarıyla.

Alternatif modlar tek doğru sonucu kanıtlamak için değil, model tercihlerinin etkisini incelemek için kullanılacak.

## 11. İlk sürüm kabul ölçütleri

- [ ] Kaynakları ve veri sürümüyle tekrar üretilebilir sonuç.
- [ ] Gerçek, tahmin ve eksik değer ayrımı.
- [ ] Sabit kategori bütçeleri ve açık ağırlıklar.
- [ ] Eşzamanlı, sıralamadan bağımsız vektör toplamı.
- [ ] Mesafe çarpanı 1 olan ana model.
- [ ] Harita görünümü/zoom değişince sonuç değişmiyor.
- [ ] Matematiksel uç durumlar kontrollü; sahte kesinlik yok.
- [ ] Başkentler veri dosyasından geliyor; ülke paneli kaynak/yılı gösteriyor.
- [ ] Belirsizlik ve model varsayımları sonuçla birlikte erişilebilir.

## 12. Referanslar

- OECD/EC-JRC, Handbook on Constructing Composite Indicators: https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators-methodology-and-user-guide_9789264043466-en.html
- Dünya Bankası Indicators API: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation
- MapLibre Map API: https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/
- ChatGPT Projects: https://help.openai.com/en/articles/10169521-projects-in-chatgpt
- Worktree rehberi: https://learn.chatgpt.com/docs/environments/git-worktrees

Bu belge veri kaynaklarının bulunmuş veya doğrulanmış olduğunu iddia etmez; kaynak araştırması T02/T03 görevleridir.
