# Çalışma kuralları

- Her görevden önce `WORLD_CAPITAL_PROJECT_PLAN.md`, `docs/STATUS.md`, `docs/DECISIONS.md` ve ilgili `docs/tasks/TXX.md` dosyasını oku.
- Kabul edilen ana modeli ve veri politikasını sessizce değiştirme. Yeni veya değişen metodoloji kararını gerekçesi ve tarihiyle `docs/DECISIONS.md` içinde kaydet; henüz karara bağlanmamış konuları karar gibi uygulama.
- Görev bağımlılıklarını `docs/STATUS.md` üzerinden denetle. Bağımlılıklar hazır değilse engeli görev dosyasına yaz; sonraki görevin çıktısını varsayma.
- Her görev sonunda çıktı ve anlamlı kontrolleri kaydet. Görev dosyasında tamamlanan işleri, değişen dosyaları, belirsizlikleri ve sonraki göreve devir notunu güncelle; `docs/STATUS.md` durumunu eşleştir.
- Ham veriyi değiştirmeden sakla; işlenmiş veriyi yeniden üretilebilir biçimde oluştur. Eksik değerleri sıfır sayma veya kendiliğinden doldurma. Kaynak, birim, yıl ve kapsam bilgisini koru.
- Paralel çalışma gerekiyorsa ayrı dal/worktree ve ayrık dosya sorumluluğu kullan. Ortak durum/karar belgelerini entegrasyon sırasında güncelle.

Belge rolleri: üst plan `WORLD_CAPITAL_PROJECT_PLAN.md`; görev izleme `docs/STATUS.md`; karar günlüğü `docs/DECISIONS.md`; görev kayıtları `docs/tasks/`; yöntem ayrıntıları ileride `docs/methodology.md`; veri sözleşmeleri ileride `docs/data-dictionary.md`.
