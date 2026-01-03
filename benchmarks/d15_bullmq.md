
---

## BullMQ

Bakacağımız bir diğer konu **BullMQ**. Nedir bu BullMQ? Kullanıcıyı bekletmemesi gereken, zaman alan ve retry gerektiren işlemlerdir.

* Kullanıcıyı bekletmemeliyim ama bu işi de yapmalıyım dediği noktada devreye girer. Node.js dünyasında bu işin standardı BullMQ’dur.
* Eğer ağır bir işlemi (dosya yüklemek, video işleme ya da binlerce posta gönderme gibi) direkt API içinde yaparsak: Kullanıcı 10 sn sonra gidebilir. Node.js single thread olduğu için ağır bir işlem o an gelen tüm istekleri durdurur.
* E-posta gönderirken hata olursa, o iş kaybolur. BullMQ ise hata olursa **Retry** (Tekrar Dene) mekanizması sunar.

Neden BullMQ Kullanırız?

* Redis tabanlı
* At-least-once delivery
* Retry / backoff
* Delayed jobs
* Rate limit
* Worker separation

olduğu için kullanırız.

Mimari:
API Server → Queue (Redis) → Worker

**Producer: Job ekler**
**Queue: Redis**
**Worker: Job’u işler**

| Kavram     | Ne yapar            |
| ---------- | ------------------- |
| Queue      | Job ekleme          |
| Worker     | Job işleme          |
| Job        | Bir iş              |
| Retry      | Hata sonrası tekrar |
| Delay      | Zamanlı job         |
| Backoff    | Retry aralığı       |
| Rate limit | Job hız limiti      |

Peki nasıl çalışır **Producer, Worker ve Queue**?
BullMQ gücünü Redis’ten alır ve:

Producer: API içindeki koddur. “Şu kullanıcıya hoş geldin maili atılacak” der ve işi kuyruğa ekler.
Redis (Queue): İşlerin (Job) depolandığı yerdir. Kuyruğu yönetir; hangi iş sırada bekliyor, hangisi bitti tutar.
Worker: Arka planda sessizce çalışan koddur. Kuyruğa bir iş geldiğinde onu yakalar ve gerçek işlemi (mail atma vb.) yapar.

Bilinmesi gereken özellikler:

Retries (Tekrar Deneme): Eğer mail servisi o an kapalıysa, BullMQ’ya “Bu işi 5 dakika sonra tekrar dene, toplam 3 hakkın var” diyebilirsin.

Delayed Jobs (Gecikmeli İşler): “Bu işi kullanıcı kayıt olduktan 24 saat sonra yap” diyebilirsin.

Priorities (Önceliklendirme): “VIP kullanıcıların mailleri, ücretsiz kullanıcıların önünde gitsin” diyebilirsin.

Concurrency (Eşzamanlılık): Bir Worker aynı anda kaç işi işlesin? (Örn: 5 video işleme işini aynı anda yap).

Eğer kullanmazsak ne olur?

* Kullanıcı bir butona bastığında sistemin cevabı çok geç gelir.
* Sunucuya aynı anda 10 kişi ağır bir işlem (örneğin rapor oluşturma) yaptırırsa CPU %100 olur ve sistem çöker.
* İşlem yarıda kalırsa (server restart olursa) o veri kaybolur. BullMQ’da ise işler Redis’te olduğu için sistem açılınca kaldığı yerden devam eder.

```js
// 1. Kuyruğu Tanımla (Producer tarafı)
const myQueue = new Queue('mail-queue', { connection: redisConnection });

// 2. İşi Kuyruğa Ekle
await myQueue.add('welcome-email', { userId: 1, email: 'test@test.com' }, {
  // retry
  attempts: 3, // Hata olursa 3 kez dene
  backoff: 5000 // Denemeler arası 5 saniye bekle
});

// 3. Worker'ı Tanımla (İşi yapan taraf)
const worker = new Worker('mail-queue', async job => {
  // mail gönderme
  console.log(`Sending email to ${job.data.email}`);
}, { connection: redisConnection });
```

**E-commerce API’de kendi yazdığım örnekte:**

```js
// queue.js
import { Queue } from 'bullmq';
export const orderQueue = new Queue('orderQueue', { connection: { host: 'localhost', port: 3003 } });

// timeout-worker.js
import { Worker } from 'bullmq';
import OrderService from './order.js';
const worker = new Worker(
    'orderQueue',
    async (job) => {
        const { orderId } = job.data;

        await OrderService.cancelIfNotPaid({ orderId });
    },
    {
        connection: { host: 'localhost', port: 3003 }
    }
);
```

* Redis kullanırız çünkü Redis çok hızlıdır (in-memory) ve **atomic operations** yapabilir. Birden fazla Worker aynı anda kuyruğa eriştiğinde, bir işin iki kez yapılmasını (race condition) Redis sayesinde engelleriz.

**BullMQ yaparken monitoring neden şarttır?**

Background job’lar:

* Request’e bağlı değildir
* Sessizce fail olabilir
* Kullanıcı şikâyeti gelene kadar fark edilmez

Monitoring yoksa sistem yoktur.

**Peki nasıl izleriz?**
Install:

```js
npm install bull-arena
```

Ve bu kodları eklersek:

```js
const Arena = require("bull-arena");
const express = require("express");
const app = express();
```

```js
app.use(
    "/bullmq-dashboard",
    Arena(
        {
            BullMQ: require("bullmq"),
            queues: [{ name: "testQueue", hostId: "Main Server" }],
        },
        { basePath: "/bullmq-dashboard", disableListen: true }
    )
);
app.listen(3000, () => console.log(" Dashboard at http://localhost:3000/bullmq-dashboard"));
```
Eğer `http://localhost:3æ000/bullmq-dashboard` Sitesini ziyaret edersek bütün jobları görebiliriz.


---