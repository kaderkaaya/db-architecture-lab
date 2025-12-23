
---

Biz ORM kullanarak veri erişimi sağlarız. Ancak yanlış kullanım durumunda **N+1 problemi** ve **kontrolsüz query üretimi** kaynaklı performans sorunları ortaya çıkar.

* ORM’yi sadece **repository katmanında** kullanmalıyız.
  Controller ve service katmanında ORM’ye **doğrudan erişilmemesi** gerekir.

* ORM’ler otomatik query üretir ve N+1 problemleri ortaya çıkarabilir.
  Bu nedenle ORM kullanımını bu katmanda toplamalıyız.
  Burada query’lerimizi yönetebilir ve performans optimizasyonları yapabiliriz.

  Eğer ORM’yi controller’da tutarsak daha hızlı geliştirme yapabiliriz,
  ancak performans problemlerini kontrol edemeyiz.

* Raw SQL’i her yerde kullanabiliriz,
  ancak geliştirme hızını yavaşlatabilir.

---

## Trade-offs

* Repository katmanı daha karmaşık hâle gelir
* Ancak uzun vadede performans ve bakım avantajı sağlar

---
