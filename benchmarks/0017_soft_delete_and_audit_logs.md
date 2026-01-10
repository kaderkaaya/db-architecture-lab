
---

## Soft Delete

Neden Kullanırız? Veritabanından bir veriyi gerçekten sildiğinde (DELETE FROM...), o veri sonsuza dek gider. Ancak gerçek hayatta hatalı silmeler olur veya silinen verinin geçmiş raporlar için saklanması gerekir. Soft Delete, veriyi silmek yerine "silindi" olarak işaretlemektir.

Kullanmazsak Ne Olur? Kullanıcı yanlışlıkla bir siparişi sildiğinde geri döndüremezsin. Ayrıca veriler arasındaki ilişki bozulabilir (Örn: Bir kullanıcıyı sildiğinde, onun eski siparişleri "sahipsiz" kalır).

Nasıl Yapılır? Tabloya deleted_at (timestamp) veya is_deleted (boolean) kolonu eklenir.

-> UPDATE users SET deleted_at = NOW() WHERE id = 1;

-> SELECT * FROM users WHERE deleted_at IS NULL;

- Soft Delete kullandığında, tüm SELECT sorgularına otomatik olarak WHERE deleted_at IS NULL ekleyen bir yapı (Middleware veya Global Scope) kurmalısın. Aksi halde silinen veriler her yerde görünmeye devam eder.

## Audit Logs

Neden Kullanırız? "Bu kullanıcının şifresini kim değiştirdi?", "Bu ürünün fiyatını kim, ne zaman güncelledi?" gibi soruların cevabını bulmak için. Audit Logs, sistemdeki kritik değişikliklerin iz düşümünü tutar.

Kullanmazsak Ne Olur? Bir güvenlik ihlali olduğunda veya veride bir tutarsızlık yaşandığında "suçluyu" veya "hatayı" bulamazsın. Sistem bir kara kutuya dönüşür.

Neleri Kaydederiz?
Kim: İşlemi yapan User ID.
Ne Zaman: Timestamp.
Hangi İşlem: CREATE, UPDATE, DELETE.
Eski Veri: Değişiklikten önceki hali (JSON).
Yeni Veri: Değişiklikten sonraki hali (JSON).

- Audit Logs'u farklı bir tabloda kaydederiz.

```txt
entity_type   → user / order / payment
entity_id     → 123
action        → CREATE / UPDATE / DELETE
old_value     → önceki veri
new_value     → yeni veri
user_id       → işlemi yapan
ip_address
created_at
```

```json
{
  "entity": "users",
  "entity_id": 5,
  "action": "UPDATE",
  "old_value": { "email": "a@mail.com" },
  "new_value": { "email": "b@mail.com" },
  "user_id": 12,
  "created_at": "2026-01-05 14:30"
}
```
********************************
 User “delete” tuşuna bastı
 Soft delete yapıldı
 Audit log yazıldı
********************************

- Soft delete veri güvenliği içindir ama audit log hesap verebilirlik içindir.

*** Biz sistemde bir status alanı ve updated_at tarihi kullanarak kullanıcının business durumunu (aktif, bloke, beklemede vb.) ve yapılan genel güncellemeleri takip edebiliriz. updated_at, kayıtta herhangi bir değişiklik olduğunda güncellenir; ancak bu alan, kaydın silindiğini ifade etmez.
Soft delete yaklaşımında ise amaç, kaydı veritabanından fiziksel olarak silmeden, mantıksal olarak silinmiş gibi işaretlemektir. Bunun için deleted_at alanı kullanılır. deleted_at, kaydın normal yaşam döngüsünden çıktığı tam zamanı temsil eder. ORM seviyesinde (örneğin Sequelize’da paranoid özelliği ile) bu kayıtlar varsayılan sorgulardan otomatik olarak dışlanır.
Soft delete sayesinde kullanıcı hesabı geçici olarak kapatılabilir ve gerektiğinde tekrar aktif hale getirilebilir. Buradaki temel amaç, veriyi tamamen kaybetmemek; geri alma, audit ve hukuki gereksinimleri karşılayabilmektir. Evet, bu yaklaşım veritabanını zamanla büyütebilir ancak bunun için arşivleme veya periyodik temizlik gibi çözümler vardır.
Önemli nokta şudur: Soft delete bir state (durum) değildir, bir lifecycle event’tir.
Lifecycle, bir kaydın hayatı boyunca başına gelen, zaman çizelgesinde yer alan olayları ifade eder. Silme işlemi bu çizelgede geri döndürülemez bir olaydır; ancak soft delete sayesinde bu olayın etkisi (kaydın pasif olması) geri alınabilir.***

---