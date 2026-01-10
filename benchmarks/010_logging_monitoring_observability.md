
---

## Logging, Monitoring & Observability

Bugün Logging konusundan başlayacağız.

Nedir bu logging: Sistemde gerçekleşen belirli olayları (event), error’ları ve önemli yerleri yakalamaya yardım eder. Bir hata oluştuğunda baktığımız ilk yerdir.

-> console.log basit loglama fonksiyonudur ama büyük uygulamalarda daha kapsamlı logging yapmamız gerekir.
-> Profesyonel bir sistemde loglar kategorize edilir:

* **INFO:** Uygulama hakkında genel bilgilendirme için kullanırız. Örneğin: Sistem çalışıyor, kullanıcı giriş yaptı.
* **WARN:** Kritik olmayan problemler için kullanırız. Örneğin: Bellek biraz yükseldi, dikkat.
* **ERROR:** Hemen bakmamız gereken kritik sorunlar için kullanırız. Örneğin: Database ve server’ın bağlanamaması gibi.
* **DEBUG:** Geliştirme aşamasında kullanılan çok detaylı veriler için kullanırız. Örneğin: Variable values.

Şimdi logging yaparken en çok kullandığımız bir kütüphaneden bahsedeceğim.

**Winston:** Birden fazla log seviyesini, süresini ve structured logging’i tutar.

Nedir bu structured logging: Logları sadece düz metin olarak değil, JSON formatında tutmalıyız. Neden? Çünkü JSON logları makineler tarafından (örn. ELK Stack) kolayca taranabilir ve filtrelenebilir.

```js
const winston = require("winston");

// Configure logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "app.log" })
  ]
});

// Logging examples
logger.info("Server started on port 3000");
logger.error("Database connection failed");
```

-> ELK Stack’te loglama için kullanıyoruz.

Neden Logging yapıyoruz?

1. **Hata Ayıklama (Debugging)** – “Nerede patladı?”
   Geliştirme yaparken console.log kullanırsın ama canlı sistemde bunu yapamazsın. Bir kullanıcı “Ödeme yapamadım” dediğinde, hatanın veritabanından mı, banka API’sinden mi yoksa senin kodundaki bir mantık hatasından mı kaynaklandığını loglara bakarak şak diye anlarsın.
   Örnek log:
   `[ERROR] 2023-10-27 14:00:01 - User:501 - Payment failed: Insufficient balance.`
   Bu log sayesinde hatanın bankadan değil, kullanıcının bakiyesinden olduğunu anında görürsün.

2. **Güvenlik ve Denetim (Audit)** – “Kim, ne zaman yaptı?”
   Sistemine bir siber saldırı yapıldığında veya bir admin yanlışlıkla kritik bir veriyi sildiğinde “kimin” bunu yaptığını bilmen gerekir.
   Audit logları: “Kullanıcı X, saat 10:00’da şu IP adresinden bağlandı ve şu tabloyu sildi.”
   Bu kayıtlar yasal zorunluluk (KVKK/GDPR gibi) nedeniyle de tutulmak zorundadır.

3. **Kim, ne zaman, hangi endpoint’i çağırdı görmek** – “Kullanıcı ne yapıyor?”
   Sadece hataları değil, kullanıcı alışkanlıklarını da loglarız.
   “Kullanıcılar en çok hangi saatlerde alışveriş yapıyor?”
   “Hangi sayfalarda daha çok vakit geçiriyorlar?”
   Bu veriler, ürünün geleceğine dair kararlar alınırken altın değerindedir.

4. **Performans takibi** – Prod’da yaşanan sorunları geçmişten analiz etmek
   “Neden yavaşladı?”
   Bazen sistem hata vermez ama çok yavaş çalışır. Loglara “işlem süresi” (execution time) ekleyerek darboğazları bulabilirsin.
   Örnek log:
   `[INFO] /get-all-products request completed in 4500ms.`
   Bu log sana der ki: “Bu sorgu 4.5 saniye sürüyor, acilen bir index atman veya cache kurman lazım!”

* Logging sadece hata bulmak için değildir; sistemin izlenebilirliğini (observability) sağlar.
* Structured logging (JSON formatı) kullanarak bu verileri merkezi bir yerde (ELK Stack gibi) toplarız.
* Servislerde önemli business olaylarını loglarız.
* Error handler’da error’ları loglarız.
* Eğer hata loglarsak, hatanın hangi dosyada, hangi satırda olduğunu (stack trace) ve hangi kullanıcının yaptığını da içine gömebiliriz.

????? Peki sunucuya “kapan” emri geldiğinde (örneğin güncellerken) içerideki loglar ve işlemler yarım kalırsa ne olur?
Buna **Graceful Shutdown** diyoruz.

Kapatma düğmesine basıldığında sunucu:

* SIGTERM (kapatma sinyali) geldiğinde yeni istek (request) kabul etmeyi durdurur.
* Mevcut (içerideki) isteklerin bitmesi için bir süre tanır (örneğin 10–30 saniye).
* Veritabanı bağlantılarını, Redis’i ve log sistemini (Winston) güvenle kapatır.
* En son süreci (process) sonlandırır.

??? Konteyner (Docker/Kubernetes) tabanlı bir sistemde graceful shutdown yapmazsak ne olur?
Kullanıcı deneyimi bozulur ve veri tutarsızlığı riski doğar.

---

Bir diğer konumuz **Monitoring (İzleme)**

Nedir bu monitoring: CPU kullanımı, bellek ve yanıt süreleri gibi uygulama performans ölçütlerini izleyerek uygulamanın kararlı çalışmasını sağlar.

### Monitoring’te Bilmemiz Gereken Kavramlar

**Metrics (Metrikler):**
Sayısal verilerdir.
“Saniyede kaç istek geliyor? (RPS)”,
“CPU kullanımı % kaç?”,
“RAM ne kadar?”

**Health Checks (Sağlık Kontrolleri):**
Sunucunun hayatta olup olmadığını anlamak için `/health` veya `/ready` gibi gizli endpoint’ler açarız.

**Alerting (Alarm):**
Eğer hata oranı %5’i geçerse veya CPU %90’ın üzerine çıkarsa bana SMS/Slack mesajı at.

---

### Neden Health Check Kontrol Ederiz?

Sadece sunucunun açık olması yetmez.
Veritabanı bağlantısı aktif mi?
Redis’e ulaşılabiliyor mu?
Disk alanı dolu mu?

Bunları kontrol edip öyle **200** dönmek gerekir.
Eğer veritabanı çökmüşse, sunucu açık olsa bile **sağlıklı değildir** ve trafik almamalıdır.

---

### CPU Usage (Kullanım)

İşlemcinin ne kadar yoğun çalıştığıdır.
Eğer sürekli %80–90 üzerindeyse, kodunda sonsuz döngüler, ağır matematiksel işlemler veya çok yoğun bir trafik olabilir.

-> Docker veya Kubernetes kullanıyorsan, sisteme bir limit koyarsın.
Eğer uygulama o limiti aşmaya çalışırsa sistem onu yavaşlatır.
Bu, uygulamanın aniden aşırı yavaşlamasına (**latency**) neden olur.

---

### RAM

-> **Heap Usage:** Node.js’in objeleri sakladığı alan.
Eğer bu alan sürekli artıyor ve hiç düşmüyorsa **Memory Leak** (hafıza sızıntısı) vardır.

-> **RSS (Resident Set Size):**
Uygulamanın toplamda kapladığı gerçek fiziksel alan.

-> **Garbage Collection (GC) Süresi:**
Node.js’in çöpleri temizlemek için harcadığı süre.
Eğer RAM dolarsa, Node.js sürekli temizlik yapmaya çalışır ve bu da sistemi dondurur.

---

### Monitoring’i Hangi Araçlarla Yaparız?

Bunlar **Prometheus** ve **Grafana**’dır.

Bu ikiliyi bir hastane senaryosu ile düşünelim:

* Bizim API’miz: **Hasta**
* Prometheus: **Hemşire**
  Her 15 saniyede bir hastanın yanına gider, ateşini ve tansiyonunu ölçer, defterine kaydeder (veritabanıdır).
* Grafana: **Doktorun odasındaki ekran**
  Hemşirenin defterindeki sayıları alır ve anlamlı grafiklere dönüştürür.

Prometheus’un verileri kaydedebilmesi için **scraping** için bir kapı açmak gerekir.

```js
const client = require('prom-client');

// Varsayılan metrikleri topla (CPU, RAM, Heap size vb. otomatik gelir)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Toplam sipariş sayısı
const orderCounter = new client.Counter({
  name: 'total_orders',
  help: 'Sistemdeki toplam başarılı sipariş sayısı'
});

module.exports = { client, orderCounter };
```

Prometheus’u kurduktan sonra Grafana’yı açarsın ve **Data Source** olarak Prometheus’u seçersin.
Karşına şu tarz grafikler çıkar:

* **Request Duration (P99):**
  İsteklerin %99’u ne kadar sürede bitiyor? (En yavaş istekleri görmek için çok kritiktir.)
* **Error Rate:**
  500 hatalarının toplam trafiğe oranı.
* **Memory Usage:**
  RAM sızıntısı var mı, yok mu?

---

### Uygulamanın CPU Kullanımı Aniden Fırladı Ama Trafik Artmadı. Ne Yaparız?

Önce Grafana üzerinden metrikleri kontrol ederiz.

* Eğer CPU ile birlikte **Garbage Collection** süreleri de artmışsa, muhtemelen bir **Memory Leak** vardır ve sistem RAM’i boşaltmaya çalışırken CPU’yu tüketiyordur.
* Eğer RAM normalse, bir fonksiyonun (örneğin ağır bir JSON parse işlemi veya büyük bir döngü) bloklandığını düşünür ve **Tracing (Jaeger)** kullanarak hangi fonksiyonun işlemciyi yorduğunu buluruz.

---

### Monitoring Teknikleri

| Metrik     | Anlam           |
| ---------- | --------------- |
| Latency    | Response süresi |
| Traffic    | İstek sayısı    |
| Errors     | Hata oranı      |
| Saturation | Kaynak doluluğu |

* CPU ve RAM’i → Prometheus ve Grafana ile bakarız.

---

### 1. Response Time (Yanıt Süresi)

Sadece “ortalama yanıt süresi”ne bakmak büyük bir hatadır.
Mülakatlarda **Percentiles (Yüzdelik Dilimler)** terimini kullanman seni öne çıkarır.

* **P50 (Median):** İsteklerin yarısı bu süreden daha hızlıdır.
* **P95 ve P99:** En yavaş %5 ve %1’lik dilim.

Neyi ölçeriz?
Eğer P50 düşük ama P99 çok yüksekse, sistem genel olarak hızlıdır ama bazı kullanıcılar çok kötü bir deneyim yaşıyordur.

---

### 2. Error Rate (Hata Oranı)

Her 500 hatası “felaket” değildir; ancak bunların toplam trafiğe oranı kritiktir.

* **Success Rate:**
  (Başarılı İstekler / Toplam İstekler) * 100

Neyi ölçeriz?
Hata oranında ani bir sıçrama (spike) varsa, yeni attığın bir kodda (deployment) bug olabilir veya bir bağımlılığın (örneğin ödeme API’si) çökmüş olabilir.

**Alarm eşiği örneği:**
“Hata oranı 1 dakika boyunca %5’in üzerine çıkarsa Slack’ten uyarı gönder.”

### 3. DB Yavaşladı mı? (Database Health)

Veritabanı darboğazı (bottleneck) tüm sistemi kilitler. Grafana’da şunları izleriz:

* **Active Connections:**
  Veritabanına bağlı kaç kişi var? Limit dolmak üzere mi?
* **Slow Queries:**
  Belirli bir süreden (örn. 1 saniye) uzun süren sorguların sayısı.

Neyi ölçeriz?
Eğer response time artıyor ama CPU düşükse, sorun muhtemelen DB’deki bir kilitlenme (lock) veya eksik bir index’tir.

---

### 4. Redis Down mı? (Cache Monitoring)

Redis, sistemin “hızlandırıcısıdır”. O giderse sistem durmasa bile DB çöker.

* **Redis Hit/Miss Rate:**
  İsteklerin ne kadarı Redis’ten dönüyor (hit), ne kadarı DB’ye gidiyor (miss)?
* **Düşük Hit Rate:**
  Cache stratejin yanlış demektir.
* **Uptime & Memory Usage:**
  Redis’in RAM’i biterse yeni veri yazamaz (eviction politikasına göre veri siler).

Neyi ölçeriz?
Redis çökerse (down), trafik aniden DB’ye biner. Bu duruma **Cache Cold Start** problemi denir.
DB’nin bu yükü kaldırıp kaldıramayacağını bilmen gerekir.

---

## Observability

Sistemin dışarıdan görünen çıktılarına (metrikler, loglar ve izler) bakarak içeride neler olduğunu ve **neden** olduğunu anlama yeteneğidir.

* Monitoring: “Sistem çalışıyor mu?”
* Observability: “Sistem neden böyle davranıyor?”

---

### 1. Metrics (Metrikler) – “Sayısal Göstergeler”

Metrikler, belirli bir zaman dilimi içindeki sayısal verilerdir.
Depolaması ucuzdur ve sistemin genel sağlığı hakkında hızlıca fikir verir.

Neyi ölçer?

* CPU kullanımı
* RAM miktarı
* Saniyedeki istek sayısı (RPS)
* Hata oranları

**Kritik Kavram (Aggregation):**
Metrikler toplanır.
Örneğin: “Son 1 dakikadaki ortalama yanıt süresi” bir metriktir.

Metrikler bize bir sorun olduğunu söyler ama sorunun **nerede** olduğunu tam olarak söylemez.

---

### 2. Logging (Loglar) – “Olay Kayıtları”

Sistemde gerçekleşen her önemli olayın metin tabanlı kaydıdır.

Neyi ölçer?

* “Kullanıcı 501 login oldu”
* “Veritabanı bağlantısı koptu”
* “Dosya bulunamadı”

**Structured Logging (JSON):**
Loglar makine tarafından okunabilir (searchable) olmalıdır.

Loglar bize **ne olduğunu** detaylarıyla söyler.
Bir metrikte hata artışı gördüğümüzde, sebebini bulmak için o zaman dilimindeki loglara bakarız.

---

### 3. Tracing (İzleme / Takip) – “İsteğin Yolculuğu”

Mikroservis mimarisinin en kritik parçasıdır.

Bir isteğin (request) sisteme girdikten sonra:

* Hangi servislerden geçtiğini,
* Hangi veritabanı sorgularını tetiklediğini,
* Her aşamada ne kadar vakit harcadığını

gösterir.

* **Trace ID:**
  İstek sisteme girdiği an ona bir Trace ID atanır. Bu ID tüm servisler boyunca taşınır.
* **Spans:**
  İsteğin içindeki alt işlemler.
  Örn: “Auth servisine gitmek 20ms”, “DB sorgusu 150ms”.

Tracing bize sorunun **nerede takıldığını** söyler.
Özellikle mikroservisler arası gecikmeleri bulmak için tek yoldur.

---

### Standart Araçlar

| Sütun           | Standart Araçlar                                  |
| --------------- | ------------------------------------------------- |
| Metrikler       | Prometheus, Grafana, VictoriaMetrics              |
| Loglar          | ELK Stack (Elasticsearch, Logstash, Kibana), Loki |
| Tracing         | Jaeger, Zipkin, Tempo                             |
| Hepsi Bir Arada | OpenTelemetry (yeni standart), Datadog, New Relic |

---

### Kavram Karşılaştırması

| Kavram     | Odak Noktası     | Sorduğu Soru          | Örnek                       |
| ---------- | ---------------- | --------------------- | --------------------------- |
| Logging    | Olaylar (Events) | Ne oldu?              | User 5: Password incorrect  |
| Monitoring | Durum (State)    | Sistem ayakta mı?     | CPU: %45, 200 OK: 150 req/s |
| Tracing    | Akış (Flow)      | İstek nerede takıldı? | Payment API took 2.4s       |

---

### Bir Request’in Yolculuğu

Client
→ API
→ Auth
→ Service
→ DB

Bunu tek bir **Trace ID** ile izlersin.

---

## Real-World Use Case: Logging and Monitoring in E-commerce

Consider an e-commerce platform where logging and monitoring are critical for maintaining high performance and reliability.

1. **Log All Transactions:**
   Capture order and payment events with structured logs, including metadata like `order_id` and `user_id`.

2. **Error Tracking:**
   Use Winston to log errors such as payment failures, along with stack traces and metadata for faster debugging.

3. **Monitor Server Health:**
   Set up Prometheus to monitor response times and request counts, visualized in Grafana for real-time insights.

4. **Set Alerts:**
   Configure alerts based on metrics. For instance, if the request duration exceeds a threshold, send an alert to the admin.

---

## Prod’da Nasıl Hata Yakarız?

* **Global Error Handler:**
  Express’te mutlaka en altta tüm hataları yakalayan bir middleware olsun.
  Bu middleware hatayı hem loglamalı hem de Sentry gibi bir araca yollamalıdır.

* **Health Checks:**
  Sunucunun sadece “açık” olması yetmez.
  `/health` endpoint’i üzerinden DB bağlantısını sürekli kontrol etmelisin.

* **Graceful Shutdown:**
  Sunucu kapanırken yarım kalan işleri loglayarak kapanmalıdır ki
  “Neden kapandı?” sorusu cevapsız kalmasın.

---
