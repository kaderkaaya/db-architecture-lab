
---

Bugün çalıştığımız konuda eğer **hignh volume listeler** varsa `offset` kullanmamalıyız.
Bunun yerine **cursor based pagination** kullanmalıyız.

* `offset` satır atlama maliyeti yaratır
* Büyük sayfalarda performans sorunu oluşur
* Cursor ile indexlenir

---
