
---
## Clean Architecture

İş mantığı (business logic), framework'lerden, database'lerden, UI'dan bağımsız olmalıdır.

Peki nedir amaçları:

**Framework Bağımsızlığı:** Framework değişse de iş mantığı etkilenmez
**Test Edilebilirlik:** UI, DB olmadan test edilebilir
**UI Bağımsızlığı:** Web, mobile, CLI kolayca değiştirilebilir
**Database Bağımsızlığı:** MongoDB'den PostgreSQL'e geçiş kolay
**Dış Servislere Bağımlılık Yok:** 3rd party API'ler değişse kod değişmez

┌─────────────────────────────────────────────┐
│          Entities (Domain Models)           │ ← En içteki katman
│        (İş kuralları - Business Rules)      │    (En stabil)
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│           Use Cases (Application)           │
│        (Uygulama iş mantığı)                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│    Interface Adapters (Controllers,         │
│    Presenters, Gateways)                    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│    Frameworks & Drivers (Web, DB, UI)       │ ← En dıştaki katman
│    (Express, MongoDB, React)                 │    (En değişken)
└─────────────────────────────────────────────┘

* Entities (Kurumsal İş Kuralları): Uygulamanın en kalbi. Veri modelleri ve temel iş mantığı buradadır (Örn: User, Product). Hiçbir framework'e (Express, NestJS) bağımlı değildir.

* Use Cases (Uygulama İş Kuralları): Uygulamanın ne yapacağını belirler. (Örn: OrderCreation, PasswordReset). Sadece "ne olacağını" bilir ama verinin veri tabanına nasıl yazılacağını bilmez.

* Interface Adapters (Controllers, Gateways): Use Case'lerin anladığı formatı dış dünyaya (Web, DB) uygun hale getirir.

* Frameworks & Drivers (Dış Dünya): En dış katmandır. Veri tabanı (PostgreSQL), Web Sunucusu (Express), Mail servisleri buradadır. En sık değişen katman budur.

Dış katmanlar içteki katmanlara bağlı olabilir, ama içtekiler dıştakilere bağlı olamaz!

**Neden Clean Architecture?**
Framework Bağımsız: Express'ten vazgeçip Fastify'a mı geçmek istiyorsunuz? Sadece en dış katmanı değiştirirsiniz, iş mantığına dokunmazsınız.
Veri Tabanı Bağımsız: SQL mi NoSQL mi kararsız mısınız? İş mantığınız için fark etmez.
Test Edilebilirlik: İş mantığını hiçbir veritabanı veya sunucu olmadan tek başına test edebilirsiniz (Unit Test).


## Solid Principles

1. S - Single Responsibility Principle (SRP)

- Her sınıf tek bir sorumluluğa sahip
- Test etmek kolay
- Değişiklik yapmak güvenli
- Yeniden kullanılabilir

* Bir sınıf/fonksiyon/modül sadece bir nedenden dolayı değişmeli.
```js
// 1. Domain Entity (Sadece iş kuralları)
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
  
  getName() {
    return this.name;
  }
  
  getEmail() {
    return this.email;
  }
}

// 2. Repository (Database işlemleri)
class UserRepository {
  constructor(database) {
    this.db = database;
  }
  
  async save(user) {
    return await this.db.query(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [user.getName(), user.getEmail()]
    );
  }
  
  async findById(id) {
    const result = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
    return new User(result.name, result.email);
  }
}

// 3. Email Service (Email gönderme)
class EmailService {
  constructor(smtpClient) {
    this.smtp = smtpClient;
  }
  
  sendWelcomeEmail(user) {
    return this.smtp.send(
      user.getEmail(),
      'Welcome!',
      `Welcome ${user.getName()} to our platform`
    );
  }
}

// 4. Validator (Validasyon)
class UserValidator {
  validate(user) {
    const errors = [];
    
    if (!user.getEmail().includes('@')) {
      errors.push('Invalid email format');
    }
    
    if (user.getName().length < 2) {
      errors.push('Name too short');
    }
    
    return errors;
  }
}

// 5. Logger (Logging)
class Logger {
  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
  
  error(message) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
  }
}

// Kullanım (Her sınıf tek bir sorumluluğa sahip)
const user = new User('John Doe', 'john@example.com');
const validator = new UserValidator();
const errors = validator.validate(user);

if (errors.length === 0) {
  const repository = new UserRepository(database);
  await repository.save(user);
  
  const emailService = new EmailService(smtpClient);
  await emailService.sendWelcomeEmail(user);
  
  const logger = new Logger();
  logger.log(`User ${user.getName()} created successfully`);
}
```
2. O - Open/Closed Principle (OCP)
* Sınıflar genişletmeye açık, değiştirmeye kapalı olmalı.
* Yeni özellik eklerken mevcut kodu değiştirmeden yapabilmeliyiz.

```js
// Interface (Abstract base)
class PaymentMethod {
  process(amount) {
    throw new Error('process() must be implemented');
  }
}

// Concrete implementations
class CreditCardPayment extends PaymentMethod {
  process(amount) {
    console.log(`Processing ${amount} via Credit Card`);
    // Credit card specific logic
    return { success: true, method: 'credit_card' };
  }
}

class PayPalPayment extends PaymentMethod {
  process(amount) {
    console.log(`Processing ${amount} via PayPal`);
    // PayPal specific logic
    return { success: true, method: 'paypal' };
  }
}

class StripePayment extends PaymentMethod {
  process(amount) {
    console.log(`Processing ${amount} via Stripe`);
    // Stripe specific logic
    return { success: true, method: 'stripe' };
  }
}

// Yeni ödeme yöntemi? Sadece yeni class ekle!
class CryptoPayment extends PaymentMethod {
  process(amount) {
    console.log(`Processing ${amount} via Cryptocurrency`);
    return { success: true, method: 'crypto' };
  }
}

// Processor (Değişmeden kalır!)
class PaymentProcessor {
  constructor(paymentMethod) {
    this.paymentMethod = paymentMethod;
  }
  
  processPayment(amount) {
    return this.paymentMethod.process(amount);
  }
}

// Kullanım
const creditCardProcessor = new PaymentProcessor(new CreditCardPayment());
creditCardProcessor.processPayment(100);

const cryptoProcessor = new PaymentProcessor(new CryptoPayment());
cryptoProcessor.processPayment(100);

// Yeni ödeme yöntemi eklemek için mevcut kodu değiştirmedik!
```

3.L - Liskov Substitution Principle (LSP)
* Alt sınıflar, üst sınıfların yerine kullanılabilmeli
* Bir class'ı extend ediyorsan, parent class'ın davranışını bozmamalısın.

```js
//  Kötü: Rectangle ve Square
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  
  setWidth(width) {
    this.width = width;
  }
  
  setHeight(height) {
    this.height = height;
  }
  
  getArea() {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  setWidth(width) {
    this.width = width;
    this.height = width; // Kare olduğu için her iki tarafı da değişir
  }
  
  setHeight(height) {
    this.width = height;
    this.height = height;
  }
}

// Test
function testRectangle(rectangle) {
  rectangle.setWidth(5);
  rectangle.setHeight(4);
  console.log(rectangle.getArea()); // 20 bekliyoruz
}

testRectangle(new Rectangle(0, 0)); //  20
testRectangle(new Square(0, 0));    //  16 (LSP ihlali!)

//  İyi: Composition kullan
class Shape {
  getArea() {
    throw new Error('Must implement getArea()');
  }
}

class Rectangle extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }
  
  getArea() {
    return this.width * this.height;
  }
}

class Square extends Shape {
  constructor(side) {
    super();
    this.side = side;
  }
  
  getArea() {
    return this.side * this.side;
  }
}
```

4. I - Interface Segregation Principle (ISP)
* Bir class, kullanmadığı metodlara bağımlı olmamalı.
* Büyük interface'ler yerine küçük, spesifik interface'ler kullan.

```js
//  Kötü: Tüm database işlemleri tek interface'te
class DatabaseOperations {
  find() {}
  findOne() {}
  create() {}
  update() {}
  delete() {}
  aggregate() {}
  transaction() {}
  backup() {}
  restore() {}
}

// Read-only kullanıcı için çok fazla metod!
class ReadOnlyRepository extends DatabaseOperations {
  find() { /* OK */ }
  findOne() { /* OK */ }
  create() { throw new Error('Not allowed'); }
  update() { throw new Error('Not allowed'); }
  delete() { throw new Error('Not allowed'); }
  // ...
}

//  İyi: Segregate edilmiş interface'ler
class Readable {
  async find(query) {}
  async findOne(query) {}
}

class Writable {
  async create(data) {}
  async update(id, data) {}
  async delete(id) {}
}

class Aggregatable {
  async aggregate(pipeline) {}
}

// Read-only repository
class ReadOnlyUserRepository extends Readable {
  constructor(db) {
    super();
    this.db = db;
  }
  
  async find(query) {
    return await this.db.collection('users').find(query).toArray();
  }
  
  async findOne(query) {
    return await this.db.collection('users').findOne(query);
  }
}

// Full repository
class UserRepository {
  constructor(db) {
    this.db = db;
  }
  
  async find(query) {
    return await this.db.collection('users').find(query).toArray();
  }
  
  async create(data) {
    return await this.db.collection('users').insertOne(data);
  }
  
  async update(id, data) {
    return await this.db.collection('users').updateOne({ _id: id }, { $set: data });
  }
}
```
5. D - Dependency Inversion Principle (DIP)
* Yüksek seviye modüller, düşük seviye modüllere bağımlı olmamalı. Her ikisi de abstraction'lara bağımlı olmalı.

```js
// DI Container
class Container {
  constructor() {
    this.services = new Map();
  }
  
  register(name, definition) {
    this.services.set(name, definition);
  }
  
  get(name) {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    
    if (typeof service === 'function') {
      return service(this);
    }
    
    return service;
  }
}

// Setup
const container = new Container();

// Register services
container.register('database', (c) => new MySQLDatabase());
container.register('userRepository', (c) => new UserRepository(c.get('database')));
container.register('userService', (c) => new UserService(c.get('userRepository')));
container.register('emailService', (c) => new EmailService());

// Usage
const userService = container.get('userService');
const users = await userService.getUsers();
```

---

# 🏗️ CLEAN ARCHITECTURE KATMANLARI (Node.js)

## Proje Yapısı
```
src/
├── domain/              # En içteki katman (Business logic)
│   ├── entities/
│   │   └── User.js
│   ├── repositories/    # Interfaces
│   │   └── IUserRepository.js
│   └── services/
│       └── UserDomainService.js
│
├── application/         # Use cases
│   ├── use-cases/
│   │   ├── CreateUser.js
│   │   ├── GetUser.js
│   │   └── UpdateUser.js
│   └── dto/
│       └── CreateUserDTO.js
│
├── infrastructure/      # External dependencies
│   ├── database/
│   │   ├── mongodb/
│   │   │   └── MongoUserRepository.js
│   │   └── postgres/
│   │       └── PostgresUserRepository.js
│   ├── email/
│   │   └── SendGridEmailService.js
│   └── cache/
│       └── RedisCache.js
│
└── interfaces/          # En dıştaki katman (Controllers, routes)
    ├── http/
    │   ├── controllers/
    │   │   └── UserController.js
    │   ├── routes/
    │   │   └── userRoutes.js
    │   └── middlewares/
    │       └── authMiddleware.js
    └── cli/
        └── UserCLI.js
```

---