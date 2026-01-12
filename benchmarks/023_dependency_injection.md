
---

## Dependency Injection mantığı

Burada Dependency Injection’ın bize tek dediği şey şudur: **Bağımlılığı ben yaratmam, bana verilir.**
Yani bir sınıfın veya fonksiyonun ihtiyaç duyduğu başka bir nesneyi (bağımlılığı) kendi içinde oluşturmak yerine, bu nesnenin dışarıdan ona verilmesi mantığıdır.

```js
class RegisterUser {
  private userRepo = new PrismaUserRepository();

  async execute() {
    // ...
  }
}
```

* Burada DI yok ve use case DB’ye bağlı oldu. Test edilemez, değiştirmesi zordur ve mocklamak neredeyse imkânsızdır. Bunu şöyle çözebiliriz:

```js
class RegisterUser {
  constructor(private userRepo: UserRepository) {}

  async execute() {
    // ...
  }
}
```

* Burada use case DB’yi bilmez, sadece interface bilir. Test edilebilir ve değişime açıktır.

DI’da temel mantığımız `new` anahtar kelimesinden kaçınmaktır. Şöyle der: “Bana bir servis lazım ve kimin verdiği önemli değil.”

Mesela:

```js
class UserService {
    constructor() {
        this.emailService = new EmailService(); // (Hard dependency)
    }

    register(user) {
        // ... kayıt işlemleri
        this.emailService.send(user.email, "Hoş geldin!");
    }
}
```

Burada `UserService` doğrudan `EmailService`’e göbekten bağlıdır. Eğer başka bir mail servisi kullanmak istersek, bütün mail servisini değiştirmemiz gerekir.

**Bunu şöyle yaparsak DI yapmış oluruz:**

```js
class UserService {
    constructor(emailService) { // burada DI yapılıyor
        this.emailService = emailService;
    }

    register(user) {
        this.emailService.send(user.email, "Hoş geldin!");
    }
}

// Kullanırken:
const gmail = new GmailService();
const userSvc = new UserService(gmail); // Dışarıdan dahil ettik
```

### Peki DI neden kullanırız?

**Test edilebilirlik (Unit Testing):**
Gerçek bir e-posta servisini test etmek zordur (sürekli mail gider). DI sayesinde test sırasında “Fake” veya “Mock” bir servis enjekte edebilirsin.

**Esneklik:**
Yarın öbür gün Gmail yerine SendGrid kullanmak istersen `UserService` koduna dokunmana gerek kalmaz. Sadece başlangıçta farklı bir nesne verirsin.

**Temiz Kod:**
Sınıfların sorumluluğu azalır. Bir sınıf hem kendi işini yapıp hem de bağımlılıklarını yönetmek zorunda kalmaz.

---

## DI Türleri Nelerdir?

### 1. Constructor Injection

```js
constructor(private repo: UserRepository) {}
```

Bu en doğrusudur: açık, test-friendly ve immutable’dır.

### 2. Setter Injection

```js
setRepository(repo: UserRepository) {
  this.repo = repo;
}
```

Burada nesne oluşturulduktan sonra bir fonksiyon (örn: `setRepository`) aracılığıyla bağımlılık atanır.
Opsiyonel dependency için kullanılır ancak risklidir.

### 3. Method Injection

```js
execute(repo: UserRepository) {}
```

---

## Dependency Injection Container (DI Container) Nedir?

Büyük projelerde yüzlerce sınıf ve bağımlılık olur. Bunları manuel olarak tek tek `new Service(new OtherService(new Database()))` şeklinde yazmak imkânsızdır.

DI Container (veya IoC Container), hangi sınıfın hangi bağımlılığa ihtiyacı olduğunu bilen bir “merkezi depo”dur. Siz “Bana bir `UserService` ver” dersiniz, o arka planda tüm zinciri oluşturup size hazır paket olarak sunar.

Eğer bir sürü dependency varsa:

```ts
new A(new B(new C()))
```

Bu kaosa dönüşür ve bunu DI container ile çözebiliriz.
Eğer projemiz küçük veya orta ölçekliyse DI container kullanmayabiliriz; ancak büyük projelerde kullanmak gereklidir.

* Use case yazıyorsan → DI şart
* Test yazıyorsan → DI şart
* Clean Architecture diyorsan → DI şart

### Use Case + DI + Test

```js
const fakeRepo: UserRepository = {
  findByEmail: async () => null,
};

const uc = new RegisterUser(fakeRepo);
```

* Dependency Injection, bir sınıfın bağımlılıklarını kendisinin oluşturması yerine dışarıdan almasını sağlayarak gevşek bağlı, test edilebilir ve sürdürülebilir bir yapı kurmayı amaçlar.

---

## Araba Benzetmesi

* **DI olmayan:** Araba kendi motorunu kendi içinde üretir. Motoru değiştirmek istersen arabayı parçalaman gerekir.
* **DI olan:** Araba üretilirken motor dışarıdan takılır. İster dizel motor tak, ister elektrikli; arabanın gövdesi (şasisi) değişmez.

---

Dependency Injection’ın (DI) gerçek bir projede nasıl hayat bulduğunu iki farklı yaklaşımla inceleyelim: Biri manuel (Express.js tarzı), diğeri ise bu işi otomatiğe bağlayan modern yaklaşım (NestJS tarzı).

---

### Manuel Dependency Injection (Express.js Yaklaşımı)

Küçük veya orta ölçekli projelerde bir kütüphane kullanmadan DI uygulayabilirsin. Burada kilit nokta, bağımlılıkları en alttan başlayarak yukarı doğru “beslemektir”.

**Senaryo:** Kullanıcı veritabanı işlemi ve loglama.

```js
// 1. Bağımlılık (En alt katman)
class Logger {
    log(message) { console.log(`[LOG]: ${message}`); }
}

// 2. Servis (Logger'a bağımlı)
class UserService {
    constructor(logger) { // Bağımlılığı dışarıdan alır
        this.logger = logger;
    }

    create(name) {
        this.logger.log(`${name} kullanıcısı oluşturuluyor...`);
        // DB işlemleri...
    }
}

// 3. Controller (UserService'e bağımlı)
const logger = new Logger();
const userService = new UserService(logger); // Enjeksiyon manuel yapıldı

// Express rotasında kullanım
app.post('/user', (req, res) => {
    userService.create(req.body.name);
    res.send("Başarılı");
});
```

---

### Otomatik DI / IoC Container (NestJS Yaklaşımı)

Büyük projelerde nesneleri `new` ile manuel oluşturmak imkânsız hale gelir. NestJS gibi framework’ler bir **IoC (Inversion of Control) Container** kullanır. Sen sadece “bu bir inject edilebilir sınıftır” dersin, gerisini o halleder.

```ts
@Injectable() // Bu sınıf artık bir bağımlılık olabilir (Provider)
export class LoggerService {
  log(msg: string) { console.log(msg); }
}

@Injectable()
export class UserService {
  // NestJS, LoggerService'in bir örneğini otomatik oluşturur ve buraya paslar
  constructor(private logger: LoggerService) {}

  findAll() {
    this.logger.log('Kullanıcılar getiriliyor...');
    return [];
  }
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {} // Otomatik enjeksiyon

  @Get()
  getUsers() {
    return this.userService.findAll();
  }
}
```

---

### Mocking (Test) Avantajı

DI kullanmanın en büyük “A-ha!” anı test yazarken gelir. Gerçek veritabanına dokunmadan servisi test edebilirsin:

```js
const mockLogger = { log: jest.fn() };
const service = new UserService(mockLogger);

service.create("K");
expect(mockLogger.log).toHaveBeenCalledWith("K kullanıcısı oluşturuluyor...");
```

---

### Ne zaman hangisini kullanmalı?

* Eğer **Express.js** veya yalın bir **Node.js** projesindeysen: **Manuel DI** (constructor üzerinden) yeterlidir.
* Eğer **kurumsal, büyük ölçekli ve çok ekipli** bir projedeysen: **NestJS** gibi bir IoC Container kullanan yapı hayat kurtarır.

---
