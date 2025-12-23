
---

### Offset ve Pagination

İlk olarak pagination nedir, bunu açıklayacağım:
Pagination, büyük data setlerinde veriyi daha küçük parçalara bölerek hem kullanıcı deneyimini hem de performansı iyileştirmeyi amaçlar. Örneğin, bizim bir blog sayfamız olsun ve bu sayfada 100.000 tane blog yazısı bulunsun. Bunları tek seferde DB’den çekmek sistemi kilitler; ama pagination ile bunu daha küçük parçalara ayırarak kullanıcıya sunarız. Daha az veri, daha hızlı yüklenme sağlar.

2 türlü pagination vardır: **cursor based** ve **offset based**. En çok kullanılan offset based olduğu için bunun üzerinde daha çok duracağım.

---

### Offset Based

SQL’de `OFFSET` ve `LIMIT` vererek sayfalandırma yaparız.
Eğer benim `LIMIT`’im 10 ve `OFFSET`’im 20 ise, offset kadar kaydı atla ve limit kadarını getir. Aslında tüm mantık budur. Bunun kolaylığı şudur: Direkt olarak sayfa atladığımızda, direkt o sayfadaki verileri getirir.

* `get/comments` diye bir endpoint’imiz olsun ve page 3 olsun, page size 20 olsun. Bu durumda:

```
page 1 = 1–20  
page 2 = 21–40  
page 3 = 41–60  
```

Burada 41–60 arasındaki dataları döndürürüz.

```sql
SELECT * 
FROM posts 
ORDER BY id
LIMIT 20 OFFSET 40;
```

Şeklinde düşünebiliriz.

* Burada bizim datamız 41 ile 60 arasındaki verileri gösterir.

* Aslında `OFFSET` kaçıncı satırdan başlanacağını, `LIMIT` ise bir sayfada kaç tane veri gösterileceğini belirtir.

* `OFFSET = (page (mevcut sayfa) - 1) x pageSize (bir sayfada kaç tane veri gösterilecek)`

* Örneğin pageSize 10 ise ve kullanıcı 3. sayfadaysa:
  `(3 - 1) * 10 = 20`
  Yani ilk 20 kaydı atla, 21’den itibaren getir.

* `page`’i URL’de vermemiz gerekir.

```js
const offset = (page - 1) * limit;
```

---

### Offset Based’in Zayıf Noktası (Data Drift)

Bu offset based pagination’ın en zayıf noktası **data drift (veri kayması)** problemidir. Şöyle açıklayayım:

Benim DB’mde 10 tane verim var:

```
id: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
```

* Burada benim limit 3 ve offset 0.
* İlk sayfaya baktığımda 1, 2, 3 verileri gelir.
* Ama bu sırada 3, 4, 5 numaralı id’ler silindi.
* Kalan veriler:

```
1, 2, 6, 7, 8, 9, 10
```

* Ben 2. sayfaya geçmek istediğimde limit 3, offset 3 olur.
* Bu durumda ilk 3 kayıt 1, 2, 6’dır; bunlar atlanır.
* Sonuç olarak 7, 8, 9 id’lerine sahip veriler gösterilir.
* 6 numaralı veri tamamen atlanmış olur ve **veri kayması** yaşanır.

---

### Cursor Based Pagination

Bunu **cursor based pagination** ile çözeriz. Kısaca şöyle açıklayayım:
Cursor based pagination, en son gördüğüm id’den sonra gelen verileri getirir.

Örneğin:

```sql
WHERE id > 500 
LIMIT 5;
```

Bu sorgu, en son görülen id’den sonra gelen kayıtları getirir.

---

### SQL ile Offset ve Pagination
[post_seed](../sql/post_seed.sql)
[pagination_query](../sql/queries:q7_pagination.sql)

```sql
SELECT * 
FROM posts
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

```
-> Limit: 10 row(s)  (cost=12016 rows=10) (actual time=43.2..43.2 rows=10 loops=1)
    -> Sort: posts.created_at DESC, limit input to 10 row(s) per chunk  
       (cost=12016 rows=119121) (actual time=43.2..43.2 rows=10 loops=1)
        -> Table scan on posts  
           (cost=12016 rows=119121) (actual time=0.0619..30.1 rows=119025 loops=1)
```

```sql
SELECT * 
FROM posts
ORDER BY created_at DESC
LIMIT 10 OFFSET 10000;
```

```
-> Limit/Offset: 10/10000 row(s)  (cost=12016 rows=10) (actual time=62.9..62.9 rows=10 loops=1)
    -> Sort: posts.created_at DESC, limit input to 10010 row(s) per chunk  
       (cost=12016 rows=119121) (actual time=62.4..62.7 rows=10010 loops=1)
        -> Table scan on posts  
           (cost=12016 rows=119121) (actual time=0.123..28.2 rows=119025 loops=1)
```

```sql
SELECT * 
FROM posts
ORDER BY created_at DESC
LIMIT 10 OFFSET 100000;
```

```
-> Limit/Offset: 10/100000 row(s)  (cost=12016 rows=10) (actual time=76.9..76.9 rows=10 loops=1)
    -> Sort: posts.created_at DESC, limit input to 100010 row(s) per chunk  
       (cost=12016 rows=119121) (actual time=71.7..74.8 rows=100010 loops=1)
        -> Table scan on posts  
           (cost=12016 rows=119121) (actual time=0.0852..27.7 rows=119025 loops=1)
```
* Burada ilk olarak offset’i 0 verdiğimizde süreyi yukarıda görebiliyoruz.
* Offset’i her artırdığımızda sorgu süremiz de artıyor.
* Bunun için tablomuza index ekleyerek bu problemi tamamen çözemeyiz ama biraz iyileştirebiliriz.

[create_index](../sql/create_index_post.sql)
* Burda created_at'e desc olacak şekilde index ekledim.
```
'-> Limit/Offset: 10/100000 row(s)  (cost=12016 rows=10) (actual time=70.6..70.6 rows=10 loops=1)\n   
    -> Sort: posts.created_at DESC, limit input to 100010 row(s) per chunk  (cost=12016 rows=119121) (actual time=65.5..68.5 rows=100010 loops=1)\n       
         -> Table scan on posts  (cost=12016 rows=119121) (actual time=0.0907..24.5 rows=119025 loops=1)\n'
```
* böylece sorgu süremiz biraz daha azalır.

[cursorbased](../sql/queries:q8_cursor_based.sql)
```
'-> Limit: 10 row(s)  (cost=0.71 rows=1) (actual time=0.0265..0.0265 rows=0 loops=1)\n    -> Index range scan on posts using idx_created_at_posts over (created_at <= \'2024-01-01\') (reverse), with index condition: (posts.created_at <= DATE\'2024-01-01\')  (cost=0.71 rows=1) (actual time=0.0256..0.0256 rows=0 loops=1)\n'
```
* Burda herhangi bir satır atlamaz. sayfa geçildiğinde kaldığı yerden devam eder. Bu nedenle büyük datasetlerinde cursor based tercih edilebilir.