
---

## Use Case Patterns

Şimdi nedir bu **Use Case Patterns**? Yazılımın ne yapması gerektiğini belirlerken, karmaşık iş süreçlerini standart, modüler ve anlaşılır parçalara bölmek için kullanılan tasarım yaklaşımlarıdır. “Kullanıcı giriş yapar” demek yerine, bu işlemin farklı senaryolarda nasıl davranacağını organize eder.

* Uygulamanın iş kurallarını framework, DB ve HTTP’den ayırma işlemidir.

**Use Case = uygulamanın bir iş senaryosunu temsil eden sınıf / fonksiyon**

* Use case; controller, repository ya da service değildir. Tek iş yapar ve tek senaryoya odaklanır.

```txt
HTTP (Express)
 ↓
Controller
 ↓
Use Case  ASIL İŞ BURADA
 ↓
Repository (interface)
 ↓
DB (implementation)
```

| Service              | Use Case               |
| -------------------- | ---------------------- |
| Genel                | Senaryo bazlı          |
| Karışık sorumluluk   | Tek sorumluluk         |
| Reusable ama bulanık | Net ve test edilebilir |

Use case kullanırken şu hataları yapmamalıyız:

* Use case içine `req`, `res` koymak

* DB query yazmak

* Bir use case’te 5 iş yapmak

* Service adı altında her şeyi toplamak

* Use Case Pattern, uygulamanın iş senaryolarını framework ve altyapıdan ayırarak daha temiz, test edilebilir ve ölçeklenebilir bir yapı sağlar.

* Use case pattern’in temel bileşenleri vardır. Bunlar:

  * **Actor (Aktör):** Sistemle etkileşime giren kişi veya dış sistem (Örn: Müşteri, Admin, Banka API’si).
  * **System Boundary (Sistem Sınırı):** Uygulamanın neyi kapsadığını belirleyen çerçeve.
  * **Use Case:** Aktörün sistemde gerçekleştirmek istediği spesifik hedef.

### Bazı Use Case Kalıpları

**A. Inclusion Pattern (Dahil Etme - <<include>>)**
Bir use case’in çalışması için mutlaka başka bir use case’e ihtiyaç duyduğu durumdur. Kodlamadaki “fonksiyon çağırmaya” benzer.
Örnek: “Sipariş Ver” ve “Ödeme Yap”. Sipariş vermek için ödeme yapılması zorunludur.
Faydası: Ortak adımları (Örn: login kontrolü) tekrar tekrar yazmak yerine tek bir merkezi use case’e toplar.

**B. Extension Pattern (Genişletme - <<extend>>)**
Bir use case’in sadece belirli koşullar oluştuğunda ek adımlar çalıştırmasıdır. İsteğe bağlıdır.
Örnek: “Ürün Satın Al” ana senaryodur. Eğer kullanıcının bir “Kupon Kodu” varsa, “İndirim Uygula” use case’i devreye girer.
Faydası: Ana senaryoyu karmaşıklaştırmadan opsiyonel özellikleri eklemeyi sağlar.

**C. Generalization Pattern (Genelleme / Kalıtım)**
Bir use case’in farklı türleri olduğunda kullanılır. Nesne yönelimli programlamadaki (OOP) kalıtıma benzer.
Örnek: “Ödeme Yap” genel bir durumdur. “Kredi Kartı ile Öde” ve “Nakit Öde” bunun özel alt türleridir.

### Mimari Katmanlarda Use Case Pattern

* **Request Model:** Kullanıcıdan gelen ham veri (input).
* **Interactor:** Asıl iş mantığının döndüğü yer. Veritabanından bağımsızdır. “Eğer bakiye yeterliyse, hesaptan düş ve onay ver” kuralı buradadır.
* **Response Model:** İşlem sonucunda dış dünyaya dönen veri (output).

### Örnek: ATM Sistemi

* **Ana Senaryo:** “Para Çek”

* **Include:** Para çekmek için “Kart Şifresi Doğrula” işlemini içermek zorundadır.

* **Extend:** Eğer para çekme tutarı limitin üzerindeyse, “Ek Onay Al” adımı genişletilebilir (opsiyonel).

* **Generalization:** “Para Çek” ana bir mantıktır; “QR ile Çek” veya “Kartla Çek” bunun yollarıdır.

* Eğer use case pattern kullanmazsak kodumuz spagettiye dönüşür. UI katmanına veya veritabanı katmanına sızar.

---


