
---
## Context

Bu projede farklı seviyelerde testler (Unit, Integration, E2E) yazılması gerekmektedir. Sistem; business logic, veritabanı, dış servisler ve kullanıcı etkileşimlerini içeren çok katmanlı bir yapıya sahiptir. Tüm sistemi yalnızca tek bir test türüyle doğrulamak; hız, maliyet, bakım zorluğu ve hata ayıklama problemlerine yol açmaktadır.

## Decision

* Testlerin büyük çoğunluğu **Unit Test** olacaktır.
* Orta katmanda **Integration Test**’ler yer alacaktır.
* En üstte, sınırlı sayıda **E2E Test** yazılacaktır.

### Unit Test

* En küçük işlevsel birimler (fonksiyon, metod, class) izole şekilde test edilir.
* Dış bağımlılıklar (DB, Redis, Third-Party API’ler) mock’lanır.
* Gerçek veritabanı bağlantısı kurulmaz.
* Hızlı çalışır ve her commit’te CI/CD pipeline’da koşar.
* Amaç: Business logic’in doğru çalıştığını garanti altına almak.

### Integration Test

* Birden fazla bileşenin birlikte çalışması test edilir.
* Gerçek veritabanı kullanılır (production dışı test DB).
* Mock kullanımı minimum seviyededir.
* Repository, API ve DB katmanları arasındaki uyum doğrulanır.
* Test isolation sağlamak için her testten önce veritabanı temizlenir.
* Amaç: Sistem parçalarının birlikte doğru çalıştığını doğrulamak.

### E2E Test

* Gerçek kullanıcı senaryoları uçtan uca test edilir.
* Frontend’den başlayarak backend, veritabanı ve dış servisleri kapsar.
* En yavaş ve en kırılgan test türüdür.
* Sadece kritik akışlar (happy path) test edilir.
* Mock data kullanılmaz (ödeme sistemleri gibi zorunlu istisnalar hariç).
* Amaç: Sistem genelinin kullanıcı açısından çalıştığını doğrulamak.

## Consequences

* Testler daha hızlı çalışır ve CI/CD süreçleri verimli olur.
* Hatalar erken aşamada yakalanır.
* Hata kaynağı daha kolay tespit edilir.
* Test bakım maliyeti kontrol altında tutulur.
* Kod refactoring süreçleri güvenli hale gelir.

* Integration ve E2E testler daha yavaş çalışır.
* E2E testlerin bakımı maliyetlidir.
* Test ortamları (test DB, servisler) için ek altyapı gereklidir.

## Alternatives Considered

* **Sadece E2E test yazılması:** Çok yavaş, kırılgan ve maliyetli olduğu için reddedildi.
* **Sadece Unit test yazılması:** Sistem entegrasyon hatalarını yakalayamadığı için yetersiz bulundu.
* **Flat test stratejisi:** Testlerin amaçlarının net ayrılmaması sebebiyle tercih edilmedi.

## Notes

* Unit testler varsayılan ve zorunlu test türüdür.
* Integration testler, DB ve servis etkileşimi olan alanlar için yazılır.
* E2E testler sadece kritik kullanıcı akışları için yazılır.
* Test stratejisi proje büyüdükçe periyodik olarak gözden geçirilmelidir.

---