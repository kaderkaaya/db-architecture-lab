
---

## Caching, Idempotency ve Rate Limiting

Bugün ilk olarak **Caching nedir**, **ne zaman kullanılır** ve **hangi durumlarda kullanılmaması gerekir** konularına bakacağız.

### Caching Nedir?

Caching; sık erişilen verilerin, hızlı erişilebilen bir bellek alanında (RAM) **geçici olarak saklanmasıdır**.

Geliştirdiğimiz uygulamalarda kullanıcı sayısı arttıkça:

* Her istek veritabanına gider
* Veritabanı yavaşlar
* API response süreleri uzar
* Kullanıcı deneyimi düşer ve kullanıcı kaybı yaşanır

Bu problemleri azaltmak için caching kullanırız.

---

### Ne Zaman Cache Kullanılmamalı?

* **Çok nadir erişilen veriler** cache edilmemelidir
* **Çok sık değişen veriler** cache edilirse kullanıcıya yanlış (stale) veri dönebilir
* Cache edilen veri, **tek doğru kaynak (source of truth)** olmamalıdır

---

## Neden Cache Kullanmalıyız?

* Kullanıcıya daha hızlı cevap verebilmek
* Daha iyi kullanıcı deneyimi sağlamak
* Veritabanındaki gereksiz sorgu ve bandwidth trafiğini azaltmak
* 1 kullanıcı varken de, 1000 kullanıcı varken de benzer performans sunabilmek
* Sistemin yatayda ölçeklenmesini (scaling) kolaylaştırmak

---

## Cache Türleri

### 1️⃣ In-Memory Caching

*(Node.js Map, LRU Cache vb.)*

Uygulamayla ilgili verilerin, uygulamayı çalıştıran **web server’ın RAM’inde** tutulmasıdır.

**Avantajları**

* Çok hızlıdır
* Kurulumu kolaydır
* Ek servis gerektirmez

**Dezavantajları**

* Server restart olursa cache silinir
* RAM kapasitesiyle sınırlıdır
* Birden fazla instance varsa cache tutarsızlığı oluşur

> Birden fazla server kullanılıyorsa, cache tutarsızlığı **kısmen Session Sticky** ile çözülebilir ancak bu kalıcı bir çözüm değildir.

---

### 2️⃣ Distributed Caching (Redis)

Redis, cache verilerini **uygulama sunucularından bağımsız**, ayrı bir cache servisi üzerinde tutan **distributed cache** çözümüdür.

Özellikle:

* Birden fazla instance
* Load balancer
* Horizontal scaling

olan sistemlerde **Redis zorunlu hâle gelir**.

#### Nasıl Çalışır?

1. İlk istekte veri veritabanından okunur
2. Okunan veri Redis’e yazılır
3. Sonraki isteklerde veritabanına gitmeden Redis’ten okunur
4. Redis’te varsa direkt client’a döndürülür

---

## Cache Metodolojileri

### 🔹 On-Demand (Lazy Loading)

* Veri ilk kez istendiğinde cache’e alınır
* En yaygın ve önerilen yöntemdir

### 🔹 Prepopulation

* Uygulama ayağa kalkarken cache doldurulur
* Genelde sabit ve sık kullanılan veriler için tercih edilir

---

## Cache Ömrü (TTL – Time To Live)

### 🔸 Absolute Time

* Cache oluşturulduktan sonra belirlenen süre dolunca veri silinir

### 🔸 Sliding Time

* Cache verisine erişildikçe süresi uzatılır
* Tek başına kullanılırsa **bayat veri riski** oluşturur

> En doğru yaklaşım: **Absolute Time + Sliding Time birlikte kullanmak**

---

## Redis ve Bellek Kullanımı

Redis verileri RAM üzerinde tutar. Bu sayede:

* Disk erişimi ortadan kalkar
* Gecikmeler minimize edilir
* CPU kullanımı azalır

Ancak RAM üzerinde çalıştığı için:

* Veri boyutuna göre yeterli RAM gerekir
* Redis bir **primary database değildir**
* İlişkisel veritabanları gibi kompleks sorgular desteklemez
* Transaction rollback mekanizması yoktur

---

## Redis Veri Kalıcılığı (Persistence)

Redis RAM tabanlıdır ancak veri kaybını önlemek için iki yöntem sunar:

### a️) Point-in-Time Snapshots (RDB)

* Belirli aralıklarla bellek verisi diske yazılır
* Sunucu çökse bile veri geri yüklenebilir

### b️) Append Only File (AOF)

* Yapılan her değişiklik dosyanın sonuna eklenir
* Daha güvenlidir ancak disk kullanımı fazladır

---

## Redis vs Memcached

* **Memcached**

  * Multi-threaded
  * Basit key-value
  * Bazı senaryolarda daha hızlı

* **Redis**

  * Gelişmiş veri tipleri (List, Set, Sorted Set, Hash)
  * TTL, Pub/Sub, Rate Limit, Lock gibi özellikler
  * Daha esnek ve güçlü

> Uygulama büyüdükçe ve veri türlerine ihtiyaç arttıkça genellikle **Memcached → Redis** geçişi yapılır.

---

## Cache Stratejileri

### 🔹 Cache-Aside (En Yaygın)

1. Önce Redis’e bakılır
2. Yoksa DB’den okunur
3. Redis’e yazılır
4. Client’a döndürülür

```js
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);

const data = await dbCall();
await redis.set(key, JSON.stringify(data), 'EX', 60);
return data;
```

### 🔹 Write-Through

* Veri hem DB’ye hem Redis’e aynı anda yazılır

---

## Cache Eviction (Silme Politikaları)

Bellek dolduğunda Redis hangi verinin silineceğine karar verir.

En yaygın politika:

* **LRU (Least Recently Used)**
  → En uzun süredir kullanılmayan veri silinir

---

## In-Memory vs Redis Karşılaştırması

| Özellik          | In-Memory (Map) | Redis       |
| ---------------- | --------------- | ----------- |
| Process restart  | ❌ silinir       | ✅ kalabilir |
| Multi instance   | ❌               | ✅           |
| TTL              | ⚠️ manuel       | ✅ native    |
| Rate limiting    | ❌               | ✅           |
| Session          | ❌               | ✅           |
| Distributed lock | ❌               | ✅           |

---

* Cache performans için vardır, veri doğruluğu için değil
* Redis bir veritabanı değildir ama veritabanını **hayatta tutar**
* TTL, Redis’in en büyük gücüdür
* Cache edilen veri **her an ölebilir**, buna hazır olunmalıdır

***Caching sistemi "Fail-safe" (hata toleranslı) olmalıdır. Yani Redis ulaşılamaz olduğunda kod, try-catch bloğu içinde bu hatayı yakalayıp isteği doğrudan veritabanına (DB) yönlendirmelidir. Buna "Fall-through to Database" denir.***

***Client → API → Redis → (yoksa) DB***

---

## Idempotency Nedir?

Şimdi **Idempotency nedir**, **ne zaman kullanılır** konularına bakacağız.

Idempotency, bir işlemi bir kez yapmanla, aynı işlemi 10 kez yapman arasında hiçbir fark olmaması demektir.
Yani API’ye aynı isteği tekrar tekrar gönderdiğinde sistem aynı sonucu verir ve bozulmaz.

🎯 **Basit Örnek:**
`DELETE /products/10` isteği ürünü siler.
Bu isteği tekrar tekrar gönderirsen ürün zaten silinmiş olur, sistem yine sakin kalır.

❌ **Tam Tersi Örnek:**
`POST /orders` isteği her çağrıldığında yeni bir sipariş oluşturur.
10 kez çağırırsan 10 sipariş oluşturur — bu idempotent değildir.

Kısacası: **Idempotency**, sistemin aynı isteğe birden fazla yanıt vermemesi için bir güvenlik katmanıdır.

---

## Idempotency Neden Önemlidir?

Gerçek dünyada ağ sorunları, çift tıklamalar veya mobil uygulama hataları nedeniyle aynı istek birden fazla kez gönderilebilir.

Eğer sistem bu tekrarları düzgün karşılayamazsa hatalı veriler oluşur:

* Aynı sipariş iki kez verilir
* Para iki kez çekilir
* Stok iki kez azalır
* Aynı kullanıcıya beş mail gider

Idempotency sayesinde sistem, aynı isteğin tekrarlandığını anlar ve ekstra işlem yapmadan durumu korur.

🎯 **Örnek Senaryo:**
Kullanıcı ödeme yaptı ama sayfa takıldı. Yeniden “Gönder” dedi.

* Eğer işlem idempotent değilse: Aynı ürün iki kez satılır, para iki kez çekilir
* Eğer idempotent ise: Sistem “bu işlem zaten yapılmış” der ve tekrar etmez

Kritik işlemlerde (sipariş, ödeme, silme) idempotency bir **güvenlik zorunluluğudur**.

---

### Nerelerde Kullanılır?

Genelde HTTP method’larında **POST** işlemlerine eklenir çünkü her çağrıda yeni veri oluşturur.
(Gerekli durumlarda **UPDATE** işlemlerinde de kullanılabilir.)

---

### Nasıl Çözülür? (Idempotency Key)

1. Frontend her istek için benzersiz bir **Idempotency-Key** (genelde UUID) üretir ve header’da gönderir
2. Backend bu key’i alır ve Redis’e kaydeder
3. Aynı key ile bir istek daha gelirse, backend işlemi tekrar yapmak yerine Redis’teki eski sonucu döner

```js
if (await redis.exists(key)) {
  return cachedResponse;
}
const result = await processPayment();
await redis.set(key, JSON.stringify(result), "EX", 300);
```

---

## Rate Limiting Nedir?

Şimdi **Rate Limiting nedir**, **ne zaman kullanılır** konularına bakacağız.

Rate limiting; bir kullanıcının veya IP adresinin belirli bir zaman diliminde kaç istek atabileceğini sınırlamaktır.

### Neden Kullanılır?

* Brute-force saldırılarını engellemek
* DDoS saldırılarından korunmak
* API maliyetlerini (sunucu yükünü) yönetmek

---

* **Fixed Window:**
  “Her dakikada 100 istek.”
  (Dakika başında sıfırlanır, sınırda yığılma yapabilir.)

* **Sliding Window:**
  Daha hassastır, zamanı kaydırarak kontrol eder.

* **Token Bucket:**
  Kullanıcıya bir “jeton kovası” verilir.
  İstek attıkça jeton harcar, zamanla kova dolar.
  (En popüler ve esnek olan yöntemdir.)

---

### Uygulama

Redis burada da başroldedir.
Kullanıcının IP’sini key, istek sayısını value olarak tutarak saniyeler içinde kontrol sağlar.

---

| **Kavram**        | **Temel Amaç**             | **Başlıca Araçlar**               |
| ----------------- | -------------------------- | --------------------------------- |
| **Caching**       | Performans ve hız artırımı | Redis, Memcached                  |
| **Idempotency**   | Tutarlılık ve güvenlik     | Unique Keys, Database Constraints |
| **Rate Limiting** | Sistem sağlığı ve güvenlik | Redis, Nginx, API Gateway         |

---

## Bu Üçü Birlikte Nasıl Çalışır?

Diyelim ki bir **“Para Transferi” API’n** var:

* **Rate Limiting:**
  Kullanıcının saniyede 1’den fazla transfer isteği atmasını engellersin (koruma).

* **Idempotency:**
  İstek geldiğinde Idempotency-Key kontrol edilir.
  Kullanıcı butona çift tıklarsa ikinci istek reddedilir veya ilk işlemin sonucu döndürülür.
  (Çift ödeme engellenir.)

* **Caching:**
  Kullanıcının hesap bakiyesini Redis’ten hızlıca kontrol edersin (performans).
  İşlem bitince Redis’teki bakiyeyi temizler veya güncellersin.

---