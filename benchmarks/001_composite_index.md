
---

## Query

```sql
use sql_bench;

explain analyze
select * from orders
where user_id = 200
order by created_at desc
limit 10;
```

---

Tek başına `user_id` index’i `WHERE` koşulunu hızlandırır ama `ORDER BY` için yeterli değildir.

Composite index sayesinde hem filtreleme hem sıralama index üzerinde yapılır ve `filesort` ortadan kalkar.

---

## Composite Index

Birden fazla kolonu içeren tek bir index.

```sql
CREATE INDEX idx_user_created
ON orders(user_id, created_at);
```

---

→ Bu tek bir indextir ama 2 columnu birlikte içerir.
Şöyle açıklayayım: önce tablodan `user_id`’ye ait kayıtları bulur, daha sonra `created_at`’e göre sıralama yapar.

Çünkü eğer sadece `user_id`’ye index eklersek, burada bütün tabloyu scan etmeden o kullanıcıya ait row’ları getirir ama sıralama yaparken tekrar maliyet artar. Bunun için composite index kullanırız.

Composite index ayrı ayrı indexler değildir ve `WHERE` ve `ORDER BY`’i birlikte optimize edemez.

---

→ Composite index’te index girerken sıralama önemlidir.

`user_id → created_at`

Burada önce o id’ye ait kullanıcıları bulur, daha sonra oluşturma tarihine göre sıralama yapar.

Eğer bunu tam tersi yaparsam, benim sorguma göre önce tabloda bulunan bütün row’ları `created_at`’e göre sıralar, daha sonra `user_id`’ye göre filtreleme yapar. Bu da yine bize maliyetli olur.

---
