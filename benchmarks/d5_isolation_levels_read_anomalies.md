
---

## Isolation Levels & Read Anomalies

Bugün **isolation levels** ve **read anomalies** üzerine konuşacağız.
İlk olarak concurrency problem nedir ve nasıl çözeriz bunu açıklayalım.

Concurrency problem, birden fazla işlemin kontrolsüz veya kısıtlamasız bir şekilde eş zamanlı olarak yürütülmesiyle çıkan problemlerdir.
**Race Condition** olarak da bilinir.

Eğer veritabanı veya uygulama bu çakışmayı yönetemezse veriler bozulur.
Burada oluşan anomalilere **read anomalies** denir.

* Node.js *Single Thread* olduğu için kendi içinde işlem çakışması yapmaz gibi görünse de
* Veritabanı işlemleri **asenkron (async/await)** olduğu için veritabanı seviyesinde bu sorunlar aynen devam eder.

Dün transaction’ın ne olduğunu ve transaction’ların DB’nin **ACID** özelliklerini korumak için tasarlandığını anlamıştık.

A
C
**Isolation** = işlem bütünlüğünü korur
D

Şimdi isolation levels hakkında konuşalım.

Bir işlem devam ederken, diğer işlemlerin bu verileri ne kadar görebileceğini **isolation levels** ile belirleriz.

* **Isolation**, birden fazla transaction işleminin birbiriyle olan ilişkisini tanımlar.
* Isolation, genellikle **RDBMS (İlişkisel Veritabanı)** sistemlerinde çok daha yaygındır.

Isolation level düştükçe performans artar, ancak **read anomalies** oluşur.

---

## Read Anomalies Türleri

### 1) Dirty Read

Bir transaction, henüz commit edilmemiş başka bir transaction tarafından yazılan verileri okuduğunda oluşur.
Rollback yapılırsa yanlış veriler kullanılmış olur.

**Dirty Read Örneği – Banka Senaryosu**

* İşlem A (Admin): Ali'nin hesabına 1000 TL bonus yatırır ama *commit etmez*
* İşlem B (Ali): O sırada bakiyesine bakar
* **Hata:** Ali bakiyesini 1000 TL fazla görür
* İşlem A rollback yapar

**Sonuç:** Ali olmayan bir parayı görmüş olur.

---

### 2) Non-Repeatable Read

Bir işlem içinde aynı veri iki kez okunduğunda, arada başka bir işlem o veriyi güncellediği için farklı sonuçlar alınır.

**Örnek – Stok Raporu**

* İşlem A: Stok sayısını okur → **50**
* İşlem B: 1 adet ürün satın alır ve *commit eder*
* İşlem A: Stoğu tekrar okur → **49**

Aynı transaction içinde veri değişmiştir.

---

### 3) Phantom Read

Belirli bir koşula göre satırları okurken, başka bir işlem bu aralığa yeni satır eklerse oluşur.

**Örnek – Maaş Listesi**

* İşlem A: Maaşı 20.000 TL olan çalışanları listeler → **3 kişi**
* İşlem B: Maaşı 20.000 TL olan yeni bir çalışan ekler ve *commit eder*
* İşlem A: Listeyi tekrar okur → **4 kişi**

Yeni gelen kayıt “hayalet” gibidir.

---

## Read Anomalies ve Çözüm Seviyeleri

| Sorun               | Çözüm Seviyesi  | Mantık                                           |
| ------------------- | --------------- | ------------------------------------------------ |
| Dirty Read          | Read Committed  | Sadece commit edilmiş veriyi göster              |
| Non-Repeatable Read | Repeatable Read | Okunan satır transaction bitene kadar değişmesin |
| Phantom Read        | Serializable    | Okunan aralığa yeni kayıt eklenemesin            |

* Commit gör → **Read Committed**
* Satır sabit → **Repeatable Read**
* Aralık sabit → **Serializable**

---

## Isolation Level Karşılaştırması

Aşağı indikçe **güvenlik artar**, **performans düşer**.

| Seviye           | Dirty | Non-Repeatable | Phantom |
| ---------------- | ----- | -------------- | ------- |
| Read Uncommitted | ✔     | ✔              | ✔       |
| Read Committed   | ✘     | ✔              | ✔       |
| Repeatable Read  | ✘     | ✘              | ✔       |
| Serializable     | ✘     | ✘              | ✘       |

* PostgreSQL default: **Read Committed**
* MySQL default: **Repeatable Read**
* En tutarlı: **Serializable**
* En zayıf: **Read Uncommitted**

---

## Isolation Levels Açıklaması

### Read Uncommitted

* Commit edilmemiş veriler okunabilir
* Dirty read oluşur

### Read Committed

* Sadece commit edilmiş veriler okunur
* Dirty read engellenir

### Repeatable Read

* Aynı select her zaman aynı sonucu döner
* Non-repeatable read engellenir

### Serializable

* Transaction’lar sanki sırayla çalışıyormuş gibi davranır
* En güvenli ama en yavaş seviye
* Deadlock riski yüksektir

---

## Repeatable Read Örneği

1. Sen bakiyeyi **100** okudun
2. Başkası da **100** okudu
3. O, **50 ekledi** ve commit etti
4. Sen hâlâ **100** görüyorsun
5. Sen **20 ekledin** ve **120** olarak kaydettin
6. Diğer kişinin **50 TL’si kayboldu**

Burada isolation level tek başına yeterli değildir, **locking** gerekir.

**Transaction Boundary**, izolasyon ve kilitlerin geçerli olduğu sınırdır.
Commit/Rollback sonrası bu koruma biter.

---

## SQL ile Örnek Akış

* Transaction başlatıldı
  `[added_transaction](../sql/queries:q11_transaction.sql)`
* Stock update edildi
  `[update_stock](../sql/queries:q12_added_commit.sql)`
* Transaction sonrası kontrol
  `[after_transaction](../sql/queries:q13_after_transaction.sql)`
* Repeatable Read davranışı
  `[repeatable_read](../sql/queries:q14_repeatable_read.sql)`

Stock değeri güncellenmez çünkü **REPEATABLE READ** çalışmaktadır.

---
