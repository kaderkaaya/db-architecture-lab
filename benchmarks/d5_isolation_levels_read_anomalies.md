
---

## Isolation Levels & Read Anomalies

Bugün **isolation levels** ve **read anomalies** üzerine konuşacağız. İlk olarak concurrency problem nedir ve nasıl çözeriz, bunu açıklayalım. Concurrency problem, birden fazla işlemin kontrolsüz veya kısıtlamasız bir şekilde eş zamanlı olarak yürütülmesiyle çıkan problemlerdir. **Race Condition** olarak da bilinir. Eğer veritabanı veya uygulama bu çakışmayı yönetemezse veriler bozulur. Burada oluşan anomalilere **read anomalies** denir.

* Node.js **single thread** olduğu için kendi içinde işlem çakışması yapmaz gibi görünse de, veritabanı işlemleri asenkron (**async/await**) olduğu için veritabanı seviyesinde bu sorunlar aynen devam eder.

* Dün transaction’ın ne olduğunu ve transaction’ların DB’nin **ACID** özelliklerini korumak için tasarlandığını anlamıştık.

A
C
**Isolation** = işlem bütünlüğünü korur
D

olduğunu biliyoruz.
Şimdi isolation levels hakkında konuşalım.

Bir işlem devam ederken, diğer işlemlerin bu verileri ne kadar görebileceğini **isolation levels** ile belirleriz.

* **Isolation**, birden fazla transaction işleminin birbiriyle olan ilişkisini tanımlayan ve birbirleriyle olan izolasyon (etkilenme) seviyesini belirlememize imkân veren olgudur.
* Isolation, genellikle **RDBMS (İlişkisel Veritabanı)** sistemlerinde çok daha yaygındır.

Eğer isolation level düşükse performans artar, ancak **read anomalies** oluşur.
Peki, nedir bu read anomalies?

---

## Read Anomalies Türleri

### 1) Dirty Read

Bir transaction, henüz commit edilmemiş başka bir eş zamanlı transaction tarafından yazılan verileri okuduğunda oluşur.
Rollback yapılması durumunda yanlış verileri kullanmış oluruz.

**Dirty Read Örneği**

**Senaryo:** Bir banka uygulaması

* İşlem A (Admin): Ali'nin hesabına 1000 TL bonus yatırıyor ama henüz *commit* etmedi.
* İşlem B (Ali): O sırada bakiyesine bakıyor.
* **Hata:** Ali bakiyesini 1000 TL fazla görüyor (Dirty Read).
* **Sonuç:** Admin hatayı fark edip işlemi *rollback* ediyor. Ali aslında olmayan bir parayı gördüğü için sistemde hayali bir durum oluşuyor.

---

### 2) Non-Repeatable Read

Bir işlem içinde aynı veri iki kez okunduğunda, arada başka bir işlem o veriyi güncellediği için farklı sonuçlar alınmasıdır.

**Non-Repeatable Read Örneği**

**Senaryo:** Stok raporu hazırlama

* İşlem A (Raporcu): Depodaki “iPhone” stok sayısını okuyor → **50**
* İşlem B (Müşteri): Bir adet iPhone satın alıyor ve işlemi *commit* ediyor.
* İşlem A (Raporcu): Stoğu tekrar okuyor → **49**

**Anomali:**
Aynı işlem içinde (A bitmeden) aynı veri değişti. Rapor tutarsız hâle geldi.

---

### 3) Phantom Read

“Hayalet okuma” olarak adlandırılır.
Bir sorgu belirli bir koşula göre satırları getirirken, başka bir işlem bu aralığa yeni satır eklerse ikinci okumada fazladan satır görülür.

**Phantom Read Örneği**

**Senaryo:** Maaş zammı hesaplama

* İşlem A (Muhasebe): “Maaşı 20.000 TL olan tüm çalışanları listele” sorgusu yapıyor
  → 3 kişi (Can, Ece, Naz)
* İşlem B (İK): Sisteme yeni bir çalışan ekliyor: Mert (maaşı 20.000 TL) ve *commit* ediyor.
* İşlem A (Muhasebe): Listeyi tekrar kontrol ediyor → **4 kişi**

Mert “hayalet” gibi aradan çıktı.

---

## Read Anomalies ve Çözüm Seviyeleri

| **Sorun**               | **Çözüm Seviyesi** | **Mantık**                                                                                     |
| ----------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| **Dirty Read**          | Read Committed     | “Sadece onaylanmış (commit) veriyi göster.”                                                    |
| **Non-Repeatable Read** | Repeatable Read    | “Ben bir satırı okuduysam, ben bitene kadar kimse o satırı değiştirmesin.”                     |
| **Phantom Read**        | Serializable       | “Ben bir aralığı okuduysam, araya kimse yeni satır ekleyemesin (tüm tabloyu/aralığı kilitle).” |

* Commit gör → **Read Committed**
* Satır sabit kalsın → **Repeatable Read**
* Aralık sabit kalsın → **Serializable**

---

## Isolation Level Karşılaştırması

Aşağı doğru indikçe **güvenlik artar**, **performans düşer**.

| **Seviye**           | **Dirty Read** | **Non-Repeatable Read** | **Phantom Read** |
| -------------------- | -------------- | ----------------------- | ---------------- |
| **Read Uncommitted** | İzin verir     | İzin verir              | İzin verir       |
| **Read Committed**   | Engeller       | İzin verir              | İzin verir       |
| **Repeatable Read**  | Engeller       | Engeller                | İzin verir       |
| **Serializable**     | Engeller       | Engeller                | Engeller         |

* Isolation level belirtmezsek default olarak PostgreSQL’de **Read Committed**, MySQL’de **Repeatable Read** gelir.
* En tutarlı seviye **Serializable**, en tutarsız seviye **Read Uncommitted**’tır.

---

## Isolation Levels Açıklaması

### 1) Read Uncommitted

En düşük seviyedir.
Transaction’lar, commit edilmemiş diğer transaction’ların yazdığı verileri görebilir.
Bu nedenle **dirty read** oluşur.

### 2) Read Committed

Transaction’lar yalnızca commit edilmiş verileri görebilir.
Dirty read artık mümkün değildir.

### 3) Repeatable Read

Daha katı bir seviyedir.
Aynı select sorgusu, transaction bitene kadar her zaman aynı sonucu döndürür.
Non-repeatable read engellenir.

### 4) Serializable

En yüksek izolasyon seviyesidir.
Transaction’lar sanki tek tek sırayla çalışıyormuş gibi davranır.
En tutarlı seviyedir, ancak çok fazla **deadlock** oluşabilir ve sistem ciddi şekilde yavaşlar.

---

## Örnek: Isolation Seviyesi Repeatable Read

1. Sen bakiyeyi 100 okudun.
2. Başkası bakiyeyi 100 okudu.
3. O, 50 ekledi (150 yaptı ve commitledi).
4. Sen hâlâ 100 görüyorsun (çünkü Repeatable Read seni koruyor, onun değişimini sana göstermiyor).
5. Sen 20 ekledin ve 120 olarak kaydettin.
6. Sonuç: Diğer kişinin 50 TL’si uçtu!

Burada sadece isolation level’ın yetmediğini görüyoruz. Bazı kısımlarda **locking** yapmamız gerekir.

**Transaction Boundary** dediğimiz o çizgi, aslında bu izolasyonun ve kilitlerin geçerli olduğu bölgeyi belirler. Çizginin dışına çıktığın an (commit/rollback), kilitler açılır ve izolasyon biter.

Şimdi SQL ile nasıl yaparız, buna bakalım:

[added_transaction](../sql/queries:q11_transaction.sql)

Burada ilk olarak transaction’ı ekledim ve daha sonra
[update_stock](../sql/queries:q12_added_commit.sql)

Stock’u update edip yeni bir query eklediğimde
[after_transaction](../sql/queries:q13_after_transaction.sql)

Burada yine değişmedi çünkü DB kendini koruyor; default olarak **Repeatable Read**.

[repeatable_read](../sql/queries:q14_repeatable_read.sql)

Stock değeri güncellenmez çünkü **REPEATABLE READ**.

---
