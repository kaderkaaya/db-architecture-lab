
---

## Layered Architecture

Layered Architecture, uygulamayı sorumluluklarına göre farklı katmanlara ayırmayı amaçlar.
Bu sayede kod daha okunabilir, test edilebilir ve bakımı kolay hâle gelir.

Backend tarafında temel katmanlar şunlardır:

1. Presentation Layer (Controller)
2. Business Layer (Service)
3. Data Layer (Repository)

---

### Presentation Layer

Bu katman HTTP request ve response işlemlerinden sorumludur.
Request validation, DTO mapping ve response oluşturma işlemleri burada yapılır.
Business logic ve database erişimi bu katmanda yer almaz.

---

### Business Layer

Uygulamanın iş kuralları bu katmanda bulunur.
Hesaplamalar, iş akışları ve transaction yönetimi burada yapılır.
Transaction boundary bu katmanda belirlenir, repository bu transaction’a katılır.
Bu katman, controller ile data layer arasında köprü görevi görür.

---

### Data Layer

Veritabanı erişimi bu katmanda soyutlanır.
SQL / ORM sorguları, caching ve ilişkisel veri işlemleri burada yapılır.
Repository’ler interface olarak tanımlanır.
Bu sayede database veya ORM değişiklikleri business layer’ı etkilemez.

---

### Presentation Layer ve Sorumluluk Ayrımı

**Presentation layer aslında bizim controller’ımızdır.
Peki neden DB işlemlerini burada yapmayız?**

Çünkü her katmanın kendi sorumlulukları vardır.
Controller’da kullanıcıdan aldığımız verileri business layer’a göndeririz.
Business layer’da gerekli işlemler yapıldıktan sonra data layer’a iletilir.

**Örneğin kullanıcı kayıt olurken:**

* Controller kullanıcıdan gelen bilgileri alır
* Service katmanında kullanıcının girdiği şifre hashlenir
* Ardından bu veri data layer aracılığıyla database’e kayd

---

### DB Mocklama ve Test Yaklaşımı

Backend tarafında bir endpoint üzerinde çalışırken farklı test türleri uygulanabilir:

* Unit Test
* Integration Test
* E2E Test

Unit test’lerde mock data veya mock repository kullanılır.
Bu sayede business logic izole şekilde test edilmiş olur.

Ancak SQL, index, performans veya join testleri yapılacaksa DB mocklanmaz.
Bu tür problemler yalnızca gerçek veritabanı üzerinde ortaya çıkar.

---

### Business Logic – Database İlişkisi

Business logic database’e bağlı olmamalıdır.
Controller’dan alınan veriler business layer’da işlenir ve database’e gönderilir.
Bu nedenle business layer, controller ile database arasında bir ara katmandır.

Database, business logic’in bir implementasyon detaydır.

---

## Trade-offs

* Ek katmanlar nedeniyle dosya sayısı artar
* Küçük projeler için karmaşık olabilir
* Ancak domain karmaşıklığı arttıkça bu yapı ölçeklenebilirlik sağlar
* Test edilebilirlik ve uzun vadeli bakım avantajı bu maliyeti dengeler

---
