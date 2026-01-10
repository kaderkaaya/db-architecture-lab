
---

## Authentication & Authorization

* Evet, ilk olarak **Authentication** nedir?

**Authentication:** Giriş yapma sürecidir ya da şöyle diyebiliriz: Kullanıcının iddia ettiği kişi olduğunu kanıtlama sürecidir.

Kullanılan yöntemler:

* ID / Şifre → En klasik yöntem
* Social Auth (OAuth2): Google, Apple veya GitHub ile giriş yapma
* Multi-Factor Auth (MFA / 2FA): Şifreye ek olarak telefona gelen SMS veya Authenticator kodu

---

Authentication’da kullanıcı giriş yaptıktan sonra her sayfada tekrar şifre sormamak için iki yol izlenir:

1. **Session-Based:**
   Sunucu tarafında bir “oturum” açılır, kullanıcıya bir `session_id` (cookie) verilir.
   Sunucu bu ID’yi hafızasında (veya Redis’te) tutar.

2. **Token-Based (JWT):**
   Sunucu, kullanıcıya imzalı bir JSON Web Token (JWT) verir.
   Sunucu bu token’ı hafızasında tutmaz; token’ın içindeki imzayı kontrol ederek geçerli olup olmadığını anlar.
   (Modern web ve mobil uygulamalarda standart budur.)

---

### Peki nedir bu JWT?

JWT, DB sorgusu yapmadan kullanıcıyı tanımamızı sağlar.
Bu imza nasıl oluşuyor peki?

* JWT şifreleme değil, **imzadır**.

1. **Header:** Algoritma tipi (HS256 vb.)
2. **Payload:** Kullanıcı verileri (userId, role, email).
   **Uyarı:** Buraya asla şifre veya gizli veri koyma; çünkü bu kısım sadece Base64 ile encode edilmiştir ve herkes okuyabilir.
3. **Signature:** Token’ın yolda değiştirilmediğini kanıtlayan, gizli anahtar (Secret Key) ile oluşturulan kısım

---

Burada kullanıcıya **2 tane token** veririz:

### Access Token

* Kullanıcının API’ye istek atarken beraberinde gönderdiği kısa ömürlü tokendir.
* **Görevi:** Kullanıcının kimliğini kanıtlamak ve yetkili olduğu işlemleri yapmasını sağlamak
* **Ömrü:** Çok kısadır (15 dakika – 1 saat)
* **Nerede saklanır?** Genelde tarayıcı belleğinde veya LocalStorage içinde tutulur

### Refresh Token

* Access token süresi dolduğunda, kullanıcıyı tekrar “Giriş Yap” sayfasına yönlendirmeden yeni bir access token almak için kullanılır.
* **Görevi:** Sadece yeni bir access token üretmek
* **Ömrü:** Uzundur (7 gün – 30 gün)
* **Nerede saklanır?** En güvenli yer olan `HttpOnly` ve `Secure` işaretli cookie (çerez) içinde
  Bu sayede JavaScript kodları (ve XSS saldırıları) bu token’a ulaşamaz.
* **DB Kaydı:** Genellikle veritabanında saklanır ki kullanıcıyı sistemden atmak istersen (logout) bu token’ı iptal edebilesin.
* **Risk:** Çalınırsa saldırgan bu süre zarfında kullanıcı gibi davranabilir. Ömrünün uzun olması bu riski artırır.

---

### Neden ikisini birden kullanıyoruz?

* Sadece uzun ömürlü bir Access Token kullansaydık:

  * Token bir kez çalındığında, saldırgan 1 ay boyunca hesapta at koştururdu.
  * Bunu iptal etme şansın olmazdı; çünkü JWT’ler **stateless**’tır (sunucudan bağımsız yaşarlar).

* **İkili yapıda ise:**

  * Access token çalınsa bile 15 dakika sonra geçersiz olur.
  * Refresh token sadece sunucuya, gizli bir cookie ile gönderildiği için çalınması çok daha zordur.
  * Çalındığından şüphelenirsen, DB’den refresh token’ı silerek saldırganın yeni access token almasını engelleyebilirsin.

---

* Kullanıcı logout yaptığında DB’den refresh token’ı sileriz.
* Kullanıcı login yaptığında süreç:

1. Email + password
2. Password hash kontrolü
3. Access token üret
4. Refresh token üret
5. Refresh token’ı DB’ye kaydet
6. Access token → response
7. Refresh token → HttpOnly cookie

---

## Authorization

**Authorization:** Yetki kontrolüdür.
Kimliği doğrulanmış bir kullanıcının hangi kaynaklara erişebileceğini belirler.

### Yetkilendirme Modelleri

* **RBAC (Role-Based Access Control):**
  En yaygın modeldir. Kullanıcılara “Admin”, “User” gibi roller verilir.

* **ABAC (Attribute-Based Access Control):**
  Daha karmaşık ve esnektir. Konuma, zamana veya cihaz türüne göre yetki verilir.

---

### Authentication ve Authorization hangi katmanlarda kontrol edilir?

| Katman                   | Ne Yapar           |
| ------------------------ | ------------------ |
| Controller               | Request / Response |
| Auth Middleware          | Token doğrulama    |
| Authorization Middleware | Role kontrolü      |
| Service                  | İş kuralı          |
| Repository               | DB                 |

* Access Token çalınırsa saldırganın elindeki süre kısıtlı olsun diye kısa tutarız. Refresh Token çalınırsa, veritabanından bu token'ı silerek (Blacklisting/Revocation) tüm oturumları geçersiz kılabiliriz.
 
---
