
---

## Cache Invalidation Strategies

İlk olarak **cache invalidation** nedir, buna bakalım.
Cache invalidation, cache’de tutulan verinin ne zaman ve nasıl geçersiz kılınacağını belirleme problemidir. Veritabanındaki veri değiştiğinde, önbellekteki eski veriyi nasıl temizleyeceğiz? Buna **cache invalidation**, yani önbelleği geçersiz kılma denir.

Sistemde genel olarak problem şudur: Cache hızlıdır, DB doğru veridir. Ama DB güncellenince cache bayatlar; eğer cache yanlışsa, yanlış veri gelir. Cache invalidation zordur çünkü cache birden fazla yerde olabilir. Concurrent request’ler aynı veriyi okuyup yazabilir.

---

## Cache Stratejileri

### 1. Cache-aside (Lazy Loading)

En yaygın kullanılan stratejidir. Veriyi önce cache’de arar; bulamazsa DB’den alır ve cache’e yazar.

**Read path:**

1. Uygulama cache’e bakar (cache hit mi?).
2. Varsa, veriyi döner.
3. Yoksa (cache miss), DB’den okur.
4. DB’den aldığı veriyi cache’e yazar (bir sonraki sefer için).
5. Veriyi kullanıcıya döner.

**Write path:**

1. DB’yi güncelle
2. Cache’i sil (invalidate)

* Cache sadece gerçekten ihtiyaç duyulan verilerle dolar (verimli bellek kullanımı).
* Cache çökerse sistem durmaz, sadece yavaşlar (doğrudan DB’ye gider).
* Veri DB’de güncellenirse, cache’deki veri eskiyebilir (stale data). Bu yüzden verilere mutlaka bir TTL (Time To Live) süresi atanmalıdır.

```txt
Client
  ↓
Cache (HIT?) ──yes──> Return
   │
   no
   ↓
DB → Cache set → Return
```

### Cache Aside – Kod Örneği

```js
const cacheKey = `user:${id}`;

let user = await redis.get(cacheKey);

if (!user) {
  user = await db.getUser(id);
  await redis.set(cacheKey, JSON.stringify(user), "EX", 60);
}

return user;
```

Update sırasında:

```js
await db.updateUser(id, data);
await redis.del(`user:${id}`);
```

* Bu read-heavy sistemlerde, REST API’lerde ve microservice’lerde kullanılır.

---

### 2. Write-Through

Bu stratejide uygulama veriyi güncellerken aynı anda hem cache’e hem de DB’ye yazar.

1. Uygulama veriyi günceller.
2. Önce cache güncellenir.
3. Ardından DB güncellenir.
4. Her iki işlem de başarılı olunca işlem tamamlanır.

* Cache ve DB her zaman senkronizedir.
* Okuma işlemleri her zaman en güncel veriyi çok hızlı bir şekilde alır.
* Yazma işlemi iki yere birden yapıldığı için daha yavaştır (latency artar).
* Ayrıca hiç okunmayacak veriler bile cache’e yazılarak gereksiz yer kaplayabilir.

**Mantık:**

```txt
Client
  ↓
Cache
  ↓
DB
```

Kodda:

```js
await cache.set(key, value);
await db.write(value);
```

---

| Özellik            | Cache-aside | Write-through |
| ------------------ | ----------- | ------------- |
| Okuma hızı         | Çok iyi     | Çok iyi       |
| Yazma hızı         | İyi         | Daha yavaş    |
| Tutarlılık         | Eventual    | Daha güçlü    |
| Karmaşıklık        | Düşük       | Orta          |
| En yaygın kullanım | Evet        | Hayır         |

---

## Cache Invalidation Yöntemleri

### 1. Explicit Invalidation

```js
redis.del(key);
```

Bu en çok kullanılandır ve en güvenlisidir.

### 2. TTL (Time To Live)

```txt
EX 60 seconds
```

---

* Cache-aside en yaygın stratejidir çünkü DB source of truth’tur.
* Write-through daha güçlü consistency sağlar ama write latency’yi artırır.
* Cache invalidation, distributed sistemlerde en zor problemlerden biridir.

---

| **Senaryo**                                                                 | **Önerilen Cache Stratejisi** |
| --------------------------------------------------------------------------- | ----------------------------- |
| Çok fazla okuma, az yazma varsa (örn. blog, ürün listesi)                   | **Cache-Aside**               |
| Verinin her zaman güncel olması kritikse (örn. banka bakiyesi)              | **Write-Through**             |
| Yazma hızının her şeyden önemli olduğu yerler (örn. oyun skorları, loglama) | **Write-Back (Write-Behind)** |

---