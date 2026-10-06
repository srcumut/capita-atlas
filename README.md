# Capita Atlas

195 ülkenin başkentleri ve sekiz göstergeyle üretilen deneysel dünya başkent modelini haritada inceleyen uygulama. Arayüz Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui ve MapLibre ile geliştirilir. Hesaplama Python API üzerinden yapılır.

## Klasörler

| Yol | Görev |
| --- | --- |
| `apps/web/src/app/` | Next.js sayfası, yerleşim ve tema |
| `apps/web/src/components/` | Harita ve shadcn/ui bileşenleri |
| `apps/web/src/lib/` | Arayüz veri sözleşmesi ve biçimleme |
| `apps/web/public/capitals.geojson` | Yeniden üretilebilir 195 başkent harita verisi |
| `scripts/serve-t10.py` | Hesaplama API'si |
| `src/` | Python puanlama ve vektör motoru |
| `data/` | Ham ve işlenmiş gözlemler |
| `docs/` | Yöntem, karar ve görev kayıtları |
| `legacy/static-web/` | Önceki statik arayüzün arşivi |

## Yerelde çalıştırma

İki terminal açın. İlkinde depo kökünden API'yi başlatın. Bu bilgisayarda `python` PATH'te yoksa Codex'in paketli Python yürütücüsünü kullanın:

```powershell
$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python) { $python = "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" }
& $python scripts/build-all-data.py
& $python scripts/build-t09.py
& $python scripts/serve-t10.py
```

İkinci terminalde Next.js uygulamasını başlatın:

```powershell
cd apps/web
npm ci
npm run dev
```

Arayüz: `http://localhost:3000`. Varsayılan Next.js API yönlendirmesi `http://127.0.0.1:8000` adresindeki Python servisini kullanır. Farklı port için Python tarafında `CAPITA_PORT`, Next.js tarafında `CAPITA_API_ORIGIN` ortam değişkenlerini ayarlayın. Harita karoları OpenStreetMap üzerinden çevrimiçi yüklenir; kaynak atfı haritada görünür.

## Model ve veriler

Varsayılan **sekiz kategori** modu her ülke ve gösterge için eldeki en son sayısal kaydı kullanır. 1.560 ülke–gösterge kaydının 1.431'i sayısal, 129'u eksiktir. Eksik değer `null` kalır; ilgili ülke o kategoriden katkı yapmaz, diğer kategori ağırlıkları ülke özelinde artırılmaz. Farklı yıllar, kaynaklar ve durumlar ülke panelinde görünür. Sonuç deneysel model çıktısıdır.

Normalizasyon seçenekleri ham büyüklük payı, logaritmik, min–max, yüzdelik sıra ve maksimuma bölmedir. HDI için min–max, afet ölüm oranı için ters sıra sabittir. Kilometre bütçesi 0–10.000 aralığındadır. Haritadaki mavi nokta (0°, 0°) orijin, turuncu nokta sonuçtur; sonuç üzerine gelince WGS84 uzaklığı gösterilir.

Önceki 2025 iki kategori gözlem modu 15 eksik kayıt nedeniyle koordinat üretmez. Ayrı varsayımlı keşif modu eski yıl verileri ve açık varsayım içerir. Yöntem ayrıntıları [sekiz kategori metodolojisinde](docs/all-data-methodology.md), veri araştırması [veri boşluğu kaydında](docs/data-gap-research.md) bulunur.

## Kontroller

```powershell
python scripts/build-all-data.py --check
python scripts/check-all-data.py
python scripts/check-t07.py
python scripts/check-t08.py
cd apps/web
npm run lint
npm run build
```

`GET /api/snapshot`, `POST /api/calculate` ve `GET /api/sensitivity` Python API'sinde kalır. Next.js bunları aynı kök yoluyla iletir. `scripts/build-t09.py` harita verisini `apps/web/public/capitals.geojson` dosyasına deterministik üretir.
