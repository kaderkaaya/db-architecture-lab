
---

## Domain Driven Design (DDD)

DDD = yazılımı, işin (business) diliyle ve kurallarıyla modellemek. Aslında burada istediğimiz şey, **kodun işin kendisini anlatmasıdır**. Bu kod ne yapıyor ve niye var sorusunun cevabını burada bulabiliriz. Eğer karmaşıklık yoksa kullanmamalıyız; çünkü pahalıdır. Eğer CRUD uygulaması, basit admin panel gibi işlemler varsa bunu yapmayız.

**DDD’de bazı core kavramlar vardır, bunları bilmeliyiz.**
Peki nedir bu core kavramlar?

### **1. Ubiquitous Language**

→ Business ve developer tarafı aynı kelimeleri kullanmalıdır. Örneğin:

Yanlış: Developer “User table’ına record ekledik” diyor, business tarafı “Müşteri kayıt oldu” diyor.

Doğru: Her iki taraf da “Müşteri Kaydı” (Customer Registration) terimini kullanır. Bu terim kodun içinde de (fonksiyon adı, sınıf adı) aynen geçer.

Şöyle ki:

BU YANLIŞTIR.

```js
calculateSomething()
processData()
handleStuff()
```

BU DOĞRUDUR.

```js
placeOrder()
cancelSubscription()
calculateInvoiceTotal()
```

### **2. Bounded Context**

Büyük bir sistemde bir kelime farklı anlamlara gelebilir. DDD, sistemi mantıksal sınırlara böler. Yani aynı kelime farklı anlamlara geliyorsa **ayrı context**tir.

| Context         | Anlam            |
| --------------- | ---------------- |
| Auth Context    | Kimlik           |
| Billing Context | Fatura sahibi    |
| Support Context | Ticket açan kişi |

* Her context kendi user’ını tanımlar.

### **3. Entity**

Bir kimliği (ID) olan ve zaman içinde değişebilen nesnelerdir.

Örnek: Bir müşteri. Müşterinin ismi değişse de o hâlâ aynı müşteridir (ID aynı kalır).

* Değeri değişir, kimliği değişmez.

### **4. Value Object**

Kimliği yoktur, değeri vardır. Değişmezler (immutable).

Örnek: Para (50 TL). Eğer 50 TL’yi 20 TL ile değiştirirseniz, o artık başka bir paradır. Veya bir adres bloğu.

### **5. Aggregate & Aggregate Root**

Birbirine sıkı sıkıya bağlı nesneler grubudur. Dış dünya sadece Aggregate Root üzerinden bu gruba erişebilir.

```ts
Order (Aggregate Root)
 ├── OrderItem
 ├── Address
```

```ts
order.addItem(productId, quantity)
```

Örnek: Sipariş (Order) ve sipariş kalemleri (OrderItems).
Dışarıdan birisi doğrudan bir kalemi değiştiremez. Önce Order (Root) nesnesine gidilir, hesaplamalar yapılır ve Order üzerinden işlem tamamlanır. Veri tutarlılığı böyle sağlanır.

### **6. Domain Service**

Entity’ye ait olmayan ama domain logic içeren işlerdir. Yani domain içinde önemli bir şey olduğunda fırlatılan hata/olay mesajlarıdır.

Örnek: “SiparişTamamlandı”, “ÖdemeReddedildi”. Bu olaylar diğer sistemleri (Kargo, Fatura) tetikler.

---

## DDD + Clean Architecture

DDD genelde Clean Architecture ile birlikte kullanılır.

1. **Interfaces (User Interface / API):** Dış dünya ile iletişim.
2. **Application Layer:** İş akışını yönetir (transaction yönetimi, DTO dönüşümü). İş mantığı barındırmaz!
3. **Domain Layer:** Sistemin kalbi. Entity, Value Object ve domain logic buradadır.
4. **Infrastructure Layer:** Veritabanı, SMS gönderme, dosya sistemleri gibi teknik detaylar.

```txt
Domain
 ├── Entities
 ├── ValueObjects
 ├── Services
 ├── Events
 ├── Repositories (interface)

Application
 ├── UseCases
 ├── DTOs

Infrastructure
 ├── ORM (Sequelize, TypeORM)
 ├── Repository implementasyonları
```

* Domain kimseye bağlı değildir.
* Infrastructure herkes tarafından kullanılır.
* DDD, karmaşıklığı yönetmek içindir.

---

## DDD vs Layered

| Layered                | DDD                 |
| ---------------------- | ------------------- |
| Anemic model           | Rich domain         |
| Service her şeyi yapar | Entity kuralı taşır |
| DB merkezli            | Domain merkezli     |
| Kolay başlar           | Zor başlar          |

---

## DDD + Microservices

* Her microservice için **1 bounded context** uygulanır.
* Ayrı DB, ayrı domain, event ile haberleşme.
* Ortak entity ve ortak DB yoktur.

---

* Her tablo için bir repository oluşturmamalıyız.
  Sadece **Aggregate Root**’lar için repository oluşturulur.
  Örneğin OrderItem için ayrı bir repository olmaz; ona her zaman Order üzerinden erişilir. Bu, veri bütünlüğünü sağlar.

---
