
---

## Scaling (Ölçekleme)

Sistemin artan kullanıcı sayısını, istek yükünü ve veri miktarını kaldırabilecek şekilde büyütülmesidir. Burada amacımız sistem çökmesin, response time uzamasın, kullanıcı sayısı artsa bile performans stabil kalsın.

## Horizontal Scaling

Horizontal scaling, sisteme daha fazla sunucu/makine ekleyerek yükü dağıtmak anlamına gelir (**Scale Out**). Burada toplam kapasiteyi artırıyoruz. Şöyle düşünelim: Bir tane çok güçlü bilgisayar yerine 10 tane orta seviye bilgisayar kullanmak gibi. Mantığı, daha fazla makine eklemektir. Aynı işi yapan, benzer konfigürasyonlu yeni sunucular eklenir. Trafiği paylaştırmak için bir Load Balancer (Yük Dengeleyici) gerekir. Teorik olarak istediğimiz kadar makine ekleyebiliriz. Eğer bir sunucu bozulursa, load balancer trafiği diğerlerine yönlendirir; böylece sistem ayakta kalır. Eğer ihtiyaç kalmazsa makineleri kapatıp maliyeti düşürebiliriz. Ama burada Load Balancer kullanıyoruz ve Load Balancer gibi ekstra araçların yönetimi ve maliyeti eklenir.

**Nasıl Yapılır:**

* Yeni sunucular ekleme
* Load Balancer kullanma
* Distributed sistemler oluşturma
* Microservices mimarisi
* Container orchestration (Kubernetes gibi)

**Avantajları:**

* Teorik olarak sınırsız ölçeklenebilir
* Yüksek erişilebilirlik (High Availability) sağlar
* Bir sunucu çökerse sistem çalışmaya devam eder
* Daha ucuz donanımlar kullanılabilir
* Downtime olmadan ölçeklendirilebilir
* Coğrafi dağıtım yapılabilir

**Dezavantajları:**

* Kompleks mimari gerektirir
* Veri tutarlılığı (consistency) zorlukları
* Network overhead vardır
* Session yönetimi karmaşıklaşır
* Debugging ve monitoring zordur
* Uygulama kodunun dağıtık sisteme uygun olması gerekir
* Lisanslama maliyetleri artabilir

**Kullanım Senaryoları:**

* Web uygulamaları
* Microservices mimarileri
* Büyük ölçekli sistemler
* Cloud-native uygulamalar
* Stateless servisler

## Vertical Scaling

Bir diğer scaling türü ise vertical scaling’dir (**Scale Up**). Dikey ölçekleme, mevcut olan tek bir sunucunun kapasitesini artırmak demektir. Bir bilgisayara daha fazla RAM takmak veya işlemcisini (CPU) daha güçlü bir modelle değiştirmek buna örnektir. Buradaki amacımız, elimizdeki makineyi daha güçlü yapmaktır. RAM, CPU, disk kapasitesi (SSD) veya ağ bant genişliğini artırmayı içerir. Eğer bir örnek verecek olursak, AWS’de bir EC2 `t3.micro` instance’ını `t3.large` modeline yükseltmek. Burada mimariyi değiştirmeniz gerekmez. Tek bir sunucu üzerinde her şey aynı kalır. Kodunuzun dağıtık sistemlere uygun (stateless) olması gerekmez. Tüm işlemler aynı makinede olduğu için ağ gecikmesi yaşanmaz. Ama bazı dezavantajları vardır. Mesela bir makinenin fiziksel bir sınırı vardır. Dünyanın en güçlü sunucusuna ulaştığınızda daha fazla büyüyemezsiniz. Eğer sunucu bozulursa tüm sistem çöker.
Vertical scaling, mevcut sunucunun kaynaklarını artırarak sistemi güçlendirmek anlamına gelir.

**Nasıl Yapılır:**

* Daha fazla RAM ekleme
* Daha güçlü CPU’ya yükseltme
* Daha hızlı disk (SSD) ekleme
* Daha yüksek network bandwidth sağlama

**Avantajları:**

* Uygulama kodunda değişiklik gerektirmez
* Yönetimi basittir (tek makine)
* Veri tutarlılığı sorunları yoktur
* Network gecikmesi (latency) yoktur
* Lisanslama maliyetleri daha düşük olabilir (bazı yazılımlar makine başına lisanslanır)

**Dezavantajları:**

* Fiziksel sınırlar vardır (bir sunucuya sonsuz RAM takılamaz)
* Tek hata noktası (Single Point of Failure) oluşturur
* Downtime gerektirir (donanım değişimi için sistemi kapatmak gerekir)
* Maliyeti üstel artar (2x performans için 3–4x fiyat ödeyebilirsiniz)
* Belirli bir noktadan sonra performans artışı azalır

**Kullanım Senaryoları:**

* Monolitik uygulamalar
* Veritabanları (özellikle RDBMS)
* Küçük–orta ölçekli sistemler
* Hızlı çözüm gereken durumlar

## Hangisini Seçmeli?

Hangi yöntemi seçeceğiniz şunlara bağlıdır:

* Sistem ihtiyaçları
* Bütçe
* Teknik ekip yetkinliği
* Gelecek büyüme beklentileri
* Uygulama mimarisi

**Startup / Küçük Projeler:**
Genellikle Vertical Scaling ile başlanır çünkü yönetimi kolaydır ve trafik henüz çok yüksek değildir.

**Büyük Ölçekli / Kritik Sistemler:**
Google, Netflix veya e-ticaret siteleri gibi yapılar Horizontal Scaling kullanmak zorundadır. Tek bir sunucu, ne kadar güçlü olursa olsun, milyonlarca anlık isteği kaldıramaz.


-> Önce vertical ile başlarız, sınırına gelince horizontal’a geçeriz.
-> Genelde sistemlere vertical scaling ile başlarız çünkü basit ve hızlıdır.
Trafik artıp donanım sınırına yaklaştığımızda, uygulamayı stateless hale getirip horizontal scaling’e geçeriz.
App server’lar horizontal ölçeklenirken, veritabanları çoğu zaman vertical ölçeklenir.
Yüksek erişilebilirlik ve fault tolerance gerekiyorsa horizontal scaling tercih edilir.


| Özellik         | Vertical Scaling   | Horizontal Scaling  |
| --------------- | ------------------ | ------------------- |
| Sunucu sayısı   | 1                  | 1 → N               |
| Kurulum         | Kolay              | Zor                 |
| Maksimum büyüme | Sınırlı            | Çok yüksek          |
| Fault tolerance | Yok                | Var                 |
| Cloud uyumu     | Yok                | Var                 |
| Maliyet         | Uzun vadede pahalı | Uzun vadede verimli |
| Deploy          | Downtime olabilir  | Zero-downtime       |

---
