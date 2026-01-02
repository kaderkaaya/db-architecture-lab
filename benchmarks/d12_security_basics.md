
---

## Security Basics

İlk olarak neden security basics kullanmaya ihtiyaç duyarız, bunu açıklayacağım. Daha sonra hangi yöntemlerle koruruz, bunlara bakacağız.

-> Security bir özellik değil, bizim için bir **zorunluluktur**. Çünkü kodumuz ne kadar hızlı çalışırsa çalışsın, veriyi koruyamazsak başarısız sayılırız. Bundan dolayı güvenlik sağlarız.

---

## SQL Injection

Kullanıcının girdi alanına kod yazarak veritabanına sızabilir. Bunu, kullanıcının girdiği bilgileri doğrudan sorguya eklemeden yapabiliriz. Yani ORM kullanarak bunu çözebiliriz.

Sorgularımız şu şekilde olabilir:

```js
User.findOne({ where: { email } });
```

Eğer sorgumuz bu şekilde olursa:

```js
db.query(`SELECT * FROM users WHERE email='${email}'`);
```

Saldıran kişi:

```js
email = ' OR 1=1 --
```

Şeklinde sorgu yaparsa bütün kullanıcıları dönebilir. Bunun için ORM kullanarak yapmalıyız. Tabii ki bu %100 güvenli değildir ama injection riskini çok azaltır.

-> Başarılı bir SQL Injection saldırısı, kullanıcının yetkisi olmayan erişimlerin şifrelerine, kredi kartı detaylarına veya kişisel kullanıcı bilgileri gibi hassas verilerine ulaşmasına neden olabilir.

---

## Broken Authentication

Zayıf şifreler ve hatalı JWT yönetimiyle ortaya çıkar.

-> Authentication, kullanıcının iddia ettiği kişi olduğunu kanıtlama sürecidir.
-> Broken Authentication ise bu sürecin yanlış, eksik ve güvensiz uygulanmasıdır.
-> Burada “sen kimsin?” diye sorar ama cevabı gerçekten doğrulamaz.

### Nasıl Ortaya Çıkar?

* Zayıf şifre politikaları
* Brute-force’a karşı koruma olmaması
* Token / session hataları
* MFA (2FA) eksikliği veya yanlış implementasyonu
* Login state’in yanlış yönetilmesi

```txt
POST /login
email: test@test.com
password: 123456
```

* Eğer yukarıdaki gibi bir endpoint yazarsak, deneme sayısını sınırsız yapmış oluruz. Rate limit olmadığı için saniyede binlerce deneme yapılabilir.
* Eğer şifre gücünü zorlamıyorsak, yani şifre için regex ile kontrol yapmıyorsak ya da validation yapmıyorsak, broken authentication ortaya çıkar.

---

### Session Fixation

**Kötü akış:**

* User siteye girer → `session_id=abc`
* Login olur
* Session ID değişmez

**Problem:**
Saldırgan önceden `abc` session’ını biliyorsa, login sonrası da yetkilidir.

**Doğru davranış:**
Login sonrası yeni session oluşturulmalı.

---

### JWT Hataları

Eğer süresi bitmeyen token varsa:

```json
{
  "userId": 42
}
```

`exp`, `iat` yoksa token çalındığı an ömür boyu geçerli olur.

* Logout’ta token’ı iptal etmeliyiz. Çünkü user logout olunca iptal etmezsek:

  * JWT hâlâ valid
  * Blacklist yok
  * Refresh token iptal edilmez

Bu durumda logout sahte olur.

---

### MFA (2FA) Yanlış Kullanımı

Eğer:

* MFA sadece admin’lerde var
* “Hatırla beni” ile sonsuza kadar atlanıyor
* SMS kodu rate-limit’siz

Bunları yaparsak MFA var gibi durur ama işlevsiz olur.

---

### Password Reset Açıkları

Eğer reset linkimiz şu şekilde olursa:

```bash
/reset?token=123
```

Token:

* Kısa
* Tekrar kullanılabilir
* Süresiz

Olur ve tüm hesaplar ele geçirilebilir.

---

### Nasıl Önlenir?

✔ **Güçlü Authentication Kuralları**

* Minimum şifre uzunluğu (12+)
* Complexity (harf, sayı, sembol)
* Common password blacklist

✔ **Brute Force Koruması**

* Rate limit
* IP + user bazlı limit
* Hesap kilitleme
* CAPTCHA

✔ **Session & Token Güvenliği**

* Login sonrası session rotate
* JWT:

  * `exp`, `iat`, `aud`, `iss`
  * Short-lived access token
  * Secure refresh token

✔ **MFA**

* Kritik işlemlerde zorunlu
* Backup codes
* Rate-limited OTP

✔ **Password Reset**

* Tek kullanımlık
* Kısa süreli (5–15 dk)
* Hash’lenmiş token

---

### Şifreleme (Encryption) vs. Hashleme (Hashing)

**Hashing (Tek yönlü):**
Girdi bir kez hashlenirse geri döndürülemez. Şifreler için kullanılır.
(Örn: bcrypt, Argon2)

**Encryption (Çift yönlü):**
Bir anahtar (key) ile şifrelenir ve aynı veya farklı anahtar ile geri açılabilir (decrypt).
Mesajlaşmalar veya hassas veriler için kullanılır.
(Örn: AES, RSA)

**Salting:**
Hashleme yapılırken şifrenin sonuna rastgele karakterler eklenmesidir. Bu sayede iki kişinin şifresi “123456” olsa bile hash’leri farklı görünür.

---

## Security Headers

Tarayıcıya “beni koru” diyoruz. Node.js’te Helmet kütüphanesi ile otomatik olarak yaparız.

* **XSS (Cross-Site Scripting):**
  Saldırganın senin sitende yabancı JS kodu çalıştırması.
  **Çözüm:** Content Security Policy (CSP) başlığını kullan ve kullanıcı girdilerini her zaman sanitize et (HTML karakterlerini temizle).

* **CSRF (Cross-Site Request Forgery):**
  Kullanıcının haberi olmadan onun adına senin sitende işlem yapılması.
  (Örn: Yan sekmede açık olan bir siteden banka hesabına para gönderme isteğinin tetiklenmesi)
  **Çözüm:** CSRF token kullan veya çerezleri `SameSite=Strict` yap.

---

## API Güvenliği (Best Practices)

* **Rate Limiting:**
  DoS / Brute Force saldırılarını engellemek için saniye başına istek sınırı koy.

* **Input Validation:**
  “Kullanıcıdan gelen her veri zehirlidir.”
  (Joi veya Zod kütüphaneleri ile veri tipini ve uzunluğunu kontrol et.)

* **CORS (Cross-Origin Resource Sharing):**
  API’ne sadece senin belirlediğin domain’lerin (örn: sadece `seninsiten.com`) erişmesine izin ver.

```js
const cors = require('cors');

// Buraya origin gelmezse, gelirse var mı yok mu kontrolü ekleyebilirim.
const allowedOrigins = ['http://localhost:3001'];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  maxAge: 30 * 24 * 60 * 60,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// CORS options’ları kendimiz manuel şekilde ayarlayabiliriz.
// Bunu ekleyebilirim.
app.use(cors(corsOptions));
```

* CORS bir tarayıcı (browser) güvenliği özelliğidir.
  Postman, cURL veya sunucu taraflı kodlar (Python, Node.js vb.) CORS kısıtlamalarına takılmaz.
  CORS’un asıl amacı, son kullanıcının tarayıcısının kötü niyetli web siteleri tarafından bir saldırı aracı olarak kullanılmasını engellemektir.

---

## Kimlik Yönetimi ve JWT Güvenliği

* JWT anahtarlarını kodun içine değil, `.env` dosyasına yazarak ve GitHub’a yüklemediğimizde bunu engelleriz.
* Refresh token’ları, tarayıcıdaki JS kodlarının ulaşamayacağı **HttpOnly** çerezlerde saklarız.

---
