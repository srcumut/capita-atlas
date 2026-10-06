# T02 dönüşüm uygunluk matrisi

Bu matris kavramsal ön elemedir; T05'te dağılım, sıfır ve kapsam verileriyle kesinleştirilir. `Koşullu` etkin mod demek değildir. Her yöntemin ara puanı kategori bütçesine yeniden bölünür. Maksimuma bölme, pozitif toplamlı veri için doğrudan payla eşdeğerdir.

| Gösterge | Kategori payı | Maksimuma bölme | Min–max | Log | Sıra/yüzdelik | Neden / gerekli karar |
| --- | --- | --- | --- | --- | --- | --- |
| population_total | Uygun | Eşdeğer | Deneysel | Koşullu | Deneysel | Anlamlı sıfır ve toplam var; log sıfır kuralı gerekli. |
| gdp_current_usd | Uygun | Eşdeğer | Deneysel | Koşullu | Deneysel | Cari dolar ve yıl karşılaştırılabilirliği ayrıca incelenmeli. |
| manufacturing_va_usd | Koşullu | Eşdeğer | Deneysel | Koşullu | Deneysel | Negatif katma değer ve eksik ülke olasılığı veriyle kontrol edilmeli. |
| agricultural_gpv | Koşullu | Eşdeğer | Deneysel | Koşullu | Deneysel | Seçilen FAO toplamı ve gerçek sıfır doğrulanmalı. |
| hdi | Uygun değil | Uygun değil | Koşullu | Uygun değil | Koşullu | Endeks oranı kapasite oranı değildir; T05 normatif dönüşüm kararı gerekli. |
| military_expenditure | Koşullu | Eşdeğer | Deneysel | Koşullu | Deneysel | Girdi vekili; gizli/eksik veri ve sıfır olasılığı. |
| merchandise_exports | Koşullu | Eşdeğer | Deneysel | Koşullu | Deneysel | Yeniden ihracat ve çok düşük/sıfır değerler incelenmeli. |
| disaster_mortality_rate | Uygun değil | Uygun değil | Koşullu | Uygun değil | Koşullu | Düşük değer iyi; ters çevirme ve çok sayıdaki sıfır için karar yok. |

Tüm satırlarda min=max veya ara puan toplamı sıfırsa yöntem devre dışı kalır. Negatif değer kategori payına girmez. Log için birim ve sıfır politikası gerekçeli belirlenmeden hesap yapılmaz. Eksik değerler hiçbir yöntemde kendiliğinden doldurulmaz.
