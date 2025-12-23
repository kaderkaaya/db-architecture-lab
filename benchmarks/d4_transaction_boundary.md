
---

## Transaction Boundary & Rollback

Bugün **Transaction Boundary & Rollback** konularına çalışacağız.
İlk olarak nedir bu Transaction Boundary: bir işlemi başlattığımızda nerede başlayacağımızı ve nerede duracağımızı tanımlayan sistemdir.

---

## Transaction Adımları

1. İlk olarak işlem başlatılır. Burada DB değişiklikleri bir alana geçici olarak kaydedilir.
2. Eğer işlem başarılı giderse bütün değişiklikler kalıcı olarak kaydedilir.
   *(Commit – Successful End)*
3. Eğer işlemden vazgeçilirse ya da işlem sırasında bir hata olursa, o ana kadar yapılan tüm değişiklikler geri alınır ve DB eski hâline gelir.
   *(Rollback – Unsuccessful End)*

### Transaction Boundary, DB’nin ACID özelliklerini korumak için tasarlanmıştır.

* **Atomicity (Bütünlük):** İşlem bölünemez. Bir işlemin ya tamamen tamamlanacağını (update, insert, delete) ya da hiç tamamlanmayacağı anlamına gelir.
* **Consistency (Tutarlılık):** İşlem bittiğinde veriler kurallara uygun kalır.
* **Isolation (İzolasyon):** İşlemlerin birbirlerine müdahale etmemesini sağlayarak her işlemin bütünlüğünü korur.
* **Durability (Dayanıklılık):** Commit edildikten sonra veriler sistem çökse bile korunur.

→ SQL kodunda `begin()`, `transaction()`, `commit()` ve `rollback()` komutları ile ekleyebiliriz.
→ **Implicit işlemler:** update, delete, insert
→ **Explicit işlemler:** begin, transaction ve commit

**Her zaman `try...catch` blokları kullanmalıyız; bu hatalı bir durumda rollback yapmamızı sağlar.**

* Transaction Commit → Başarılıysa kaydet
* Transaction Rollback → Başarılı değilse geri çek

```js
try {
  transaction.Commit();
} catch (Error) {
  transaction.Rollback();
}
```

---

## Örnek Senaryo

Şöyle bir örnekle gözümüzde canlandıralım:

* `begin()`

1. A hesabımdan B hesabına 100 TL para göndermek istiyorum ve bu para düşülür.
2. B hesabına 100 TL eklenir.
3. İşlem kaydı oluştururuz.
4. `transaction.Commit()` yaparız.

Eğer ilk adımda, yani para düşürüldüğünde hata olursa burada `transaction.Rollback()` ederiz.

---

## Transaction Hangi Katmanda Yapılmalı?

Bu işlemleri **service katmanında** yaparız.
Çünkü bu işlem için birden fazla adım yapmamız gerekir ve hepsinin tek bir sınırda olması gerekir.

Eğer transaction sınırlarını çok geniş tutarsak performans sorunlarına yol açabilir.

* Transaction yaparken `async / await` ile çalışmalıyız ve mutlaka `await` kullanmalıyız.
  Çünkü bir sorguyu beklemeden geçersek, o sorgu transaction dışı kalabilir ya da başlattığımız transaction bitmiş olabilir.
* Mutlaka `try-catch` kullanmalıyız.
* MongoDB’de tek document içindeki işlemler atomiktir.
  Ancak birden fazla collection söz konusuysa transaction gerekebilir.

---

## 2 Tablo / Collection Varsayımı (products / orders)

**SQL:**
Products tablosundaki bir satırı güncelleriz, orders tablosuna bir satır ekleriz.

**NoSQL:**
Bir JSON objesini (document) güncelleriz, başka bir JSON objesi oluştururuz.
Eğer order bilgisini `users` gibi bir collection’da tutsaydık ve User objesinin içine `user.orders` gibi bir array ekleseydik transaction’a gerek kalmazdı.

### NoSQL Örneği

```js
try {
  İşlem A: product dokümanını bul ve stok düş (find ve update)
  İşlem B: Yeni bir order dokümanı oluştur
  commit()
} catch (error) {
  HATA: Dokümanlardaki değişiklikleri iptal et
}
```

```js
const result = await Product.findOneAndUpdate(
  { 
    _id: productId, 
    stock: { $gte: quantity } 
  }, 
  { 
    $inc: { stock: -quantity },
    $push: { salesHistory: { userId, quantity, date: new Date() } }
  },
  { new: true } 
);

if (!result) {
  throw new Error("Stok yetersiz veya ürün bulunamadı!");
}
```

**Orders koleksiyonu:**

```json
{
  "order_id": 101,
  "user": { "name": "kado", "email": "kado@a.com" },
  "items": [
    { "product": "Laptop", "price": 5000 },
    { "product": "Mouse", "price": 100 }
  ],
  "total": 5100
}
```

**Transaction Gereksinimi:** Düşük.
Çünkü siparişle ilgili her şey zaten tek bir JSON objesinin içinde.
Objeyi kaydettiğin an işlem biter.

---

## SQL’de Transaction ve Rollback

SQL’de `CHECK` constraint’lerini kullanarak uygulama seviyesindeki bazı kontrolleri veritabanına devredebiliriz.
Örneğin, bakiyenin 0’ın altına düşmesini engelleyen bir kural koyarsak, transaction hata aldığında veritabanı bunu kendisi reddeder.

```sql
ALTER TABLE accounts
ADD CONSTRAINT bakiye_kontrol CHECK (balance >= 0);
```

→ Burada select edip update yapmak yerine direkt update ettiğimizde SQL hata fırlatır.

---

## SQL Transaction Gereksinimi

SQL’de veriyi parçalara ayırırız.
Bir sipariş için 3 farklı tabloya gitmemiz gerekir:

* **Users Tablosu:** id, name, email
* **Products Tablosu:** id, name, price, stock
* **Orders Tablosu:** id, user_id, product_id, quantity

**Transaction Gereksinimi:** %100
Çünkü 3 tabloyu aynı anda güncellemezsek veri tutarsızlığı oluşur.

---

```md
[create_tables](../sql/create_order_and_product_table.sql)
[seed_product](../sql/seed_product.sql)
[seed_order](../sql/seed_order.sql)
```

Burada ilk olarak tablolarımızı oluşturduk ve tablolarımıza veriler ekledik.
Daha sonra `products` tablomuzdan stoğu düşürdük.

```
update products set stock = stock - 2 where id = 1
1 row(s) affected Rows matched: 1  Changed: 1  Warnings: 0  0.0011 sec
```

```md
[wrong_quey](../sql/queries:q9_transaction.sql)
```

Burada yanlış product id eklediğimiz halde order eklendi ve sistem bozuldu.

```
update products set stock = stock - 2 where id = 1
1 row(s) affected Rows matched: 1  Changed: 1  Warnings: 0  0.00056 sec
```

```md
[added_transaction](../sql/queries:q10_added_transaction.sql)
```

```
rollback
0 row(s) affected
0.00014 sec
```

Şimdi transaction ile nasıl çalışacağımızı öğrendik.
Eğer transaction kullanmazsak sistem bozulur ve bize gerekli hatayı vermez.

---
