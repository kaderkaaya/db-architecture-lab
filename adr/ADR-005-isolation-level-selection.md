
---

Isolation levels'i use case e göre nerde kullanacağımıız belirleriz .

## Examples
- Read-heavy endpoint → READ COMMITTED
- Stock / Order flow → REPEATABLE READ

| Use‑case          | Isolation       |
| ----------------- | --------------- |
| Ürün listeleme    | READ COMMITTED  |
| Sipariş oluşturma | REPEATABLE READ |
| Finansal rapor    | SERIALIZABLE    |

Böyle yapmamızın sebebi veri tutarlılığını ve performans dengesini sağlamaktır.

---