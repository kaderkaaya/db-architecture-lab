
---

## Event Driven

Bu bir kütüphane değil, bir mimari yaklaşımdır. Kodun “akışını” değil, sistemdeki “değişimleri” (olayları) yönetirsin.

* Servisleri birbirinden bağımsız (decoupled) hâle getirmek için kullanılır. Bir kullanıcı ödeme yaptığında, “Ödeme Servisi” gidip “Stok Servisi”ne haber vermek zorunda kalmamalıdır. Sadece ortaya bir mesaj fırlatır: **ORDER_COMPLETED**.
* Eğer kullanmazsak spaghetti code oluşur. Bir özelliği değiştirmek için 10 farklı dosyaya dokunman gerekir. Sistem büyüdükçe yönetilemez hâle gelir.
* Farklı servisler içinde Redis Pub/Sub, RabbitMQ veya Kafka gibi araçlarla servisler birbirine mesaj atar.
* Event geçmiş zamandır, geri alınamaz.

### Monolith

```txt
OrderService → EmailService
OrderService → InvoiceService
OrderService → NotificationService
```

### Event-Driven

```txt
OrderPaid EVENT
 ├─ EmailService
 ├─ InvoiceService
 └─ NotificationService
```

**Producer**
Event’i yayınlayan.
User Service → UserRegistered

**Broker**
Event’i taşıyan.
Kafka
RabbitMQ
Redis Streams
AWS SNS / SQS

**Consumer**
Event’i dinleyen.
Email Service listens UserRegistered

* Aslında event-driven mantığında “şunu yap” demiyoruz, “şu oldu” diyoruz ve farklı servislere bilgi veriyoruz. Bu bilgi verme işlemini de Redis, Kafka gibi araçlarla yapıyoruz.

### Normalde (command-based)

```txt
Kullanıcı kayıt oldu
→ Mail gönder
→ Hoş geldin bildirimi at
→ Log yaz
```

Ama aslında olması gereken:

```txt
UserRegistered (EVENT)
```

Daha sonra:

* Mail servisi: Ben bunu dinlerim.

* Notification servisi: Ben de dinlerim.

* Log servisi: Ben de dinlerim.

* User servisi: Ben eventi attım, gerisi beni ilgilendirmez.

* UserService → UserRegistered EVENT

| API (command) | Event              |
| ------------- | ------------------ |
| Şunu yap      | Bu oldu            |
| Cevap bekler  | Cevap yok          |
| Senkron       | Asenkron           |
| Kontrol sende | Kontrol dinleyende |

### Peki ne zaman kullanırız?

* Bir olaydan sonra birden fazla iş yapılacaksa:

```txt
Sipariş ödendi
→ Mail
→ Fatura
→ Stok düş
→ Bildirim
OrderPaid EVENT
```

* Asenkron ve yavaş işler varsa (mail, PDF, video gibi)
* Gelecekte yeni işler eklenecekse

Eğer:

* Tek iş varsa
* Yan etki yoksa
* Basit CRUD ise:

```txt
Ürün ekle
Ürün sil
Ürün güncelle
```

* Sonucu anında bilmem gerekiyorsa (örneğin login oldu mu, ödeme başarılı mı). Çünkü kullanıcı bekliyor.
* Tek bir iş yapılacaksa (örneğin profili güncelle). Mail yok, bildirim yok, log bile ayrı değilse.
* Küçük, tek servislik uygulama ise **KULLANMA**.
* Transaction gerekiyorsa:

```txt
Para düş
Siparişi onayla
```

Bu iki işlemi birlikte yapmamız gerekiyorsa ACID gerekir ve event-driven tehlikelidir.

| Soru                        | Cevap | Ne kullanılır |
| --------------------------- | ----- | ------------- |
| “Bunu yap” mı diyorsun?     | Evet  | API           |
| “Bu oldu” mu diyorsun?      | Evet  | Event         |
| Sonucu hemen bilmeli miyim? | Evet  | API           |
| Cevap umurumda değil mi?    | Evet  | Event         |
| Kullanıcı bekliyor mu?      | Evet  | API           |
| Arka plan işi mi?           | Evet  | Event         |

### Örnek: Sipariş ödeme

**POST /pay**

API:
**Ödeme başarılı mı?**
Kullanıcıya cevap verilir.

Sonra:
**OrderPaid EVENT**

Event ile:

* Mail
* Fatura
* Kargo

```txt
Bu işin sonucunu hemen bilmem gerekiyor mu?
│
├─ EVET → API
│
└─ HAYIR
    │
    ├─ Birden fazla şey tetiklenecek mi?
    │   ├─ EVET → EVENT
    │   └─ HAYIR → API
```

Kullanıcı giriş yaptıktan sonra, yani kullanıcıya başarılı sonucunu döndükten sonra:

```js
await eventQueue.add('user.logged_in', {
  userId: user.id,
  ip: req.ip
});
```

```js
new Worker('events', async job => {
  if (job.name === 'user.logged_in') {
    await updateLastLogin(job.data.userId);
    await writeAudit(job.data);
  }
});
```

Event içinde API çağrısı yapılır ama:
!!!!!! Karar vermek için değil
!!!!!! Yan etki üretmek için

```txt
Client
  ↓
API (decision maker)
  ↓
DB commit
  ↓
EVENT emit
  ↓
Event handler → API calls (side effects)
```

```js
eventBus.on('order.paid', async () => {
  await sendMail();
});
```

```js
eventBus.on('order.paid', () => {
  mailQueue.add({ orderId });
});
```

Burada bunun yerine **queue’ya eklemeliyiz**.

* Fire-and-forget yaparız ama kontrollü bir şekilde.

```
**********************
Event = beyin
WebSocket = hoparlör
**********************
```

---

## WebSockets

HTTP protokolü “çekme” (pull) mantığıyla çalışır; yani istemci sormadan sunucu cevap veremez. WebSocket ise “itme” (push) mantığıdır. Bir kez el sıkışma (handshake) gerçekleştikten sonra bağlantı açık kalır.

**Handshake:** HTTP üzerinden başlar, sunucu “tamam, artık WebSocket konuşalım” derse protokol değişir (Upgrade).

**Rooms & Namespaces:** Binlerce kullanıcıdan sadece “X maçını izleyenler” odasına mesaj göndermeni sağlar.

Eğer kullanmazsak, yeni veri gelip gelmediğini anlamak için her saniye API’ye istek atmak zorunda kalırız (polling). Bu, sunucuyu binlerce gereksiz istekle boğar ve devasa bir gecikmeye (latency) neden olur.

* Node.js kullanıyorsak en popüler araç **socket.io**’dur. Bu sadece mesaj göndermeyi değil, otomatik tekrar bağlanmayı da yönetir.
* WebSocket = Client ile server arasında sürekli açık bir bağlantı

| HTTP               | WebSocket                         |
| ------------------ | --------------------------------- |
| Request → Response | Sürekli bağlantı                  |
| Client başlatır    | Client **ve** server başlatabilir |
| Pull (sorarak)     | Push (iterek)                     |
| Stateless          | Stateful (connection var)         |

* WebSocket kullanırız çünkü bazı senaryolarda “sorayım mı?” değil, “haber ver” isteriz.

HTTP ile:

```txt
5 saniyede bir:
GET /notifications
GET /notifications
GET /notifications
```

Ama WebSocket ile:
→ Bir şey olunca → push

→ WebSocket’in aslında görevi backend’deki event’i anında frontend’e taşımaktır.

```txt
OrderPaid EVENT
→ WebSocket
→ Client ekranı güncellenir
```

→ WebSocket event producer değildir,
event consumer + publisher gibidir.

```txt
Client (Browser)
   ⇄ WebSocket Connection
Server (Node.js)
   ⇄ Event / Queue / DB
```

```js
// SERVER
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (msg) => {
    console.log('Client:', msg.toString());
  });

  ws.send(JSON.stringify({ type: 'WELCOME' }));
});

// CLIENT
const socket = new WebSocket('ws://localhost:8080');

socket.onmessage = (event) => {
  console.log('Server:', event.data);
};

socket.onopen = () => {
  socket.send('hello server');
};

// EVENT
eventBus.on('order.paid', (e) => {
  const ws = userConnections.get(e.userId);
  ws?.send(JSON.stringify({
    type: 'ORDER_PAID',
    orderId: e.orderId
  }));
});
```

```
********************************
NE ZAMAN WEBSOCKET KULLANMAYIZ?
CRUD işlemleri
Form submit
Payment
Admin panel data fetch
Kullanıcı login olduğunda
********************************
```

```
HTTP → “Yap”
Event → “Oldu”
WebSocket → “Haber ver”
```

```
HTTP = Kapıyı çalıp sormak
“Kargom geldi mi?”
WebSocket = Kapıcı
“Gelince ben sana söylerim.”
```

### Ne zaman WebSocket kullanırız?

* Chat
* Notification
* Canlı sayaç
* Online/offline durumu
* Sipariş durumu

Hayal et: 100.000 kişi lansman sayfasında bekliyor.
WebSocket ile stok 100’den 99’a düştüğü an, tüm açık sekmelerde “Kalan Stok” sayısı anında güncellenir. Sayfayı yenilemeye gerek yoktur. Bu, kullanıcıda aciliyet hissi ve güven yaratır.

Event-Driven → Ödeme başarılı olduğunda:

* PaymentSuccess olayı fırlatılır.
* Stok servisi bunu duyar ve DB’yi günceller.
* WebSocket servisi bunu duyar ve herkese “1 adet daha satıldı!” bilgisini gönderir.
* BullMQ bunu duyar ve faturayı hazırlar.

Sunucun çok yüklendi ve 3 adet Node.js sunucusu açtın (load balancer).
A sunucusuna bağlı kullanıcı, B sunucusuna bağlı kullanıcıya nasıl mesaj gönderir?

Sunucular birbirini görmez. Bu yüzden araya bir Redis Adapter (Pub/Sub) koyarız. Bir sunucu mesaj yayınladığında Redis bunu diğer tüm sunuculara dağıtır. Böylece kullanıcı hangi sunucuda olursa olsun mesajı alır.

### Mesaj Atma Yöntemleri

**A. Point-to-Point (Kuyruk Modeli)**
Mesaj bir kuyruğa atılır ve sadece bir alıcı tarafından işlenir.
Örnek: “Fatura oluştur” mesajı. Bu işi sadece bir fatura servisi yapmalıdır; aksi takdirde kullanıcıya iki fatura kesilir.
Araç: RabbitMQ bu konuda çok yeteneklidir.

**B. Publish / Subscribe (Yayın Modeli)**
Mesaj bir “topic”e atılır ve o konuyu dinleyen herkese kopyalanır.
Örnek: “Sipariş alındı” olayı. Bunu stok servisi, mail servisi ve lojistik servisi aynı anda duymalıdır.
Araç: Redis Pub/Sub veya Kafka.

| Araç          | Çalışma Mantığı                                                                                                      | Ne Zaman Kullanılır?                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Redis Pub/Sub | “At ve Unut” (Fire and Forget).<br>Mesajı atar, o an dinleyen yoksa mesaj kaybolur.                                  | Çok hızlı, anlık bildirimler veya WebSocket senkronizasyonu için.                 |
| RabbitMQ      | “Akıllı Aracı”.<br>Mesajları diske yazabilir, alıcı onay verene kadar saklar (Ack/Nack).                             | Karmaşık yönlendirme kuralları ve garanti teslimat gereken işler için.            |
| Kafka         | “Devasa Bir Günlük (Log) Dosyası”.<br>Mesajlar silinmez, sırayla dizilir. Servisler geçmişe dönüp tekrar okuyabilir. | Milyonlarca veri akışı, büyük veri ve olay sırasının kritik olduğu durumlar için. |

```
************************
Client → POST /login
Server → OK
Event → user.loggedIn
WebSocket → “Hoş geldin”
************************
```

Event-driven:

```txt
Event oluşur (backend)
↓
WebSocket push
↓
Frontend anında güncellenir
```

> HTTP ile sorarsın
> WebSocket ile haber alırsın

---
