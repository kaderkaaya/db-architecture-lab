
---

## High Availability Kavramı

High Availability (HA), bir sistemin veya uygulamanın; bileşenlerinden biri (sunucu, veritabanı, ağ cihazı) arızalansa bile kullanıcıya hizmet vermeye devam edebilme kapasitesidir.

* “Sistem düştü mü?” sorusunun cevabını mümkün olduğunca **“hayır”** yapmak.
* HA = downtime’ı minimize etmek.
* Sadece hizmetin erişilebilir olmasını amaçlar.
* High performance değildir.
* Infinite scaling değildir.
* Data loss = 0 demek değildir.

Bizim burada amacımız; kullanıcı güveni, gelir kaybını önleme, SLA ve regülasyonlardır.

---

## Availability nasıl ölçülür?

Availability yüzde (%) ile ölçülür.

```txt
Availability = Uptime / (Uptime + Downtime)
```

---

## High Availability’yi nasıl sağlarız?

### 1. Redundancy (Yedeklilik)

HA’nın kuralı: **Yedeği olmayan her şey bir risk noktasıdır** (Single Point of Failure).

Eğer sisteminizde sadece bir tane load balancer varsa, o bozulduğunda tüm sistem çöker. HA mimarisinde her şeyin en az bir yedeği bulunur.

* **Active-Passive:** Birincil sunucu çalışır, ikincil sunucu “uykuda” bekler. Birincil çökerse ikincil uyanır.
* **Active-Active:** İki (veya daha fazla) sunucu aynı anda çalışır. Trafik aralarında paylaşılır. Biri çökerse diğeri tüm yükü üstlenir.

```txt
Client
 ↓
Load Balancer (x2)
 ↓
App Server (xN)
 ↓
DB (Primary + Replica)
```

---

### 2. Failover

Bir arıza anında trafiğin otomatik olarak yedek sisteme kaydırılmasıdır.

* Primary DB düşer → replica promote edilir
* Trafik otomatik olarak sağlam olana gider
* Manuel müdahale gerekmez

---

### 3. Load Balancer

Trafiği sağlıklı sunuculara dağıtır.

* Trafiği dağıtır
* Health check yapar
* Ölü node’a trafik göndermez

**HA’nin bel kemiğidir diyebiliriz.**

---

### 4. Stateless Application

Stateless backend olmazsa HA yapamayız; çünkü kullanıcı başka bir sunucuya aktarıldığında session düşer.

* Scale ve HA birlikte çalışır
* Sunucu düşse bile kullanıcı etkilenmez

---

### 5. Database High Availability

Bu en kritik katmandır.

* DB ölürse, app ayakta kalsa bile sistem işe yaramaz.
* Kullanılan yöntemler: primary–replica, multi-AZ, automatic failover

---

### 6. Health Checks & Monitoring

Health check’ler olmadan HA yapamayız; çünkü load balancer hangi sunucunun bozuk olduğunu anlayamaz.

* Latency normal mi?
* Service alive mı?
* Response veriyor mu?

Bunlara bakarız.

---

## HA mimarisi nasıl olmalı?

```txt
Internet
 ↓
DNS (Health-aware)
 ↓
Load Balancer (Multi-AZ)
 ↓
App Servers (Stateless, N adet)
 ↓
Cache (Redis Cluster)
 ↓
DB (Primary + Replica)
```

* High availability, sistemin arızalara rağmen hizmet vermeye devam etmesidir.
* HA’nın ilk adımı single point of failure’ları ortadan kaldırmaktır.
* Stateless uygulamalar HA ve scaling için idealdir.
* Failover otomatik olmalıdır; manuel failover HA değildir.
* Reverse proxy ve load balancer yedekli değilse, gerçek bir HA mimarisinden bahsedemeyiz.

---

**High Availability:** Bir hata olduğunda sistem çok kısa bir süreliğine (saniyeler içinde) kesintiye uğrayabilir ama hızla toparlar.
**Fault Tolerance:** Sıfır kesinti demektir. Genelde donanım seviyesinde tam eşzamanlı yedekleme gerektirir ve çok maliyetlidir.

---

| Konsept           | Amaç                      |
| ----------------- | ------------------------- |
| High Availability | Sistemin ayakta kalması   |
| Scalability       | Yük altında büyüyebilmesi |

HA’yı **“the nines”** ile ölçeriz; yani yıl içindeki çalışma süresi (uptime) yüzdesiyle ifade ederiz.

---