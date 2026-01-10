
---

## Layered Architecture vs Monolith

Monolith, uygulamanın nasıl paketlenip dağıtıldığı (deployment) ile ilgiliyken; Layered Architecture, kodun iç yapısının nasıl organize edildiği ile ilgilidir. Sıklıkla bir arada kullanılır ama farklı kısımları temsil eder.

* Layered Architecture teknik ayrım yapar, Modular Monolith domain ayrımı yapar.
* Microservice’e geçmeden önce Modular Monolith tercih etmeliyiz.
* Modular Monolith, büyük sistemlerde karmaşıklığı kontrol altında tutar.

---

## Layered Architecture

```scss
Controller (API / UI)
↓
Service (Business Logic)
↓
Repository (Data Access)
↓
Database
```

### Peki bu katmanlar nelerdir?

**Presentation Layer (Sunum Katmanı):**
Kullanıcı arayüzü (UI) veya API uç noktaları. Kullanıcıyla etkileşime girer.

**Application Layer (Uygulama Katmanı):**
Katmanlar arası koordinasyonu sağlar, iş mantığına giden yolu yönetir.

**Business Logic Layer (İş Mantığı / Domain):**
Uygulamanın kalbidir. Hesaplamalar, kurallar ve asıl iş burada döner.

**Data Access / Persistence Layer (Veri Erişimi):**
Veritabanı ile konuşan katmandır (SQL sorguları vb.).

* Burada bizim için en önemli kural: üstteki katman alttakini bilebilir ama alttaki katman üsttekini bilemez.
* Layered katmanda:

  * Service, Repository çağırabilir.
  * Controller, Service çağırır.
  * Repository, başka repository çağırmaz.

Order Service içinde:

```js
class OrderService {
  constructor(
    private userRepo: UserRepository,
    private productRepo: ProductRepository,
    private paymentService: PaymentService
  ) {}
}
```

Bunların hepsini çağırabiliriz ama sağlıklı değilmiş.

---

## Monolith nedir peki?

* Monolith = tek deploy.
* Domain’i modül bazlı bölebiliriz.
* Monolith, bir uygulamanın tüm bileşenlerinin (UI, iş mantığı, veri erişimi) tek bir kod tabanında toplandığı ve tek bir birim olarak derlenip yayına alındığı yapıdır.
* Uygulama tek bir `.exe`, `.jar` veya `.war` dosyasıdır.
* Tüm fonksiyonlar aynı hafızayı (RAM) ve işlemciyi (CPU) kullanır.
* Genellikle tüm uygulama tek bir veritabanına bağlanır.
* Geliştirmesi, test etmesi ve yayına alması kolaydır.
* Tüm kod tek bir yerde olduğu için hataları takip etmek daha basittir.
* Sadece yoğun kullanılan bir özelliği ölçeklemek için tüm uygulamayı çoğaltmanız gerekir.
* Kodun bir yerindeki hata (örn. bellek sızıntısı) tüm sistemin çökmesine neden olabilir.

```psql
/modules
  /order
    order.controller.ts
    order.service.ts
    order.repository.ts
    order.entity.ts

  /user
    user.controller.ts
    user.service.ts
    user.repository.ts

  /payment
```

Burada her modül:

* Kendi controller’ına sahiptir.

* Kendi service ve repository’sine sahiptir.

* Dışarıya sadece public API açar.

* Modüller birbirinin içini bilmez.

* Microservice düşünüyorsak önce Modular Monolith yapmalıyız.

---

## Karşılaştırma

| Özellik              | Layered       | Modular Monolith |
| -------------------- | ------------- | ---------------- |
| Ayırma               | Teknik        | Domain           |
| Bağımlılık           | Zayıf kontrol | Sıkı kontrol     |
| Ölçeklenebilirlik    | Düşük         | Yüksek           |
| Test edilebilirlik   | Orta          | Yüksek           |
| Microservice’e geçiş | Zor           | Kolay            |

---

## Monolith vs Layered

| Özellik           | Monolith                                | Layered                                      |
| ----------------- | --------------------------------------- | -------------------------------------------- |
| Odak Noktası      | Uygulamanın paketlenme şekli            | Kodun mantıksal ayrımı (SoC)                 |
| Ölçeklenebilirlik | Tüm uygulama birlikte ölçeklenir        | Katmanlar bağımsız ölçeklenemez              |
| Bağımlılık        | Fiziksel olarak tek bir süreç (process) | Mantıksal olarak katı hiyerarşi              |
| Hata Yönetimi     | Bir hata tüm uygulamayı etkileyebilir   | Hatalar belirli katmanlarda izole edilebilir |

---