
---

Isolation levels'i use case e göre nerde kullanacağımıız belirleriz .

## Examples
- Read-heavy endpoint → READ COMMITTED
- Stock / Order flow → REPEATABLE READ

| Seviye (Level)  | Kod İçindeki Sabit Adı | Ne Zaman Kullanılır?                                                                                |
| --------------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| Read Committed  | `READ_COMMITTED`       | Genel işlemler: ürün listeleme, profil görüntüleme. (Çoğu veritabanında varsayılandır.)             |
| Repeatable Read | `REPEATABLE_READ`      | Raporlama: tek bir veri seti üzerinde uzun süre analiz yapılırken verinin değişmemesi gerekiyorsa.  |
| Serializable    | `SERIALIZABLE`         | En kritik finans işlemleri: çakışma riskinin çok yüksek olduğu ve hata payının sıfır olduğu yerler. |

Böyle yapmamızın sebebi veri tutarlılığını ve performans dengesini sağlamaktır.

---