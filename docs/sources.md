# T02 kaynak araştırması

Araştırma tarihi: 2026-10-03. Bu katalog veri indirme veya 195 ülkenin kapsandığını doğrulama anlamına gelmez. `data/indicators.csv` aday tanımlarıdır; nihai gösterge ve dönüşüm seçimi T04–T05'e aittir. T01 kapsamı 195 ülkedir; T03 eşleme ve ülke/yıl boşluklarını ölçmelidir.

| ID | Birincil kaynak ve erişim | Ölçüm / dikkat |
| --- | --- | --- |
| WB_WDI | [World Bank Indicators API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation); [nüfus](https://data.worldbank.org/indicator/SP.POP.TOTL), [GSYH](https://data.worldbank.org/indicator/NY.GDP.MKTP.CD), [imalat katma değeri](https://data.worldbank.org/indicator/NV.IND.MANF.CD) | WDI ülke ve yıl bazlı seri verir. GSYH ve imalat cari ABD doları karşılaştırmasında kur ve fiyat etkisi vardır. İmalat GSYH'nın parçasıdır. API'deki toplulaştırılmış bölgeler ülke sayılmamalı. |
| FAOSTAT | [Tarımsal üretim değeri kataloğu](https://data.fao.org/catalog/dataset/b1a04191-c86f-4972-a9d7-28b23568deba) | Ürünleri ton olarak toplamak yerine çiftlik çıkış fiyatlarıyla değerlenmiş bitkisel ve hayvansal üretim. Sabit fiyat serisinin baz yılı, alan/öğe kodu ve sürümü arşivlenmeli. Brüt değer, katma değer değildir. |
| UNDP_HDR | [HDI veri ve teknik belgeler](https://hdr.undp.org/data-center/documentation-and-downloads) | Sağlık, eğitim ve gelir boyutlarından kurulu bileşik endeks. 0–1 ölçekli HDI'nin ülkeler arası oranı doğrudan yaşam kalitesi oranı değildir. Sürüm ve hesap değişiklikleri izlenmeli. |
| SIPRI_MILEX | [Askerî harcama veritabanı](https://www.sipri.org/databases/milex); [kaynak ve yöntem](https://www.sipri.org/databases/milex/sources-and-methods) | Sabit ABD doları sürüm baz yılıyla kaydedilmeli. SIPRI bunu askeri faaliyetin girdisi olarak tanımlar; askerî kabiliyet çıktısı değildir. Ülke boşlukları ve tahmin işaretleri korunmalı. |
| UNCTADSTAT | [UNCTADstat veri merkezi](https://unctadstat.unctad.org/datacentre/) | Mal ihracatı değeri erişim için yalnız vekildir. Yeniden ihracat, transit ve hizmet ticareti dışlaması yorum sınırlarıdır. T03 kesin veri kümesi/seri kodunu doğrulamalı. |
| UN_SDG | [BM SDG 13.1.1 meta verisi](https://unstats.un.org/sdgs/metadata/files/Metadata-13-01-01.pdf); [SDG veri portalı](https://unstats.un.org/sdgs/dataportal) | Afet kaynaklı ölüm ve kayıp kişi oranı, dayanıklılığın ters yönlü ve yıllar arasında oynak bir vekilidir. Yıllık sıfır, risksizlik kanıtı değildir. Kapsam ve uygun dönüşüm karara bağlanmadan puana girmez. |

## T03'e veri edinim sözleşmesi

- Her indirmede özgün dosya/API yanıtı `data/raw/` altında değişmeden tutulmalı; sorgu URL'si, erişim tarihi, sürüm, lisans ve dosya özeti manifestte kaydedilmeli.
- Her gözlem için T01 `country_id` eşlemesi, `indicator_id`, değer, birim, referans yılı, kaynak URL'si, erişim zamanı, durum ve yöntem notu saklanmalı. Kaynak ülke kodu da denetim için korunmalı.
- Boş, bastırılmış, uygulanamaz ve tahmini değerler ayrılmalı; hiçbiri otomatik sıfır yapılmamalı. 195 ülke × gösterge bazında kapsam raporu T04'te üretilecek.
- Ortak yıl, birden fazla göstergenin kategori içi ağırlığı, endeks/ters yönlü dönüşüm ve nihai gösterge seçimi henüz karar değildir.
