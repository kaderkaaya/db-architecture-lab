Biz ORM  kullanarak veri erişimi sğlarız.Ancak yanlış kullanım durumunda N+1 problemi ve kontrolsüz query üretiminden kaynaklı performans sorunları ortaya çıkar.

- ORM'yi sadece repository katmannında kullanmalıyız controller ve service katmanında ORM'ye doğrudan erişmemesi gerekir.

- ORM'ler otomatik query üretir ve n+1 problemleri ortaya çıkarabilir.Bundan dolayı bu katmanda toplamalıyız burda querylerimizi yönetebilir ve performans optimizasyonları yapabiliriz. Eğer ORM'yi controllerde tutarsak daha hızlı geliştirme yapabiliriz ama performans problemlerini kontrol edemeyiz.

- Raw SQL'i her yerde kullanabiliriz ama geliştirme hızını yavaslatabilir.

## Trade-offs
- Repository katmanı daha karmaşık hale gelir.
- Ancak uzun vadede performans ve bakım avantajı sağlar.