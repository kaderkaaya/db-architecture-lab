
---

## Locking (Concurrency Control)

→ **Concurrency control**, birden fazla işlemin aynı anda verileri manipüle etmesini sağlarken veritabanı tutarlılığını koruyan bir **DBMS konseptidir**.
Eğer concurrency kontrol edilmezse **read anomalies** ortaya çıkar.

* Bir veritabanında aynı saniye içinde binlerce **okuma (read)** ve **yazma (write)** işlemi gerçekleşir.
* Kontrol mekanizması olmazsa şu üç temel sorun (**Race Condition**) ortaya çıkar:

  * **Lost Update:** İki kişi aynı veriyi günceller, biri diğerinin üstüne yazar.
  * **Uncommitted Data:** Bir işlem henüz bitmemiş (geçici) bir veriyi okur.
  * **Inconsistent Analysis:** Bir işlem veri üzerinde hesaplama yaparken başka bir işlem verinin bir kısmını değiştirir ve sonuç yanlış çıkar.

---

### LOST UPDATE

İki işlem aynı veriyi okur.
Her ikisi de kendi belleğinde bir değişiklik yapar.
Önce kaydeden kişinin verisi, sonra kaydeden tarafından fark edilmeden **ezilir**.

**Örnek:**
Stok = 10
* Ali 1 tane satıyor (9 yapacak)
* Veli o sırada 1 tane satıyor (9 yapacak)
* Ali kaydediyor → 9
* Veli kaydediyor → 9

**Sonuç:**
Toplamda 2 satış yapıldı ama stok **8 yerine 9** oldu.

---

### Double Spend (Çift Harcama) & Stok Hataları

Sistemin **“Kontrol (Check)”** ile **“Aksiyon (Act)”** arasında bıraktığı milisaniyelik boşluktan kaynaklanır.

**Senaryo:**
Bakiyen 100 TL. Aynı anda iki farklı ATM’den 100 TL çekme emri veriyorsun.

* İşlem 1: Bakiye 100 mü? → Evet (henüz düşmedi)
* İşlem 2: Bakiye 100 mü? → Evet (çünkü İşlem 1 henüz bitmedi)

**Sonuç:**
İki ATM de parayı verir, bakiye **-100**’e düşer.

---

## Race Condition Hatalarını Çözme Yöntemleri

Şimdi yukarıdaki race condition hatalarını çözmek için farklı yöntemlere bakalım.
İlk olarak **pessimistic** ve **optimistic concurrency**’yi inceleyeceğiz.

---

## 1) Pessimistic Concurrency (Kötümser)

* Mantık: “Kesin çakışma olacak, ben veriyi baştan kilitleyeyim.”
* Veriye erişildiği **an** locking yapılır.
* Veri güvenliği **maksimumdur**.
* Ancak:

  * Diğer işlemler bekletilir
  * Performans düşer
  * **Deadlock** riski vardır

**Kullanım Alanı:**
Double Spend (Çift Harcama) & Stok Hataları

Veriyi okuduğun an (`SELECT ... FOR UPDATE`) veritabanı o satırı kilitler.
İkinci bir kişi o bakiyeye veya stoğa bakmak istediğinde **bekletilir**.

* İşlemler için kuyruk oluşturulur
* Hata payı **sıfırdır**

```js
lock: transaction.LOCK.UPDATE
```

* Pessimistic locking kesin çözümdür ama yanlış kullanılırsa sistemi tamamen durdurabilir. Buna **deadlock** denir.

---

### DEADLOCK ÖRNEĞİ

**Senaryo:**
İki kullanıcı (A ve B) aynı anda birbirine para transferi yapıyor.

**İşlem A (Ali → Veli):**

* Ali’nin hesabını kilitler (FOR UPDATE)
* Veli’nin hesabını kilitlemeye çalışır → Bekler

**İşlem B (Veli → Ali):**

* Veli’nin hesabını kilitler (FOR UPDATE)
* Ali’nin hesabını kilitlemeye çalışır → Bekler

**Sonuç:**
İkisi de birbirini bekler.
Veritabanı bunu fark eder ve birini **“victim”** seçerek işlemi iptal eder.

* Transaction başladığında lock alınır
* Transaction bittiğinde lock kaldırılır

```sql
SELECT *
FROM products
WHERE id = 1
FOR UPDATE;
```

```js
await sequelize.transaction(async (t) => {
  const stock = await Stock.findOne({
    where: { productId: 1 },
    lock: t.LOCK.UPDATE,
    transaction: t
  });

  if (stock.quantity >= 1) {
    stock.quantity -= 1;
    await stock.save({ transaction: t });
  }
});
```

---

## 2) Optimistic Concurrency Control (İyimser)

* Mantık: “Herkes işlemini yapsın, kaydederken kontrol ederiz.”
* Çok hızlıdır, işlemler birbirini beklemez.
* Çakışma olursa işlem iptal edilir, kullanıcı bilgilendirilir.
* Performans optimizasyonu için idealdir.

```js
const stock = await Stock.findByPk(1);
stock.quantity -= 1;

try {
  await stock.save();
} catch (error) {
  if (error.name === 'SequelizeOptimisticLockError') {
    console.log("Çakışma oldu! Başka biri ürünü satın aldı.");
  }
}
```

```sql
UPDATE products
SET stock = stock - 1,
    version = version + 1
WHERE id = 1 AND version = 5;
```

---

## Locking Types

* **Shared Lock (S):**
  Sadece okuma izni verir, birden fazla işlem paylaşabilir.
* **Exclusive Lock (X):**
  Okuma ve yazma izni verir, başka işlem erişemez.
* **Upgrade / Downgrade Locks:**
  Kilit türü koşullara göre değiştirilebilir.

| Sorun        | En İyi Çözüm                      | Neden                                                                   |
| ------------ | --------------------------------- | ----------------------------------------------------------------------- |
| Lost Update  | Optimistic Locking (Version)      | Sadece üzerine yazma sorunudur, hız kesmeye gerek yok.                  |
| Double Spend | Pessimistic Locking               | Para mevzusunda hata kabul edilemez, kullanıcıyı bekletmek daha iyidir. |
| Stok Hatası  | Atomic Update (`WHERE stock > 0`) | Çok hızlıdır, flash sale gibi yoğun trafikte sistemi kilitlemez.        |

---

* Eğer bir işlemde **“Oku → Hesapla → Yaz”** döngüsü varsa ve araya biri girerse hata olur.
* Çözüm:

  1. Döngü bitene kadar kapıyı kilitle (Pessimistic Lock)
  2. Okuma + yazmayı tek SQL’de yap (Atomic Update)

| Problem       | Neden Olur?                                    | Kesin Çözüm                        |
| ------------- | ---------------------------------------------- | ---------------------------------- |
| Lost Update   | İki kişi okur, sonraki kaydeden öncekini ezer. | Optimistic Locking (version)       |
| Double Spend  | Check–Act arası boşluk                         | Pessimistic Locking (`FOR UPDATE`) |
| Stok Hataları | Aynı anda çok satış                            | Atomic Update                      |
| Deadlock      | Kilitler farklı sırayla alınır                 | Lock Ordering                      |

---

### Performans & Mimari Notlar

* Transaction içinde **ne kadar az satır kilitlersen**, sistem o kadar hızlı olur.
* Kilitliyken **asla dış API çağırma** (ödeme, servis vs.).
* Önce ödeme al, sonra transaction açıp stoğu düş.
* Projelerin %90’ında **Optimistic Locking yeterlidir**.
* Para ve stok gibi kritik %10’luk kısımda **Pessimistic Locking** kullan.

**Özet:**

* Bakiye/Stok → Pessimistic + Atomic
* Ürün/Profil → Optimistic
* Raporlar → Isolation Level: Read Committed

**Not:**
Isolation level tüm transaction’ı etkiler, locking ise sadece ilgili satırı.

Eğer pessimistic veya optimistic kullanmak istemiyorsan **atomic update** kullanabilirsin.

---

### ATOMIC UPDATE

* Çok yüksek trafik varsa (saniyede 1000 satış)
* Check ve Act arası süre sıfırdır
* DB motoru mikro kilit alır, günceller, çıkar

```js
const [updatedRows] = await Stock.update(
  {
    quantity: sequelize.literal('quantity - 1')
  },
  {
    where: {
      productId: 1,
      quantity: { [Op.gt]: 0 }
    }
  }
);

if (updatedRows === 0) {
  throw new Error("Stok bitti!");
}
```

* “Ben bu satırı okudum, ben bitene kadar kimse dokunmasın” diyorsan:

  * Isolation level değiştirme
  * `lock: t.LOCK.UPDATE` kullan

-> Isolation seviyesine mümkün olduğunca dokunma, **transaction + locking** kullan.

---