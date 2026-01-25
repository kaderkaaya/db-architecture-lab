
---

## Stateless Backend

### Stateless nedir?

Stateless, bir sunucunun istemciden (client) gelen her isteği, önceki isteklerden bağımsız bir “ilk mesaj” gibi kabul ettiği mimari yaklaşımdır. Sunucu, kullanıcıya dair oturum bilgilerini veya geçiş süreçlerini kendi hafızasında (RAM) tutmaz. Stateless bir sistemde, her istek (request) işlemin tamamlanması için gereken tüm bilgiyi kendi içinde barındırmalıdır.

* Sunucu, client hakkında önceki isteklerden hiçbir bilgi tutmaz.
* Her request tek başına anlamlıdır.

---

### Stateful

Sunucu “Ahmet giriş yaptı, onun sepetinde 3 ürün var” bilgisini kendi hafızasında saklar. Ahmet ikinci isteği gönderdiğinde sunucu onu hatırlar.

* Sunucu kullanıcıya ait state tutar
* Sunucu ölürse → session gider
* Load balancer başka bir sunucuya atarsa → kullanıcı düşer

---

### Stateless

Sunucu Ahmet’i tanımaz. Ahmet her istekte kendine ait bir kimlik kartı (genelde JWT – JSON Web Token) gönderir. Sunucu bu karta bakar, “Evet, bu Ahmet; yetkisi var” der ve işlemi yapar, sonra Ahmet’i tekrar unutur.

* Sunucu hiçbir kullanıcı state’i tutmaz
* Gerekli her şey request içinde gelir
* Sunucu ölse bile sistem çalışır

---

## Stateless backend nasıl çalışır?

Bir request düşün:

```js
GET /orders
Authorization: Bearer eyJhbGciOi...
```

Sunucu şunları yapar:

* Token’ı alır
* Token’ı doğrular
* User kim → DB’den bakar
* Cevap döner
* Hiçbir şey saklamaz

**Request bitti = her şey bitti.**

---

## Stateless Mimaride Veri Nerede Tutulur?

### 1. İstemci Tarafında (Client-Side)

Kullanıcının kimlik ve yetki bilgileri, şifrelenmiş bir JWT içinde saklanır ve her istekte header üzerinden sunucuya gönderilir.

### 2. Merkezi Veritabanında (External Store)

Eğer bir durumun (state) mutlaka sunucu tarafında tutulması gerekiyorsa, bu bilgi sunucunun içinde değil; tüm sunucuların erişebildiği merkezi bir Redis veya Memcached gibi hızlı bir veritabanında saklanır.

---

Stateless en çok **horizontal scaling**’de kullanılır.
Yani 1 sunucu yetmediğinde 10 tane açılır; hepsi aynı şekilde çalışır. Load balancer fark etmez, hiçbir sıkıntı çıkarmaz.

* **Stateful**

```js
req.session.user = user
```

* **Stateless**

```js
Authorization: Bearer <JWT>
```

---

* Stateless backend’te her request bağımsızdır.
* Sunucu client state’i tutmaz; bu da horizontal scaling’i kolaylaştırır.
* JWT ve external storage, stateless mimarinin temel taşlarıdır.
* Stateless mimari cloud-native sistemler için idealdir.

---

### Kısa Özet

* Stateless = server state tutmaz
* Her request bağımsızdır
* JWT / DB / Redis kullanılır
* Scale, cloud ve microservice mimarileri için idealdir
* Modern backend’lerin default yaklaşımıdır

---

## Stateful vs Stateless Karşılaştırma

| Özellik                 | **Stateful (Geleneksel)**             | **Stateless (Modern / REST)**     |
| ----------------------- | ------------------------------------- | --------------------------------- |
| **Oturum bilgisi**      | Sunucu belleğinde (Session)           | İstemcide (JWT/Token) veya Redis  |
| **Ölçekleme**           | Zordur (Sticky Session gerekir)       | Çok kolaydır                      |
| **Bağımlılık**          | İstemci belirli bir sunucuya bağlıdır | İstemci her sunucuya gidebilir    |
| **Sunucu çökmesi**      | Kullanıcı oturumu kaybolur            | Etkilenmez                        |
| **Load Balancer**       | Özel ayar gerekir                     | Direkt çalışır                    |
| **Cloud / K8s uyumu**   | Kötü                                  | Çok iyi                           |
| **Karmaşıklık**         | Başlangıçta kolay                     | Tasarımda daha fazla dikkat ister |
| **Modern mimari uyumu** | Düşük                                 | Yüksek                            |

**Stateful:** Kolay başlar, zor ölçeklenir
**Stateless:** Doğru tasarlanırsa sorunsuz büyür

---

## Stateful Backend – Örnek

```js
import session from "express-session";

app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: true
}));

app.post("/login", (req, res) => {
  req.session.userId = 42;
  res.send("Logged in");
});

app.get("/profile", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("Unauthorized");
  }
  res.send(`User ${req.session.userId}`);
});
```

---

## Stateless Backend – Örnek

```js
import jwt from "jsonwebtoken";

app.post("/login", (req, res) => {
  const token = jwt.sign(
    { userId: 42 },
    "secret",
    { expiresIn: "1h" }
  );
  res.json({ token });
});

app.get("/profile", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  const payload = jwt.verify(token, "secret");
  res.send(`User ${payload.userId}`);
});
```

Burada:

* Sunucu hiçbir şey saklamaz

Her request’te:

* Token gelir
* Doğrulanır
* İş biter

---

## WebSocket neden stateful?

```js
const clients = new Map();

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    // Server memory’de state tutuyor
    clients.forEach(client => {
      client.send(msg);
    });
  });

  clients.set(ws, true);
});
```

**Neden stateful?**

* Açık bağlantılar memory’dedir
* Kullanıcının hangi socket’e bağlı olduğu bilinir
* Sunucu ölürse tüm bağlantılar kopar

---

## WebSocket Chat Nasıl Scale Edilir?

```txt
Client
  ↓
Load Balancer
  ↓
WS Server 1 ─┐
WS Server 2 ─┼─ Redis Pub/Sub
WS Server 3 ─┘
```

* Mesaj Redis Pub/Sub’a gider
* Diğer server’lar dinler
* Kendi client’larına iletir

WebSocket kendisi stateful’dır,
ama distributed architecture ile yönetilir.

---

## WebSocket + Stateless Birlikte Olur mu?

| Katman               | Durum           |
| -------------------- | --------------- |
| REST API             | Stateless       |
| Auth                 | JWT (Stateless) |
| WebSocket Connection | Stateful        |
| Message dağıtımı     | Redis / Kafka   |

**WebSocket stateless değildir:**
WebSocket stateless değildir. Kalıcı bağlantı kullandığı için doğası gereği stateful’dır. Bu yüzden ölçeklenmesi için Redis Pub/Sub veya bir message broker gerekir.

---
