
---
## Load Balancer
Load balancer clientten gelen trafiği arka plandaki birden fazla sunucuya dengeli bir sekilde dağıtan katmandır.
Basit sekilde tanımlayacak olursak tek bir kapıdan giren trafiği, içerdeki birçok çalışana adil sekilde paylastıran görevli.
Horizantal scalingin kalbidir. eğer sisteme 10 tane sunucu eklediğimizde hangi kullanıcının hangi sunucuya gideceğine load balancer karar verir.

## Neden Load Balancer kullanırız?

* Bir sunucu çökerse, Load Balancer bunu fark eder (Health Check) ve trafiği sağlam olan diğer sunuculara yönlendirir. Kullanıcı kesinti yaşamaz.
* Trafik arttığında sisteme yeni sunucular ekleyip Load Balancer'a tanıtabilirsiniz.
* Hiçbir sunucunun aşırı yüklenmemesini, iş yükünün eşit dağılmasını sağlar.
* Yeni sunucu eklemek kolaydır

## Load Balancer Mimarisi
```txt
Client
  ↓
Load Balancer
  ↓
Backend 1
Backend 2
Backend 3
```

## Load Balancer ne iş yapar?

### 1. Trafik dağıtımı

- Her request’i farklı sunucuya yollar

### 2. Health check

- Sunuculara “hayatta mısın?” diye sorar
- Ölü sunucuya trafik göndermez

### 3. Failover

- Bir backend düşerse otomatik devre dışı bırakır

### 4. SSL termination

- HTTPS’i LB çözer
- Backend’ler HTTP olabilir

### 5. Security (kısmen)

- Rate limit
- IP block
- Basic firewall


## Load Balancer Algoritmaları
Trafiği nasıl dağıtacağına karar verirken farklı stratejiler kullanabilir:

1. Round Robin: Sırayla dağıtır. 1. istek A sunucusuna, 2. istek B sunucusuna gider. En basit yöntemdir.
```txt
Req1 → Server1
Req2 → Server2
Req3 → Server3
```
2. Least Connections: O an üzerinde en az aktif bağlantı olan sunucuyu seçer. Uzun süren işlemlerin olduğu senaryolarda daha adildir.

3. IP Hash: Kullanıcının IP adresini baz alarak onu hep aynı sunucuya yönlendirir. (Eğer uygulama tam "Stateless" değilse kullanılır).

4. Weighted (Ağırlıklı) Dağıtım: Eğer sunucularınızdan biri diğerlerinden daha güçlüyse, ona daha fazla trafik (örneğin %70) gönderilmesini sağlayabilirsiniz.
```txt
Server1 (weight 3)
Server2 (weight 1)
```

## Katmanlarına Göre Load Balancer (L4 vs L7)

* Layer 4 (L4) Load Balancer: Sadece IP ve Port bilgisine bakar. Paketin içeriğini (ne verisi var, hangi URL'e gidiyor) bilmez. Çok hızlıdır çünkü veri paketini açmaz.

* Layer 7 (L7) Load Balancer: Paketin içeriğine bakar. Örneğin, /api isteğini farklı sunuculara, /images isteğini farklı sunuculara veya mobil kullanıcıları farklı sunuculara yönlendirebilir. Daha akıllıdır ama daha fazla işlem gücü gerektirir.


## Health Checks (Sağlık Kontrolleri)
* Load Balancer'ın en kritik özelliklerinden biridir. Arkadaki sunuculara sürekli "Orada mısın? Çalışıyor musun?" diye sinyaller gönderir.

* Eğer bir sunucu cevap vermezse, Load Balancer onu "hatalı" olarak işaretler ve trafik göndermeyi durdurur.

* Sunucu düzeldiğinde otomatik olarak trafiği tekrar ona açar.

## Load balancer nerde konumlandırırız?
```txt
Internet
  ↓
CDN
  ↓
Load Balancer
  ↓
App Servers
  ↓
DB
```

- Load balancer, trafiği dağıtarak yüksek erişilebilirlik ve ölçeklenebilirlik sağlar.
- Stateless backend’ler load balancer ile doğal uyumludur.

Modern Bir İstek Trafiği Nasıl Akış İzler?
Bir kullanıcı "www.seninsiten.com" adresine girdiğinde şu adımlar gerçekleşir:
1. İstek Gelir: Kullanıcı isteği Reverse Proxy'ye (örneğin Nginx) çarpar.
2. Güvenlik & SSL: Proxy, SSL sertifikasını kontrol eder ve isteği çözer.
3. Load Balancing: Proxy (veya içindeki Load Balancer modülü), Stateless olan arkadaki 3 sunucudan hangisinin en müsait olduğuna karar verir.
4. Uygulama Katmanı: Seçilen Node.js sunucusu isteği alır. Eğer ağır bir işlemse Worker Threads kullanarak yan yola sapar, değilse Event Loop içinde hızlıca işler.
5. Veri Yönetimi: Eğer kullanıcı girişi gerekiyorsa, sunucu oturum bilgisini kendi RAM'inde değil, merkezi bir Redis'ten kontrol eder (Stateless yapı).
6. Yanıt: Sunucu yanıtı üretir, Reverse Proxy üzerinden kullanıcıya geri gönderilir.

### Reverse Proxy Nedir?
Bir Proxy, istemcinin kimliğini gizleyip internete çıkmanı sağlar. Reverse Proxy ise tam tersini yapar: Sunucuların kimliğini gizler. Dış dünya sadece Reverse Proxy'nin adresini bilir, arkada kaç tane sunucu olduğunu veya hangi IP'de olduklarını bilmez.

## Sticky Sessions 
Her ne kadar biz "Stateless Backend" istesek de, bazen eski tip (Stateful) uygulamaları ölçeklemek zorunda kalabiliriz.
Nedir? Load Balancer'ın, belirli bir kullanıcıyı (örneğin aynı session ID'ye sahip olanı) hep aynı sunucuya yönlendirmesi işlemidir.
Neden Önemli? Eğer veriler Redis gibi merkezi bir yerde değil de sunucunun kendi RAM'indeyse bu özellik hayat kurtarır (ama yatay ölçeklemeyi zorlaştırır).


-> Eğer senin tek bir Load Balancer'ın varsa ve o çökerse, arkadaki 100 sunucun sağlam olsa bile siteye ulaşılamaz.

- Gerçek hayatta "High Availability Load Balancer" yapısı kullanılır. Genelde iki tane Load Balancer olur. Biri çökerse diğeri anında görevi devralır (Floating IP/VRRP teknolojileri ile).

- Eğer 100 tane uygulama sunucusu aynı anda tek bir veritabanına yüklendiğinde, veritabanı "Event Loop Freeze"den daha beter bir duruma düşebilir.
---