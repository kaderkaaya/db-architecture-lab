!!!!!!!YAPICAM!!!!!!!!
---

###  Senaryo: "Limitli Üretim Spor Ayakkabı Lansmanı"

Bir e-ticaret devisin. Dünyaca ünlü bir ikonla anlaştın ve sadece **100 adet** özel üretim ayakkabı satacaksın.

* **Zorluk 1:** Lansman saati geldiğinde saniyede **100.000 istek** bekliyoruz.
* **Zorluk 2:** Stok sadece 100 adet. Bir tane bile fazla satarsak şirket prestiji yerle bir olur.
* **Zorluk 3:** Ödeme sistemleri yavaş olabilir, ancak kullanıcının parasını çekip ayakkabıyı vermemek kabul edilemez.

---

###  Senin Görevin

Aşağıdaki 5 maddeye, öğrendiğimiz teknik terimleri ve mantığı kullanarak nasıl bir çözüm üreteceğini anlat:

#### 1. Stok Yönetimi (Concurrency)

100.000 kişi aynı anda "Satın Al" butonuna bastığında, stokların -50'ye düşmemesi için hangi **Locking** mekanizmasını seçersin? (Pessimistic mi, Optimistic mi?) Neden?

#### 2. Performans ve Filtering

Kullanıcılar ürünleri fiyata veya numaraya göre filtreleyip sıralayacak. Veritabanının bu yük altında "Filesort" yapıp kilitlenmemesi için nasıl bir **Indexing** stratejisi kurarsın?

#### 3. Güvenlik ve Hız Sınırı (Security & Rate Limiting)

Botların saniyede binlerce istek atarak gerçek insanların önüne geçmesini nasıl engellersin? Hangi **Security Headers** veya kütüphaneleri kullanırsın?

#### 4. Observability (İzleme)

Sistem o an dar boğaza girerse (Örneğin ödeme API'si yavaşlarsa), bunu anında nasıl fark edersin? Hangi **Monitoring** sinyallerine (Altın Sinyaller) alarm kurarsın?

#### 5. Testing

Bu kritik lansmandan önce sistemin patlamayacağından emin olmak için hangi **Test** türüne ağırlık verirsin? Gerçek veritabanı mı yoksa Mock mu kullanırsın?

---
