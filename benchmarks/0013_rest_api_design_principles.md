
---

## REST Api

ilk olarak rest nedir? Client ile backend arasındaki iletişimi kurar. Belli baslı prensipleri vardır bunlar:

Stateless (Durumsuzluk): Sunucu, istemci hakkında hiçbir bilgi saklamaz. Her istek (request), o isteğin işlenmesi için gerekli olan tüm bilgileri (token, ID vb.) içinde barındırmalıdır.
Neden? Sunucunun yükünü azaltır ve ölçeklenebilirliği artırır.

* JWT burda kullanılır.

Cacheable: Yanıtlar, tarayıcı veya ara sunucular tarafından önbelleğe alınabilir olmalıdır. Bu, performansı devasa artırır.

* API cevapları cache edilebilir olmalıdır.

```http
Cache-Control: public, max-age=60
```

* Burda amacımız aynı veri için tekrar DB'ye gitmemek
* performans kazanmak

Client-Server Separation: Frontend ve Backend birbirinden tamamen bağımsızdır. Sadece belirlenen arayüz (API) üzerinden konuşurlar.

Uniform Interface (Tek Tip Arayüz): API'nin her yerinde aynı kurallar geçerli olmalıdır. Yni Resource-Based URLs kullanmalıyız. REST'te her şey bir kaynaktır (User, Order, Product). URL'ler eylemleri (fiil) değil, nesneleri (isim) temsil etmelidir.

Yanlış: GET /getUsers, POST /createOrder, GET /deleteUser/5 (Bunlar RPC tarzıdır).
Doğru:
GET /users (Tüm kullanıcıları getir)
POST /users (Yeni kullanıcı oluştur)
GET /users/5 (5 ID'li kullanıcıyı getir)
DELETE /users/5 (5 ID'li kullanıcıyı sil)

HTTP Method’ların Doğru Kullanımı:

| **Metot**  | **İşlem**                      | **Özellik (Idempotency)**                                                 |
| ---------- | ------------------------------ | ------------------------------------------------------------------------- |
| **GET**    | Veri okuma                     | **Idempotent** – Aynı istek kaç kez atılırsa atılsın sonuç değişmez       |
| **POST**   | Yeni veri oluşturma            | **Idempotent değildir** – Her istek yeni bir kayıt oluşturabilir          |
| **PUT**    | Veriyi tamamen güncelleme      | **Idempotent** – Aynı veriyi tekrar tekrar set etsen sonuç aynıdır        |
| **PATCH**  | Verinin bir kısmını güncelleme | **Genellikle idempotent kabul edilir**                                    |
| **DELETE** | Veriyi silme                   | **Idempotent** – Bir kez silindikten sonra tekrar silme aynı sonucu verir |

HTTP Status Codes:

| Kod | Anlam            |
| --- | ---------------- |
| 200 | OK               |
| 201 | Created          |
| 204 | No Content       |
| 400 | Bad Request      |
| 401 | Unauthorized     |
| 403 | Forbidden        |
| 404 | Not Found        |
| 409 | Conflict         |
| 422 | Validation Error |
| 500 | Server Error     |

* API her zaman aynı formatta cevap vermeli.

```json
{
  "data": user,
  "meta": {},
  "error": null
}
```

* Layered system kullanırız.
  Client → API → Service → DB

Versioning: Kodunu güncellediğinde eski kullanıcıların sisteminin bozulmaması için API'yi versiyonlamalısın.
[https://api.site.com/v1/users](https://api.site.com/v1/users)

Burda Pagination,[Pagination](d3_pagination.md) Filtering, Sorting konularına devam edeceğiz. Daha önce pagination konusunu derinlemesine işlemiştik, şimdi Filtering ve sorting konularına bakalım.

**Filtering**
Bir API'nin performansı ve kullanıcı deneyimi için en kritik konulardan biridir. Milyonlarca satırlık bir tabloda doğru filtreleme yapmazsan, hem sunucun hem de veritabanın kilitlenir.

API Seviyesinde Filtreleme (Express.js)

```js
const where = {}

if (status) where.status = status
if (userId) where.user_id = userId
if (fromDate && toDate) {
  where.created_at = { [Op.between]: [fromDate, toDate] }
}
```

bunun SQL karşılığı:

```sql
WHERE status = ?
  AND user_id = ?
  AND created_at BETWEEN ? AND ?
```

* Eğer 1 milyon ürünümüz olduğunu varsayalım, bu durumda category = 'electronics' diye arattığımızı varsayalım. Bu durumda veritabanı tüm satırları tek tek okur (Full table scan) yapmış oluruz. Bunu şöyle çözmemiz gerekir: veritabanına index atarak bu durumu çözebiliriz.

```sql
CREATE INDEX idx_product_category ON products(category);
```

Bu komutu çalıştırdığımızda B-tree yapısı oluşur ve 1 milyonu taramak yerine 20 işlemde sonucu bulur.

* O(n) -> O(log n)'e dönüşür.

Composite Index:
Kullanıcı aynı anda hem category hem de brand seçiyorsa ne olur? Eğer her iki sütuna da ayrı ayrı index atarsan, veritabanı hangisini kullanacağına karar vermekte zorlanabilir. Bu durumda Composite Index (Birleşik Index) kullanılır:

```sql
CREATE INDEX idx_category_brand ON products(category, brand);
```

```sql
SELECT * FROM orders
WHERE user_id = 42 AND status = 'PAID';
```

bunun için:

```sql
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
```

* WHERE user_id = ? AND status = ? bu şekilde çalışır.
* Tarih filtreleri çok sık indeks ister.

```sql
WHERE created_at BETWEEN '2025-01-01' AND '2025-01-31'
```

bunun için:

```sql
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

* Index'teki sütun sırası önemlidir. Eğer sorgunda önce category sonra brand varsa, index bu sırayla çok hızlı çalışır.

Kullanmazsak Ne Olur?
CPU Tavan Yapar: Veritabanı her aramada milyonlarca satırı RAM'e çekip okumaya çalışırken CPU %100 olur.
Timeout: Sorgu 30 saniye sürer ve kullanıcı "Gateway Timeout" hatası alır.
Deadlocks: Yavaş sorgular veritabanı tablolarını uzun süre kilitler, bu da yeni veri eklenmesini (INSERT) engeller.

Filtreleme yapan bir endpoint çok yavaş çalışıyorsa ne yapmalıyız?
Önce veritabanı tarafında EXPLAIN komutunu kullanarak sorgunun nasıl çalıştığına bakarım. Eğer Full Table Scan yapıyorsa, filtrelemeye dahil olan sütunlara Index atarım. Eğer çoklu filtreleme varsa Composite Index oluştururum. Ayrıca frontend'in gereksiz büyük veriler istemediğinden emin olmak için Pagination (Sayfalama) uygulayıp uygulamadığımızı kontrol ederim.

Ne zaman index eklenir?
WHERE
JOIN
ORDER BY
RANGE queries (> < BETWEEN)

**Filtering and Pagination Example**

```sql
SELECT *
FROM orders
WHERE status = 'PAID'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

Index:

```sql
CREATE INDEX idx_orders_status_created_at
ON orders(status, created_at DESC);
```

* Filtering DB’de yapılır
* Sık filtrelenen kolonlar index’lenir
* Composite index sırası kritiktir
* LIKE %abc index öldürür
* Filtering + Pagination birlikte düşünülür
* Parametreli sorgu = güvenlik

**Şimdi gelelim Sorting Konusuna**
Sorting (Order By): Filtering'in devamı gibi düşünebiliriz. Filtreleme ile el ele yürüyen ama performans açısından veritabanını en çok yoran işlemlerden biridir.

* Eğer DB'de yine index yoksa:
* Full table scan
* In-memory / disk sort

-> ORDER BY + index = hızlı
-> ORDER BY + index yok = yavaş

```js
app.get('/products', async (req, res) => {
  const { sort, order } = req.query;
  const allowedSortFields = ['price', 'createdAt', 'rating'];
  const actualSortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
  const actualOrder = order === 'desc' ? 'DESC' : 'ASC';

  const query = `SELECT * FROM products ORDER BY ${actualSortField} ${actualOrder} LIMIT 20`;
});
```

Eğer üzerinde Index olmayan bir kolona göre ORDER BY yaparsan, veritabanı şunları yapar:

Tüm uygun satırları bulur.
Bu verileri belleğe (RAM) çeker.
Bellekte sıralama algoritması (genelde QuickSort) çalıştırır.
Eğer veri RAM'e sığmazsa diski kullanır (Disk Sort), bu da sistemin yavaşlıktan ölmesi demektir.

Buna MySQL dünyasında Filesort denir ve performansın baş düşmanıdır.

* Yine bunun çözümü index ekleyerek index-based sortingdir.
  Çünkü Index zaten verileri sıralı bir şekilde (B-Tree) tutar. Veritabanı sadece Index'in başından veya sonundan okuma yapar.

```sql
CREATE INDEX idx_products_price ON products(price);
```

Hem filtreleme hem sıralama yapıyorsan (Örn: elektronik kategorisindeki en ucuz ürünler), Composite Index hayat kurtarır.

* Index sırası (Filter_Column, Sort_Column) şeklinde olmalıdır.

```sql
CREATE INDEX idx_category_price ON products(category, price);
-- Bu index "WHERE category = ? ORDER BY price ASC" sorgusunu jet hızına çıkarır.
```

Peki Sorting kullanmazsak ne olur?

* Büyük veri setlerini RAM'de sıralamaya çalışmak veritabanını dondurur.
* Eğer sıralama (Order By) kullanmazsak, SQL standartlarına göre verilerin hangi sırayla geleceği garanti değildir. Bir sayfada gördüğün ürünü sayfayı yenileyince göremeyebiliriz.

- Filtering + Sorting + Pagination

```sql
SELECT *
FROM orders
WHERE status = 'PAID'
  AND created_at < ?
ORDER BY created_at DESC
LIMIT 20;
```

Buna index'i şu şekilde ekleriz:

```sql
CREATE INDEX idx_orders_status_created_at
ON orders(status, created_at DESC);
```

* Sorting operasyonlarını index üzerinden çalıştırmak gerekir.
  Offset pagination büyük dataset’lerde pahalıdır, bu yüzden cursor-based pagination tercih ederiz.

* Sorting DB’de yapılır

* ORDER BY index yoksa pahalıdır

* WHERE + ORDER BY → composite index

* OFFSET yerine keyset pagination

* Dynamic sorting whitelist ister

* Function kullanılan ORDER BY index öldürür

---