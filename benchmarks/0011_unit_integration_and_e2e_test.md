
---

## Testing (Unit, Integration, E2E)

Bugün üzerinde duracağımız konu testing konusu; hangi teste ne zaman ihtiyaç duyarız ve hangi testi nerede kullanırız, bu konular üzerinde duracağız. İlk olarak neden test etmeye ihtiyaç duyarız, bu konuyu konuşalım.

Neden Test ederiz?

* Eğer test etmezsek bir yeri düzeltirken başka bir yeri bozabiliriz ama test eklersek neyin nereden bozulduğunu biliriz.

* Yeni bir özellik eklersek ve eğer testimiz olmazsa bozulabilir ve bozulduğunu anlamayabiliriz.

* Hatayı canlı ortamda bulmak, geliştirme ortamında bulmaktan daha maliyetlidir.

* Testler kodun ne yapması gerektiğini anlatan birer dokümandır.

* Testleri bir piramit olarak düşünebiliriz. En altta çok sayıda test ve hızlı test vardır ama en üstte az sayıda test, yavaş test bulunur.
  E2E        %5–10
  Integration   %20–30
  Unit            %60–70

* Unit Test -> Integration Test -> E2E test (Piramit)

Neden her şeyi E2E test ile test etmiyoruz, daha güvenli değil mi?
-> E2E testler çok yavaştır ve çok kırılgandır (flaky). Küçük bir CSS değişikliği bile testi bozabilir. Ayrıca hata bulduğunda sorunun nerede olduğunu tam söylemez. Bu yüzden piramidi takip edip ağırlığı Unit testlere vermeliyiz.

Şimdi ilk testimiz olan **Unit Test**’ten başlayalım.
Unit testi piramidin en altı olarak düşünebiliriz. Birim test olarak geçer. Bu test türü, yazılımın en küçük işlevsel birimlerini (fonksiyonlar, metodlar, sınıflar vb.) izole ederek test ederiz. Kodun parçalarını ayrı ayrı test ederek hataları erken aşamalarda tespit etmeye ve düzeltmeye yardımcı olur. Bu test türü, yazılımın diğer bölümleriyle bağımsız olarak çalışmalıdır ve diğer birimlerden etkilenmemelidir. Ayrıca, kod kalitesini artıran ve yazılımın istikrarını ve güvenilirliğini sağlayan önemli bir uygulamadır.

Neden Unit Test yazmalıyız?

* Hata tespitini erken aşamada sağlaması.
* Kodun güvenilirliğini sağlaması.
* Kodun değişikliklerden etkilenme riskini azaltması.
* Dokümantasyon sağlar.
* Refactoring’i (kodun yeniden düzenlenmesi) kolaylaştırır.

Test çalışma döngüsü genellikle “Arrange, Act, Assert” olarak, yani AAA biçiminde ifade edilir.

* Arrange (Düzenle):
  Testin gereksinimlerini oluşturmak ve ayarlamak için gerekli hazırlık adımlarını gerçekleştiririz.
  Test edilecek birimin durumunu ayarlamak için gerekli verileri hazırlarız.
  Gerekli bağımlılıkları oluşturabilir veya fake nesneler (mock objects) kullanarak bağımlılıkları taklit edebiliriz.
  Bu adımda testin başlangıç durumunu oluştururuz.

* Act (İşlem Yap):
  Önceden düzenlenen test durumunda test edilecek birimi (fonksiyonu, metodları vb.) çalıştırırız.
  Birim, üzerine çalıştırılacak işlemleri gerçekleştirir ve sonuçları üretir.
  Testi gerçekleştirmek için testin odaklandığı belirli işlevselliği tetikleriz.

* Assert (Doğrula):
  Act adımında elde edilen sonuçları beklenen sonuçlarla karşılaştırırız.
  Birimin beklenen çıktıları veya durumları üretip üretmediğini doğrulamak için assert ifadeleri kullanırız.
  Eğer beklenen sonuçlarla elde edilen sonuçlar eşleşiyorsa test başarılı olarak kabul edilir. Ancak sonuçlar eşleşmezse test başarısız olur ve bir hata olduğunu gösterir.

- Unit testte tek bir fonksiyon mantığı vardır. Aslında direkt olarak fonksiyon fonksiyon test ederiz.
- Unit testte mock data kullanırız (DB, diğer API’ler).
- Çok hızlıdır. Bundan dolayı çok fazla test yazılabilir.
- Unit testte gerçek DB ile bağlantı kurulmaz. Bu, unit testin doğasına aykırıdır.
- Unit testte test edeceğimiz sınıfın ismiyle bağlantılı olmalıdır.

Unit testte mocklamamız gerektiğini söyledim. Peki nedir bu mocking?
Mocking, bir sınıfın dışa bağımlılıklarını, gerçek uygulamalar yerine testlerde kontrol edilebilir sahte (mock) nesnelerle değiştirme işlemidir. Bu sayede testler, gerçek dışa bağımlılıkların sonuçlarından bağımsız olarak çalışabilir ve daha öngörülebilir hale gelir.

* Unit testler, gerçek bir işlem yapmadan sadece ilgili metodu izole ederek ve diğer bağımlılıkları mock nesnelerle yer değiştirerek çalıştırır.

Unit test exp:

```js
describe('create-category', () => {
    const mockCategory = {
        id: 1,
        name: "cat1",
        description: "this is a category",
        isActive: true,
        slug: "cat.com"
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Should create category', async () => {
        CategoryModel.create.mockResolvedValue(mockCategory);
        const result = await CategoryService.createCategory(mockCategory);
        expect(result).toEqual(mockCategory)
        expect(CategoryModel.create).toHaveBeenCalledTimes(1);
    });

    test('Should throw error if create category fails', async () => {
        CategoryModel.create.mockRejectedValue(new Error('Db error'));
        await expect(
            CategoryService.createCategory(mockCategory)
        ).rejects.toThrow('Db error')
    })
});
```
---

Şimdi diğer testimiz olan **Integration Teste geçelim:**

* Entegrasyon Test (Integration Test): Farklı bileşenlerinin veya modüllerinin bir araya getirilip çalışma uyumlarının, veri akışlarının, iş akışlarının ve veritabanı etkileşimlerinin test edildiği bir tür yazılım testidir.
* Buradaki asıl amaç, yazılım modüllerini bir araya getirerek doğruluğunu sağlamaktır.
* Entegrasyon testi, genellikle yazılım sistemi içinde birbirine bağlı olan farklı bileşenlerin (fonksiyonlar, modüller, servisler, alt sistemler vb.) birleştirilmesini hedefler.
* İki veya daha fazla parçanın (kod + veritabanı veya iki farklı servis) birbiriyle uyumlu çalışıp çalışmadığını test eder.
* Mock kullanımı burada azdır.
* Gerçek DB kullanılır. Query’ler gerçekten çalışıyor mu bakılır.
* Unit teste göre daha yavaştır.

Örnek olarak verecek olursak; bir CustomerApi projemiz var, endpoint’ler üzerinden database’de CRUD işlemleri yapmakta. Bu endpoint’lerin testini uçtan uca request handle’dan başlayıp business-layer’da yer alan logic’lerin bulunduğu metodları ve repository-layer üzerinden database’deki ilgili column’ların doğruluğuna kadar olan bu birbirine bağlı iki sistemin (database & API) uçtan uca kontrollerini integration test yazarak yapabiliriz.

* POSTMAN’de post, get ile attığımız request’ler birer integration testtir.
* Integration test ile aslında fonksiyonları birbirine bağlayıp çalışıyor mu, buna bakarız.

- Database Entegrasyonu: Yazdığın INSERT sorgusu gerçekten DB’ye gidiyor mu? Constraint’ler (Unique, Not Null vb.) doğru çalışıyor mu?
- Third-Party API’lar: Ödeme servisine (Stripe, Iyzico) gönderdiğin JSON verisi onların beklediği formatta mı?
- Servisler Arası İletişim: Auth servisinden aldığın token, sipariş servisi tarafından doğru doğrulanıyor mu?
- FileSystem: Bir dosya yüklediğinde gerçekten belirtilen klasöre yazılıyor mu?

* Burada gerçek DB kullanıyoruz diyoruz ama bu production DB değil. Testler için test DB açarız ve onu kullanırız.

Test Senaryosu:

1. Test veritabanına bağlan.
2. POST /register isteğini kullanıcı verileriyle birlikte gönder.
3. Kontrol 1: HTTP statü kodu 201 Created döndü mü?
4. Kontrol 2: Veritabanına gidip bak; o email adresiyle bir satır eklenmiş mi?
5. Kontrol 3: Şifre veritabanında “plain text” mi yoksa “hash’lenmiş” mi duruyor?

```js
// Integration Test (Jest & Supertest)
it('should save user to database and return 201', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ email: 'test@example.com', password: '123' });

  expect(response.status).toBe(201);
  
  // DB kontrolü
  const user = await User.findOne({ where: { email: 'test@example.com' } });
  expect(user).not.toBeNull();
  expect(user.password).not.toBe('123'); // Hash kontrolü
});
```

Entegrasyon testlerinde verilerin birbirine karışmasını nasıl önleriz???
→ Her testten önce veritabanını temizlerim (truncate). Testler birbirinden bağımsız olmalı. Test A’nın eklediği veri, Test B’nin sonucunu etkilememeli. Buna **Test Isolation** deriz.

Entegrasyon testleri neden Unit testlerden daha yavaştır?
→ Çünkü ağ üzerinden bir veritabanına bağlanmak, tablo oluşturmak, veri yazmak ve silmek fiziksel bir zaman alır. Unit testler ise sadece bellekte (RAM) çalışır.

| Başlık                   | Unit Test (Mock)            | Integration Test (Real DB)                          |
| ------------------------ | --------------------------- | --------------------------------------------------- |
| Test Seviyesi            | Fonksiyon / Class bazlı     | Servis / Modül bazlı                                |
| Odak Noktası             | İş mantığı (business logic) | Sistemler arası etkileşim                           |
| Amaç                     | Kod doğru mu çalışıyor?     | Tüm parçalar birlikte doğru mu çalışıyor?           |
| Veritabanı               | Mock / Stub / Fake          | Gerçek DB (Postgres, MongoDB vb.)                   |
| DB Kurulumu              | Gerekmez                    | Docker, Test Container veya In-memory DB            |
| Bağımlılıklar            | Tamamen izole               | Gerçek bağımlılıklar                                |
| Çalışma Hızı             | Çok hızlı (ms seviyesinde)  | Görece yavaş (saniyeler)                            |
| Hata Türleri             | Algoritmik hatalar          | Config, migration, connection, transaction hataları |
| CI/CD Uygunluğu          | Çok uygun (her commit)      | Sınırlı (pipeline’da seçili adımlar)                |
| Mock Riski               | Gerçek hayattan sapma riski | Gerçeğe çok yakın                                   |
| Hata Yakalama Gücü       | Düşük–Orta                  | Yüksek                                              |
| Örnek Senaryo            | Email servisi çağrıldı mı?  | Email gerçekten gönderildi mi?                      |
| En Çok Nerede Kullanılır | Saf business logic          | Repository, API, DB katmanı                         |

---

Şimdi piramidimizin en üstünde olan testimiz **E2E Teste geçelim:**

End-To-End (Uçtan Uca Test): E2E testi, uygulamanın gerçek bir kullanıcı senaryosunu baştan sona (FE’den DB’ye, dış servislerden e-posta gönderimine kadar) başarıyla tamamlayıp tamamlamadığını kontrol eder.

* Testler gerçek ortamlarda yapılır.
* Tarayıcının açılması, sayfaların yüklenmesi ve gerçek ağ istekleri nedeniyle en yavaş test türüdür.
* İnternet hızındaki anlık bir düşüş veya bir butonun CSS yerinin değişmesi testi patlatabilir. Bu yüzden en az sayıda ama en kritik senaryolar için yazılır.
* Her şeyi E2E ile test etmek bir hatadır (maliyet ve zaman kaybı). Sadece “Kritik Yol” (Happy Path) test edilmelidir:

1. Kullanıcı kayıt olma ve giriş yapma.
2. Sepete ürün ekleme ve ödeme sürecini tamamlama.
3. Şifremi unuttum akışı.

→ Cypress: Modern, hızlı ve geliştirici dostu. (En popüler kullanılan araçtır.)
→ E2E testte mock data kullanmayız ama bazı istisnalar vardır; mesela ödeme sistemlerinde test kartlar kullanırız.
→ E2E testinin bakımı zordur ve çok maliyetlidir. Küçük bir UI değişikliğinde yüzlerce E2E testini güncellemek geliştirme sürecini çok yavaşlatır. Bu yüzden mantıksal hataları Unit ve Integration ile çözer, E2E ile sadece ana akışların (critical paths) birbirine doğru bağlandığından emin oluruz.

Mock Data / Gerçek DB nerede kullanırız?

| Bileşen | Unit   | Integration |
| ------- | ------ | ----------- |
| DB      | ❌ mock | ✅ gerçek    |
| Redis   | ❌ mock | opsiyonel   |
| Service | ✅      | ✅           |
| HTTP    | ❌      | E2E         |

Peki neyi test etmeyiz biraz bunu anlatacağım?
1. Üçüncü Parti Kütüphaneler (Third-Party Libraries)
bcrypt'in şifreyi doğru hash'leyip hash'lemediğini test etmek senin işin değil, o kütüphaneyi yazanların işidir.
-> Biz bir fonksiyon test ederken o kütüphaneyi değil doğru yapılandırıp yapılandırmadığımızı test ederiz.
2. Framework ve Dil Özellikleri
Express.js'in rotaları (routing) doğru yönlendirip yönlendirmediğini veya JavaScript'in Array.map() fonksiyonunun doğru çalışıp çalışmadığını test etme.
3. Otomatik Oluşturulan Kodlar (Boilerplate / Auto-generated)
-> Mantık içermeyen sadece definition olan kodun unit test olmaz.
4. Private (Gizli) Fonksiyonlar / Metotlar
-> Dışarıya kapalı küçük yardımcı fonksiyonları tek tek unit testine sokma.
5. Sabit Veriler ve Sadece "Getter/Setter"lar
-> Sadece bir değeri döndüren (return this.name) veya bir değeri atayan fonksiyonlar için test yazılmaz.
6. Loglama ve Print İşlemleri
---