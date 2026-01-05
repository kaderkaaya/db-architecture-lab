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

```txt
Bu durunda atomic update'i seçerim çünkü 100.000 istek gelecek ve bu durumda sistemimin hızlı olması gerekiyor eğer pessimistici seçmiş olsaydım her kullanıcı için kilitleme yapacaktı ve kullanıcı bir diğer kullanıcıyı beklemis gibi olacaktı ve bu da bizim prestijimiz açısından kötü olacaktı ama atomic update ile bunu çözebilirim söyle ki 100.000 kişi aynı anda gelse bile veritabanı bunları sıraya koyar ve stok 0 olduğunda artık hiçbir satırı güncellemez. Böylece prestijin korunur ve eksiye düşmeyiz. Peki optimistic neden olmaz çünkü her kullanıcıda version numarası değiştirmek ozrunda kalacaktım ve ilk kullanıcıda version = 1.1 yaptım diyelim bu durumda kalan 99.999 kullanıcıya version değişti hatası verip tekrar deneyin diyebilirdi bu durumda dbye attığım istek 100.000 den 600 binlerene çıkabilirdi ve bu durumda Db'miz çökerdi. 
Atomic update ile çok hızlı bir sekilde çalışır ve stok = 0 olduğunda ürünümüz bitti diye bir hata vererek böylece halledebilirdik.
```

#### 2. Performans ve Filtering

Kullanıcılar ürünleri fiyata veya numaraya göre filtreleyip sıralayacak. Veritabanının bu yük altında "Filesort" yapıp kilitlenmemesi için nasıl bir **Indexing** stratejisi kurarsın?

```txt
Bu durumda ilk olarak explain ile tablonun query ile nasıl çalıştığına bakarım daha sonra eğer tablo full table scan yapıyorsa composite index yaparım yani bir tabloda hem numaraya göre hemde fiyata göre(size, price) index eklerim bu durumda kullanıcı sort yaptığında her iki durumda da sort yapabilir ve bu benim Db performansım açısından çok iyi olur.Hala prestijimizi koruyoruz.
```

#### 3. Güvenlik ve Hız Sınırı (Security & Rate Limiting)

Botların saniyede binlerce istek atarak gerçek insanların önüne geçmesini nasıl engellersin? Hangi **Security Headers** veya kütüphaneleri kullanırsın?

```txt
Bu durumda brute-force'den korumak için eğer bii,m bir satın alma endpointimiz varsa ve kullanıcıya ait ip adresimiz varsa ve kullanıcıya ait ip adresinden birden fazla satın almaya tıklanıyorsa Rate Limit(express-rate-limit) ekleyerek bu kullanıcının saldırısını engellerim.(yani burda limiti ben belirlerim kaç kere tıklaması gerektiğini)
```

#### 4. Observability (İzleme)

Sistem o an dar boğaza girerse (Örneğin ödeme API'si yavaşlarsa), bunu anında nasıl fark edersin? Hangi **Monitoring** sinyallerine (Altın Sinyaller) alarm kurarsın?

```txt
buna bir daha bakacağım monitoring anlamamısım demek ki :(
```

#### 5. Testing

Bu kritik lansmandan önce sistemin patlamayacağından emin olmak için hangi **Test** türüne ağırlık verirsin? Gerçek veritabanı mı yoksa Mock mu kullanırsın?

```txt
Ben burda bütün testleri yaparım abiiii çünkü unit testi yaptığımızda hem hatamızı erken fark ederiz hemde kodumuzun güvenirliğini test etmis oluruz burda mock data kullanarak test ettiğimiz için integration test ile de test dbsi olusturup bir ödeme testi yaparım çünkü bir ödeme endpointinde birden fazla fonksiyon ile çalışabiliyoruz bu durumda bu fonksiyonların işleyisine ve hatalarımızı fark etmemizi sağlarız. E2E testide bizim test uygulamamızda payment için verilmiş test kartımızla uyguladan test etmemiz gerekiyorsa uygulamadan ya da webden test etmem gerekiyorsa webden daha önce hiç kullanmamıs bir kullanıcı gibi bastan sona test etmemiz gerekir. Böylece kullanıcıların karşılastığı hata ile biz karşılaşmıs oluruz ve bu hatayı düzeltmis olabiliriz. Prestijimize zarar gelmez :)
```

---
