
---

## File Upload

* Dosyaları veritabanında saklamamız gerekir çünkü DB’yi çok yorar; bunun yerine dosya sistemleri kullanırız. Local ve Cloud (S3) gibi.

- Security riski
- Storage maliyeti
- Performance bottleneck
- Scalability problemi

oluşturur.

Şimdi Local ve Cloud Storage’a bakalım.

**Local Storage:** Dosyaları doğrudan uygulamanın çalıştığı sunucunun diskine, örneğin `/uploads` klasörüne kaydetmektir.
Eğer projemiz küçükse kullanabiliriz, düşük maliyetlidir ve hızlı geliştirme için kullanırız.
Eğer kullanmazsak:
Ölçeklenemez (Scalability): İkinci bir sunucu açtığında, kullanıcı dosyasını 1. sunucuya yüklediyse 2. sunucudan o dosyaya erişemez.

Veri kaybı: Sunucu çökerse veya Docker container silinirse tüm dosyaların gider.

* Genelde Multer kütüphanesi kullanırız.

```txt
/uploads/avatar.png
```

Yukarıda olduğu gibi yükleriz.

* Kurulumu hızlıdır.

AMA

* Server ölürse dosya gider
* Horizontal scaling imkansız
* CDN yok
* Backup zor
* Docker / Kubernetes uyumsuz

**Cloud Storage (S3, GCS, Azure Blob):**

```txt
s3://my-bucket/users/42/avatar.png
```

* Dosya yüklediğimizde bu şekilde gözükür.
* Dosyaları saklamak için hazırlanmış devasa bir dosya havuzudur.
* Limitsiz kapasitesi vardır.
* Dosyalar dünyanın her yerinden hızlıca çekilebilir. (Yüksek erişilebilirlik)
* Node.js’i dosya okuma/yazma yükünden kurtarırız.

Eğer kullanmazsak?

* Büyük ölçekli bir projede disk yönetimi ve yedekleme (backup) tam bir kabusa dönüşür.

* S3 bir disk değildir; folder yoktur, sadece object vardır.

```txt
Key: users/42/avatar.png
Value: binary file
```

File upload flow
Client → (direct) → S3
    ↑
  Backend (signature)

1. Client “upload istiyorum” der
2. Backend presigned URL üretir
3. Client dosyayı direkt S3’e upload eder
4. Backend sadece metadata saklar

* Sunucunun (Node.js) RAM ve network kaynakları dosya yükleme işlemiyle meşgul edilmez.

Presigned URL neden şart?

* Backend bandwidth kullanmaz
* Upload süresi backend’i kilitlemez
* Dosya boyutu sınırsız
* Güvenli

```txt
POST https://s3.amazonaws.com/bucket/key?signature=...
```

Peki DB’de ne saklarız?

```json
{
  "id": 123,
  "key": "users/42/avatar.png",
  "bucket": "my-bucket",
  "mimeType": "image/png",
  "size": 345678
}
```

File Upload Security:

File Type Validation: Sadece belirli uzantılara (örn: .jpg, .pdf) izin ver. Uzantıyı sadece isme bakarak değil, dosyanın Magic Number (dosya başlığı) kısmına bakarak doğrula.

File Size Limit: 100 GB’lık bir dosya yükleyerek diskini veya bandwidth’ini bitirmelerini engelle.

Filename Sanitization: Kullanıcıdan gelen dosya ismini asla olduğu gibi kullanma! `../../etc/passwd` gibi bir isimle sistem dosyalarına ulaşmaya çalışabilirler. Dosyayı her zaman rastgele bir ID (UUID) ile isimlendir.

```json
users/{userId}/{uuid}.png
users/42/550e8400-e29b-41d4.png
```

---

Deleting & lifecycle

Dosya silme:
S3 delete
DB soft delete

Lifecycle rules:
30 gün sonra archive
90 gün sonra delete

---

*** Local:
multer + disk
MinIO (S3 compatible) ***

*** Prod:
S3 + presigned URL
CloudFront ***

* Production’da file upload için backend’i sadece presigned URL üretmekte kullanırız. Dosyalar S3’te private tutulur, erişim signed URL ile sağlanır. CDN ile servis ederiz.

KISACA:

* Local = dev only
* Prod = S3 / Cloud
* Backend proxy olmaz
* Presigned URL şart
* DB’de metadata
* UUID naming
* Private by default
* CDN kullan

CDN (CloudFront):
Client → CloudFront → S3
Cache
Daha hızlı
Daha ucuz
S3 tek başına CDN değildir

<!--  
"Resim yükleme özelliğini nasıl tasarlarsın?"  
"Küçük bir MVP ise Local Storage ile başlarım ancak profesyonel ve ölçeklenebilir bir sistem için AWS S3 gibi bir Cloud Storage kullanırım. Sunucumu yormamak için Presigned URL yapısını tercih ederim. Güvenlik için ise dosya tipi doğrulaması yapar ve dosyaları rastgele isimlerle saklarım. Statik dosyaları kullanıcılara daha hızlı ulaştırmak için ise önüne bir CDN (CloudFront) koyarım."  
-->

---
