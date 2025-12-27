
---
-> Sistemde stok, bakiye ve benzeri kritik değerler
eş zamanlı işlemler sırasında veri tutarsızlığına yol açabilir.
Isolation level tek başına lost update problemini engellemez.

-> Bundan dolayı:
- Kritik veriler için pessimistic locking kullanılacaktır.
- SELECT ... FOR UPDATE ile satır bazlı kilitleme yapılacaktır.
- Locking işlemleri yalnızca Service layer içinde,
  transaction boundary kapsamında uygulanacaktır.
### Performans & Mimari Notlar

* Transaction içinde **ne kadar az satır kilitlersen**, sistem o kadar hızlı olur.
* Kilitliyken **asla dış API çağırma** (ödeme, servis vs.).
* Önce ödeme al, sonra transaction açıp stoğu düş.
* Projelerin %90’ında **Optimistic Locking yeterlidir**.
* Para ve stok gibi kritik %10’luk kısımda **Pessimistic Locking** kullan.

## Trade-offs
- Veri tutarlılığı garanti altına alınır.
- Concurrent işlemler güvenli şekilde sıraya girer.
- Kritik işlerde performans bilinçli olarak ikinci plana alınır.
---