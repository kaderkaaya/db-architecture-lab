
---

## Migration Strategy:

İlk olarak migration strategy nedir, bunu açıklayalım. Migration strategy, bir uygulamanın yaşam döngüsü boyunca veritabanı şemasının ve mevcut verilerin, sistem bozulmadan ve veri kaybı yaşanmadan bir hâlden başka bir hâle dönüştürülmesidir. Aslında şöyle düşünebiliriz: Tekerleği araba giderken değiştirmek gibi.

* Veritabanı şemasında veya veride;

  * canlı sistemi bozmadan,
  * veri kaybı olmadan,
  * geri alınabilir şekilde,
  * adım adım yapma planımızdır.

Neden ihtiyacımız vardır? Kullanıcılar aktif olabilir, eski kod hâlâ çalışıyor olabilir, büyük tablolar kilitlenebilir.

---

### Migration Strategy yaparken nasıl yapmalıyız?

* Yeni migration, eski kodu kırmamalıdır. Yani ilk olarak yeni alan ekleriz, daha sonra kodu yeni alana geçiririz ve en son eski alanı kaldırırız. (**Backward-compatible**)
* **Migration hep şu sırayla olmalı: ADD → DEPLOY → MIGRATE DATA → CLEANUP**
* Her migration için rollback düşünmemiz gerekir; yani “bunu geri almam gerekirse ne yaparım?” diye düşünmeliyiz.

```sql
ALTER TABLE users
ADD COLUMN deleted_at TIMESTAMP NULL;
```

İlk olarak kolonu ekledik, daha sonra kodu deploy ederiz. Soft delete yaptık. Eski kod hâlâ çalışır.

```sql
UPDATE users
SET deleted_at = updated_at
WHERE status = 'deleted';
```

Böyle datayı taşıyabiliriz ve daha sonra:

```sql
DROP COLUMN status_deleted_flag;
```

Eski kolonu kaldırırız.

---

## 1. Schema Migrations (tablo/kolon/index)

Bu, veritabanının yapısını değiştirmekle ilgilidir. Kod tabanınızda `migrations` klasörü altında tutulur.

* **Version Control:** Veritabanı yapısını Git gibi versiyonlanır hâle getirir. Her geliştirici aynı migrate komutunu çalıştırarak aynı tablo yapısına sahip olur.
* **Up & Down Mantığı:**

  * **Up:** Yeni bir tablo veya kolon ekler.
  * **Down:** Yapılan değişikliği geri alır (Rollback).
* **Popüler Araçlar:** Knex.js, Sequelize, TypeORM, Prisma veya Liquibase.

---

## 2. Zero Downtime Migrations (Expand & Contract Stratejisi)

En kritik konu budur. Canlıdaki bir tabloda kolon adını değiştirmek isterseniz, sistemi kapatmadan (downtime olmadan) bunu nasıl yaparsınız? Direkt `RENAME` komutu verirseniz, o anda eski kodu kullanan sunucular patlar.

**Çözüm: Expand & Contract (Genişlet ve Daralt)**

* **Expand (Genişlet):** Veritabanına yeni kolonu ekle ama eskiyi silme. (Örn: `name` duruyor, `full_name` eklendi.)
* **Migrate (Taşı):** Arka planda bir script ile eski kolondaki verileri yeniye kopyala.
* **Dual Write (Çift Yazma):** Kodunu güncelle; uygulama hem eski kolona hem yeni kolona yazsın.
* **Contract (Daralt):** Uygulama artık sadece yeni kolonu okusun. Emin olduğunda eski kolonu sil.

---

## 3. Data Migrations (Mevcut veriyi dönüştürme)

Bazen tablo yapısı değişmez ama içindeki verinin formatı değişir.

**Örnek:** `users` tablosundaki `phone` kolonundaki numaraların başına ülke kodu (+90) eklemek istiyorsunuz.

* **Büyük Veri Sorunu:** Eğer 10 milyon kullanıcınız varsa, tek bir `UPDATE` sorgusu veritabanını dakikalarca kilitleyebilir.
* **Çözüm:** Veriyi batch (parçalar) hâlinde taşırsın. (Örn: Her seferinde 1000 satır güncelle ve aralarda milisaniyelik boşluk bırak.)

```js
// JOB
const BATCH_SIZE = 10000;
const MAX_ID = 1000000;

for (let start = 1; start <= MAX_ID; start += BATCH_SIZE) {
  await queue.add('backfill-foo', {
    fromId: start,
    toId: start + BATCH_SIZE - 1
  });
}
```

```js
// WORKER
new Worker('backfill-queue', async job => {
  const { fromId, toId } = job.data;

  await knex('users')
    .whereBetween('id', [fromId, toId])
    .whereNull('foo')
    .update({
      foo: knex.raw('some_expression')
    });
}, {
  concurrency: 1
});
```

---

| **Strateji**          | **Açıklama**                                              | **Risk Seviyesi**       |
| --------------------- | --------------------------------------------------------- | ----------------------- |
| **Big Bang**          | Sistemi kapat, migration yap, sistemi aç.                 | Yüksek (Kesinti olur)   |
| **Blue-Green**        | Yeni şemalı bir DB/Uygulama kur, trafiği oraya yönlendir. | Orta (Maliyetli)        |
| **Rolling Migration** | Sunucuları tek tek güncelle.                              | Düşük (En profesyoneli) |

---

* Bir migration script’i 5 kez çalıştırılsa bile hata vermemeli veya veriyi bozmamalıdır. (Örn: `IF NOT EXISTS` kullanmak.) (**Idempotency**)
* Büyük bir tabloya index eklemek saatler sürebilir. Bazı veritabanlarında bu tabloyu kilitler (locking). PostgreSQL gibi gelişmiş DB’lerde `CREATE INDEX CONCURRENTLY` kullanarak kilitlemeyi önleyebiliriz.
* Migration yapmadan hemen önce mutlaka bir snapshot (anlık yedek) almalısın.
* Migration işlemlerini mutlaka bir transaction içine almalısın. Eğer ortada bir hata olursa rollback yaparak veritabanının yarım yamalak bir hâlde kalmasını engellersin.
* Eğer bir migration yapıyorsak ve yarıda kaldıysa ne yapmalıyız? Eğer migration’ı bir transaction içinde çalıştırdıysak DB otomatik olarak geri döner. Ama transaction dışı bir işlemse, her migration’ın bir `down` script’i olmalıdır. O script’i manuel tetikleyerek veya daha önceden aldığımız backup üzerinden geri yükleme yaparak sistemi güvenli hâle getiririz.

**!!!!! ÖNCE EKLE, SONRA KULLAN, EN SON SİL MANTIĞI !!!!!**

---

| Senaryo           | Knex | Manuel SQL |
| ----------------- | ---- | ---------- |
| Küçük/orta proje  | ✅    | ❌          |
| Ekipli çalışma    | ✅    | ❌          |
| CI/CD             | ✅    | ❌          |
| Migration history | ✅    | ❌          |
| Çok büyük tablo   | ⚠️   | ✅          |
| Karmaşık index    | ⚠️   | ✅          |
| Acil hotfix       | ❌    | ✅          |

---

* Migration strategy; veritabanını “önce ekle, sonra kullan, en son temizle” mantığıyla, mümkünse Knex gibi bir araçla versiyonlayarak, gerekirse raw SQL ile destekleyerek prod’u kırmadan evrimleştirmektir.

---

| DB               | Online Index Var mı? | Yöntem                         |
| ---------------- | -------------------- | ------------------------------ |
| PostgreSQL       | ✅                    | `CREATE INDEX CONCURRENTLY`    |
| MySQL 8+         | ⚠️                   | `ALGORITHM=INPLACE, LOCK=NONE` |
| MySQL büyük prod | ✅                    | `pt-online-schema-change`      |
| MongoDB          | ✅                    | background index               |

---

* Biz yeni bir alan eklediğimizde `NOT NULL` olarak eklersek prod’u kilitlemiş oluruz. Çünkü yeni eklediğimiz satırlar `NULL` olacağı için hata verir ve işlem iptal olur.
* Peki default olarak verirsek ne olur? Milyonlarca satır update edilir; bu da uzun süreli lock, IO spike ve replication lag ortaya çıkarır. Yani prod donar.
* Bundan dolayı her zaman **`NULLABLE`** olarak eklemeliyiz. Bu hem hızlıdır hem de lock minimal olur.
* Eğer yine milyonlarca satırımız varsa batch’lere bölebiliriz ve bilgileri batch batch doldurabiliriz.
* Bu işlemi yaptıktan sonra `NOT NULL` yapabiliriz; çünkü artık `NULL` değerimiz kalmaz.
* Ayrıca lokalde 1000 satırla deneme yapıp bunu prod’a almak büyük bir risktir. Çünkü 1.000 satır ile 100.000.000 satırla çalışmanın arasında devasa fark vardır. Bundan dolayı 10.000.000 satırlık mock data ile lokalde deneme yapmamız gerekir.

```
*********************************
Yeni kolonun lifecycle’ı:
1. Doğar → nullable
2. Doldurulur → backfill
3. Olgunlaşır → constraint eklenir
*********************************
```

---

| Seçim                          | Sonuç         |
| ------------------------------ | ------------- |
| NOT NULL direkt                | Lock / hata   |
| NOT NULL + default             | Table rewrite |
| NULLABLE → backfill → NOT NULL | Prod safe     |

```js
// migrations/20231027_add_full_name_to_users.js
exports.up = function(knex) {
  return knex.schema.table('users', (table) => {
    table.string('full_name'); // Yeni kolonu ekledik (Expand)
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', (table) => {
    table.dropColumn('full_name');
  });
};
```

```js
// PRODUCER
const { Queue } = require('bullmq');
const knex = require('./db');
const migrationQueue = new Queue('migration-queue');

async function createMigrationJobs() {
  const totalUsers = await knex('users').count('id as count').first();
  const batchSize = 1000;

  for (let i = 0; i < totalUsers.count; i += batchSize) {
    await migrationQueue.add('migrate-batch', {
      offset: i,
      limit: batchSize
    });
  }
  console.log("Tüm işler kuyruğa eklendi!");
}
```

```js
// WORKER
const { Worker } = require('bullmq');
const knex = require('./db');

const worker = new Worker('migration-queue', async (job) => {
  const { offset, limit } = job.data;

  const users = await knex('users')
    .select('id', 'first_name', 'last_name')
    .limit(limit)
    .offset(offset);

  await knex.transaction(async (trx) => {
    const updates = users.map(user => {
      return trx('users')
        .where('id', user.id)
        .update({ full_name: `${user.first_name} ${user.last_name}` });
    });
    await Promise.all(updates);
  });

  console.log(`Batch ${offset} tamamlandı.`);
});
```

---
