# Veri boşluğu araştırması — 2026-10-03

Evren 195 ülke. Arşivde 2025 nüfus 194/195, GSYH 181/195 sayısal. Toplam 15 boş ülke–gösterge kaydı 14 ülkeye dağılır. Ham WDI arşivi değiştirilmedi.

## Bu turda doğrulanan ek kaynaklar

| Ülke/gösterge | Değer | Gerçek yıl | Durum | Kaynak ve sınır |
| --- | ---: | ---: | --- | --- |
| BAE GSYH | 569,1 milyar cari USD | 2025 | IMF tahmini | [IMF ülke raporu, Tablo 2](https://www.imf.org/-/media/files/publications/cr/2025/english/1areea2025001-source-pdf.pdf), tahmin gözlem değildir. |
| Bahamalar GSYH | 16,396 milyar cari USD | 2025 | IMF tahmini | [IMF ülke raporu, Tablo 3](https://www.imf.org/-/media/files/publications/cr/2026/english/1bhsea2026001-source-pdf.pdf), 2025 tahminidir. |
| Kuzey Kore GSYH | 16,447 milyar cari USD | 2023 | BM tahmini | [World Statistics Pocketbook 2025](https://unstats.un.org/UNSDWebsite/publications/pocketbook/world-stats-pocketbook-2025.pdf), 2023 tahmini; 2025 değeri değildir. |
| Vatikan nüfusu | 882 sakin | 2024 sonu | Resmî kayıt | [Vatikan nüfus sayfası](https://www.vaticanstate.va/en/state-and-government/general-informations/population.html); önceki 458 yalnız duvar içindeki yurttaşlardı ve eksik kapsamlıydı. |

Sayısal girdiler `data/supplemental-observations.csv` içinde kaynak, birim, yıl ve durumla tutulur. Keşif modu bu dört kaydı, arşivden 10 eski yıl GSYH değerini ve Vatikan GSYH için açık 1 milyar USD varsayımını kullanır. `data/processed/selected-observations.*` içinde boşlar korunur.

## Sıradaki kaynak işi

Kalan 10 GSYH boşluğu için en yakın yıllar arşivde var; Eritre 2011, Güney Sudan 2015, Yemen 2018 ve Küba 2020 gibi eski yılları 2025 büyüklüğü saymak özellikle sakıncalıdır. [IMF WEO](https://data.imf.org/Datasets/WEO) cari USD GSYH serisi ve [BM Ulusal Hesaplar](https://unstats.un.org/unsd/snaama/downloads) ülke/yıl bazında taranmalı; IMF üyeliği ve serideki boşluklar ülke bazında denetlenmelidir. Vatikan GSYH için karşılaştırılabilir ulusal hesap bulunmadıkça varsayım gerçek veriye yükseltilmez. Kuzey Kore'nin [Kore Merkez Bankası 2025 GNI tahmini](https://www.bok.or.kr/portal/bbs/P0002240/view.do?menuNo=200092&nttId=10085022) GSYH ile aynı kavram değildir ve doğrudan ikame edilmez.

Diğer aday göstergelerin arşivdeki son yıl kapsamı: imalat 130/195 (2025), tarım 133/195 (2024), HDI 192/195 (2023), askerî harcama 149/195 (2025), mal ihracatı 191/195 (2025), afet ölüm oranı 7/195 (2025). Bunları birden çekime eklemek tam kapsam sorununu büyütür. Önce kaynak/yıl ve kavram uygunluğu ülke bazında çözülecek; HDI ve afet oranı doğrudan toplam kapasite payı olarak normalleştirilmeyecek.
