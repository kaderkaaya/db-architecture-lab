### N+1 DB Query Problem ###

Öncelikle N+1 problemi nedir, bunu açıklayacağım. Sonra gerekli sorgular üzerinde birlikte çalışacağız.

N+1 problemi, veritabanına çok fazla sorgu atıldığında ortaya çıkan bir performans sorunudur. Bu durum uygulamanın yavaşlamasına neden olur.

Örneğin bir kurs sistemi olduğunu varsayalım:
- 100 öğrenci var
- Her öğrenci birden fazla kursa kayıt olabilir (one-to-many ilişki)

Tüm öğrencilerin kayıt olduğu kursları getirmek için:
1. Önce tüm öğrencileri listeleriz (1 query)
2. Daha sonra her öğrenci için, kurs tablosunda studentId ile o öğrenciye ait kursları çekmek için ayrı bir query yazarız

Eğer 100 öğrenci varsa:
- 1 + 100 = 101 query çalışır

Bu duruma N+1 DB Query problemi denir. Öğrenci veya kurs sayısı arttıkça query sayısı da artar ve bu durum performansı olumsuz etkiler. Ayrıca sorguların response süresi uzar.

Peki nasıl çözeriz?

N+1 problemini:
- JOIN
- Batch queries
- ORM tarafında eager loading (populate / include)

kullanarak çözebiliriz.

### Mongoose ile N+1 Problemi
User modelinde:
- id
- email
- createdAt

Order modelinde:
- id
- userId
- price
- createdAt

Order tablosunda userId ile kullanıcılara ait order’ları bulduğumuzu varsayalım.

 N+1 üreten yanlış kullanım:

```js
static async getOrders() {
  const orders = await OrderModel.find();

  for (const order of orders) { //Eğer burda mapleyerek yaparsak daha doğru bir çözüm olur
    await order.populate('userId');
  } // burda her loop için ayrı bir query olduğu için yine N+1 problemi ortaya çıkar.

  return orders;
}
```
 N+1 üreten doğru kullanım:

```js
static async getOrders() {
  const orders = await OrderModel.find()
  .populate('userId');
  return orders;
}
```
### Sequeilize ile N+1 Problemi
User modelinde:
- id
- email
- created_at

Order modelinde:
- id
- user_id
- price
- created_at

Order tablosunda user_id ile kullanıcılara ait order’ları bulduğumuzu varsayalım.

 N+1 üreten yanlış kullanım:

```js
static async getOrders() {
  const users = await UserModel.findAll();

  for (const user of users) { 
    const orders = await OrderModel.findAll({where:{userId: user.id}});
    return orders;
  }
}
```
 N+1 üreten doğru kullanım:

```js
static async getOrders() {
  const users = await UserModel.findAll({
    include: [{
    model: Order
  }]
  });
}
```
### Yukarıda Sequelize ve Mongoose ORM’lerde bunu nasıl çözebileceğimizi gördük. Şimdi SQL’de nasıl çözebileceğimize bakalım.

[text](../sql/create_user_and_order_for_n_plus.sql)

- Burada 100 tane kullanıcı ve her kullanıcıya 100 tane order ait olacak şekilde tabloları oluşturduk. Şimdi bu kullanıcılara ait order’ları getiren bir query yazalım ve N+1 problemine yakından bakalım.

[text](../sql/queries:q5_n_plus_one.sql)

- Burada önce kullanıcıları, daha sonra `orders` tablosundan her kullanıcının order’larını ayrı ayrı query olarak yazarsak N+1 problemi ortaya çıkar. Bu durum büyük ölçekli projelerde hem sorguları yavaşlatır hem de maliyeti artırır.

[text](../sql/queries:q6_nplus_one_fix.sql)

**
SELECT u.id, u.name, o.id, o.total_price FROM users u JOIN orders o ON o.user_id = u.id LIMIT 0, 10000	10000 row(s) returned	0.0019 sec / 0.018 sec
**
- Bunun yerine  yukarıda olduğu gibi Join kullanırsak hem hızlı bir sonuç alırı hemde performans açısından iyidir. 