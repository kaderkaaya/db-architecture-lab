!!!!!!TEKRAR BAK!!!!!!!!
---

## Read Replicas

Normalde uygulaman hem veri yazar hem de veri okur. Ama çoğu uygulamada (Twitter, Instagram, E-ticaret) okuma miktarı, yazma miktarından 100 kat daha fazladır. Bundan dolayı salt okunur kopyalarını olustururuz ve uygulamadakaki veriler bu replikalardan gelir.

┌─────────────┐
│   Master    │ ◄─── Tüm WRITE işlemleri
│  (Primary)  │
└──────┬──────┘
       │ Replikasyon
       ├─────────────┬─────────────┐
       ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Replica1 │  │ Replica2 │  │ Replica3 │
│  (READ)  │  │  (READ)  │  │  (READ)  │
└──────────┘  └──────────┘  └──────────┘

Aslında biz veritabanının kopyalarını olusturuyoruz. Yazma işlemleri master'a, okuma işlemleri replikalar arasında dağıtılır. 


**Primary (Master) DB:** Sadece yazma (INSERT, UPDATE, DELETE) işlemlerini yapar.
**Replica (Slave) DBs:** Primary DB'deki verileri anlık olarak kopyalar ve sadece okuma (SELECT) işlemlerine cevap verir.
**Avantajı:** Yükü dağıtırsın. Ana veritabanın sadece sipariş almakla uğraşırken, ürün listeleme istekleri kopyalardan döner.
**Dezavantajı (Replication Lag):** Ana veritabanına bir şey yazıldığında, kopyalara gitmesi milisaniyeler sürer. Bu yüzden kullanıcı profilini güncelleyip sayfayı hemen yenilerse eski bilgisini görebilir.

- Peki neden var bu replikalar çünkü kullandığımı"da read yükü azalır, scale edebiliriz, Analytics / list / search gibi işleri ayırabiliriz.
*******************************************************
- Read replicayı write sonrası hemen read yapmamalıyız.
```txt
POST /order
GET  /order/123 (replica’dan okunmaz)
```
- Auth işlemlerinde yapmamalıyız(Login, token validation, permission check)
*******************************************************

Peki nerde kullanabililiriz:
* Listeler(ürün listesi, geçmiş siparisler, dashboard)
* Search(filtreleme, sıralama)
* Analytics(raporlar, istatistik)

## CQRS (Command Query Responsibility Segregation)

Bu bir adım daha ileri gitmektir. "Okuma ve Yazma işlemlerini mantıksal ve fiziksel olarak tamamen ayır" der.

**Commands (Yazma):** Sistemin durumunu değiştiren işlemlerdir. (Sipariş Ver, Kaydol).
**Queries (Okuma):** Sadece veri çeken işlemlerdir. (Ürünleri Listele, Rapor Al).
**Neden CQRS?** Bazen okuma işlemleri çok karmaşık JOINler gerektirir ve SQL'i yorar. CQRS ile yazma işlemini SQL'e yaparken, okuma verilerini daha hızlı olan NoSQL (Elasticsearch, MongoDB) veya Redis'e önceden hazır (denormalize) bir şekilde atabilirsin.



**Diyelim ki bir Sipariş sistemin var.**

Normal Sistem (CQRS Olmadan): Hem siparişi aynı tabloya yazarsın, hem de "Geçmiş siparişlerimi getir" dediğinde aynı tablodan çekersin. 1 milyon sipariş olduğunda o SELECT sorgusu veritabanını ağlatır.

**CQRS ve Read Replica ile Sistem:**
1. Siparişi Ver (Command): knex('orders').insert(...) -> Bu Master DB'ye gider.
2. Siparişleri Listele (Query): knex('orders_summary_view').select(...) -> Bu Read Replica'dan çekilir.
Bu sayede, binlerce kişi eski siparişlerine bakarken, senin yeni sipariş alma hızın (Master DB) hiç etkilenmez.

**Özetle Fark Nedir?**
Read Replica: "Aynı veritabanının kopyalarını yapalım, yükü dağıtalım" demektir. (Fiziksel çözüm).
CQRS: "Okuma kodumla yazma kodum (ve belki tablolarım) tamamen farklı mantıkla çalışsın" demektir. (Mimari çözüm).

**Bu İkili Nasıl Birlikte Çalışır? (Event-Driven Bağlantısı)**
Daha önce öğrendiğimiz Event-Driven mantığı burada devreye girer:
1. Kullanıcı bir sipariş verir (Command).
2. Sipariş Servisi SQL'e yazar ve bir "OrderCreated" event'i fırlatır.
3. Bir Background Job (BullMQ) bu event'i yakalar.
4. Gider, hızlı okuma yapacağımız NoSQL veya Read Replica'daki tabloyu günceller.
5. Frontend veriyi çektiğinde (Query) artık en güncel ve hızlı veriyi okur.

- Sadece Read Replica Olsaydı: Milyonlarca kişi aynı karmaşık ve ağır tabloları okumaya çalışırdı. Sunucu yine yorulurdu.

- gSadece CQRS Olsaydı: Okuma ve Yazma kodlarını ayırırdın ama hepsi hala tek bir bilgisayarda (sunucuda) çalışıyor olurdu. Sunucu çökerse site yine giderdi.

Read Replicas Kullan:

Okuma ağırlıklı sistemlerde (%80+ okuma)
Hızlı başlangıç için
Mevcut uygulamayı minimal değiştirerek ölçeklendirmek için
E-ticaret ürün listeleme, blog okuma

CQRS Kullan:

Karmaşık domain logic varsa
Okuma ve yazma gereksinimleri çok farklıysa
Event sourcing kullanıyorsan
Mikroservis mimarilerinde
Yüksek ölçeklenebilirlik ve performans kritikse
Finansal sistemler, rezervasyon sistemleri


| Özellik                  | Read Replicas | CQRS                    |
| ------------------------ | ------------- | ----------------------- |
| **Karmaşıklık**          | Düşük         | Yüksek                  |
| **Aynı şema**            | Evet          | Hayır (farklı modeller) |
| **Tutarlılık**           | Eventual      | Eventual                |
| **Uygulama değişikliği** | Minimal       | Önemli                  |
| **Maliyet**              | Orta          | Yüksek                  |

---