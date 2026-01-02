
---
Kullanıcı kimlik bilgileri, oturumlar, token’lar ve hassas verilerle çalışmaktadır.
Sistem performansı tek başına yeterli değildir; veri güvenliği sağlanamazsa sistem başarısız kabul edilir.

Bu nedenle güvenlik, opsiyonel bir özellik değil zorunlu bir mimari gereksinim olarak ele alınmıştır.

Uygulama; SQL Injection, Broken Authentication, zayıf JWT yönetimi, MFA yanlış kullanımı, password reset açıkları ve API güvenlik eksikliklerine karşı korunmalıdır.

---