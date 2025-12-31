
---
Elindeki Observability (Log, Metric, Trace) araçlarını hangi sırayla ve nasıl kullanarak sorunu 5 dakika içinde teşhis edersin?

##  0–30. saniye: **Metric → “Sistem gerçekten bozuk mu?”**

**Neye bakarım**

* **Error rate (5xx)**
* **Latency (p95 / p99)**
* **Traffic (RPS)**
* **CPU / Memory / Disk / Network**

**Amaç**

* Problem **gerçek mi**, yoksa tekil bir kullanıcı mı?
* **Ne zaman başladı?** (deploy sonrası mı?)

**Araç**

* Prometheus + Grafana
* Datadog / New Relic (varsa)

 Eğer metriklerde anormallik yoksa → büyük ihtimalle **kod hatası değil**, konfig / edge-case / client sorunu.

---

##  30. saniye – 2. dakika: **Log → “Nerede patlıyor?”**

**Metrik sana *neresi* der, log *neden* der.**

**Neye bakarım**

* Error logları (WARN / ERROR)
* Stack trace
* Timeout / DB / External service hataları
* **Correlation ID / Request ID**

**Nasıl**

* Zaman filtresi: “problem başladıktan sonrası”
* Servis / pod / container bazlı
* Aynı hatadan kaç tane var?

**Araç**

* ELK (Kibana)
* Loki
* Cloud logları

 Burada genelde şunu görürsün:

* `DB connection timeout`
* `NullPointerException`
* `External API 429`
* `OutOfMemory`

---

##  2–4. dakika: **Trace → “Hangi adım yavaş / kırık?”**

**Log + metric yetmediyse trace’e geçilir.**

**Neye bakarım**

* En yavaş span
* Hangi servis çağrısı patlıyor
* Fan-out mu var?
* Retry loop var mı?

**Sorular**

* Gecikme **bizde mi**, yoksa **downstream**’de mi?
* Tek servis mi, zincirleme mi?

**Araç**

* Jaeger
* Zipkin
* Tempo
* OpenTelemetry

👉 Trace genelde şunu söyler:

> “Sorun bizde değil, **X servisi** 4 saniyede cevaplıyor.”

---

##  4–5. dakika: **Hipotez kur & aksiyon al**

Artık elinde şu var:

* **Belirti** → Metric
* **Hata** → Log
* **Kök sebep** → Trace

**Örnek aksiyonlar**

* Rollback
* Feature flag kapat
* Pod scale et
* Timeout düşür
* Cache aç

---

##  Altın Kural (çok kritik)

> **Metric seni uyarır**
> **Log seni bilgilendirir**
> **Trace seni ikna eder**

Ve sıralama **ASLA** değişmez:

###  **Metric → Log → Trace**

Trace ile başlanmaz. Log’a bakmadan trace’e dalınmaz.

---

 Önce metriklerle problemin gerçek ve sistemik olup olmadığını doğrularım, sonra loglardan hatanın nerede olduğunu görürüm, yetmezse trace ile hangi servis ve adımda patladığını tespit ederim.

---