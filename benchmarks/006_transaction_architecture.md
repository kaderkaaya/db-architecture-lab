
---

Bugün öğrendiğimiz konuları nerede ve nasıl uygulayacağımıza bakacağız.
Aslında hangi işlemi nerede yapacağımızı ve **Layered Architecture** konusuna değineceğiz.

“Query → Service → API” hattı, modern yazılım mimarisinde **Separation of Concerns (Sorumlulukların Ayrılması)** prensibine dayanır.
Bu yapıyı kurarken amaç; veritabanı işlemlerini, business logic’i ve dış dünyaya açılan kapıyı birbirinden tamamen izole etmektir.

---

## API Katmanı (Controller)

İlk olarak API katmanına bakalım.
Bu katman client ile sistem arasındaki giriş kapısıdır.
Sadece **HTTP protokolü** ile ilgilenir.

* Bu katman gelen API isteğini karşılar
* Gelen veriyi doğrular
* Service katmanını çağırır
* JSON döndürür

```js
// controllers/CartController.js
static async addToCart(req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;
    const result = await CartService.addItem({ userId, productId, quantity });

    return res.status(200).json(result);
  } catch (error) {
    next(error); // hata yönetimine gönder
  }
};
```

---

## Service Katmanı (Business Logic)

İkinci olarak Service katmanı (Business Logic).
Burası Controller’dan gelen istekleri alır ve gerekli kurallara göre işlem yapar.

Örneğin:

* Gerekli verileri Query/Data katmanından istemek
* Kontrolleri yapmak (stok var mı, kullanıcı aktif mi?)
* Transaction yönetimini başlatmak
* Sonucu birleştirmek

```js
// services/CartService.js
static async addItem({ userId, productId, quantity }) => {
  // Transaction Boundary burada başlar
  return await sequelize.transaction(async (t) => {
    // 1. Ürünü kontrol et → Data
    const product = await ProductData.getById(productId, { transaction: t });

    // 2. Stok kontrolü
    if (product.stock < quantity) throw new Error("Yetersiz stok");

    // 3. Buradan DB’ye gönderir
    await CartData.upsertItem(
      { userId, productId, quantity },
      { transaction: t }
    );

    return { message: "Ürün sepete eklendi" };
  });
};
```

---

## Data Katmanı (Repository)

Son olarak Data katmanında (Repository) ne yaparız?
Burada sadece **veri işlemleri** yapılır.
“Veriyi getir” ya da “veriyi kaydet” gibi işlemler bulunur.

```js
// data/ProductData.js
export const getById = async (id, { transaction }) => {
  return await Product.findOne(id, {
    transaction,
    lock: transaction.LOCK.UPDATE // locking yapar
  });
};
```

---

## Workflow

1. Client (Tarayıcı): `POST /cart/add` isteği atar.
2. Route: İsteği karşılar ve doğru Controller’a yönlendirir.
3. Controller: Gelen veriyi paketler ve Service’i çağırır.
4. Service: Bir transaction başlatır. Önce Query katmanından veriyi ister.
5. Query: Veritabanından satırı çeker (gerekirse locking yapılır) ve Service’e döner.
6. Service: Kontrollerini yapar, eğer her şey yolundaysa tekrar Query katmanına “kaydet” emri verir.
7. Controller: Başarı mesajını Client’a iletir.

---

## Peki neden DB işlemlerini Controller’da yapmayız?

* Controller içinde hem veri doğrulama, hem stok kontrolü, hem SQL sorgusu, hem de e-posta gönderme kodu yazarsan o dosya 1000 satıra çıkar.
  Bir hata olduğunda hatanın SQL’den mi, iş mantığından mı yoksa HTTP protokolünden mi kaynaklandığını bulamazsın.

* Repository katmanına koymamızın sebebi:

  1. Kodun daha derli toplu olur.
  2. Aynı işi farklı yerlerde tekrar kullanabilirsin.
  3. Hataları çok daha hızlı ayıklarsın.

* Test etmeyi Service layer’da yaparız.
  Eğer Controller’da yaparsak test edemeyiz ve bütün kodu buraya yazarsak büyüdüğünde sistem çöker.

---

## Mimari

```
Controller
   ↓
Service
   ↓
Repository (DB)
```
---