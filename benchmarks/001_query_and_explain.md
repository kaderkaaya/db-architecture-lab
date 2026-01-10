
---
## Query Optimization
Veritabanına bir soru sorduğunda (SELECT...), veritabanı bu veriye ulaşmak için bir Execution Plan hazırlar. Optimizasyon, bu yol planını en kısa ve en az maliyetli hale getirme sanatıdır.

-> Eğer yapmazsak veri miktarı arttıkça sorgular yavaşlar, CPU tavan yapar, uygulama donar ve kullanıcılar siteni terk eder.

-> Burda bizim hedefimiz veritabanının diskten okuduğu satır sayısını ve işlem yükünü minimize etmektir.
**************************************
Aynı sonucu üreten iki sorgudan:
biri 50 ms
diğeri 3 saniye sürüyorsa
hızlı olan optimize edilmiş sorgudur.
**************************************
Prod ortamda şunlar olur:
Yavaş sorgu → CPU yükselir
CPU yükselir → diğer istekler yavaşlar
DB kilitlenir → sistem çöker
***************************************

PEKİ NASIL HIZLANDIRIRIZ?

A. Index Kullanımı
En yaygın ve en etkili yöntemdir. Sık sorguladığın (WHERE, JOIN, ORDER BY) kolonlara index eklemelisin.

-> Çok fazla index eklemek INSERT ve UPDATE işlemlerini yavaşlatır, çünkü her kayıtta indexlerin de güncellenmesi gerekir.

B. SELECT * Kullanma
İhtiyacın olmayan kolonları çekme. SELECT * yerine sadece SELECT id, name yaz. Bu, ağ trafiğini ve bellek kullanımını azaltır.

C. Wildcard (Yüzde İşareti) Kullanımı
LIKE 'abc%': Başına index koyabilir, hızlıdır.

LIKE '%abc': Yavaştır! Baştaki yüzde işareti indexi devre dışı bırakır, tüm tabloyu taratır.

D. N+1 Problemi (JOIN vs Subquery)
Döngü içinde veritabanına gitme. 100 kullanıcı için 100 ayrı sorgu atmak yerine, JOIN kullanarak tek bir sorguda işi bitir.


## Explain

Bir sorgunun neden yavaş olduğunu anlamak için tahmin yürütmeyiz; sorgunun başına EXPLAIN anahtar kelimesini koyarız. EXPLAIN SELECT * FROM users WHERE email = 'test@test.com';
Bu komutu çalıştırdığında veritabanı sana bir tablo döner. Bu tabloda bakman gereken en kritik alanlar şunlardır:
type:

ALL: En kötüsü! "Full Table Scan" demektir. Veritabanı aradığını bulmak için tablodaki her şeyi okumuştur.

index: Tüm index ağacını okumuştur.

ref veya const: En iyisi! Direkt bir index kullanarak hedef noktaya gitmiştir.

rows: Veritabanının bu sorgu için tahminen kaç satırı incelediğini gösterir. Bu sayı ne kadar küçükse o kadar iyidir.

key: Sorgu sırasında hangi indexin kullanıldığını (veya kullanılmadığını) gösterir.

```txt
***********************************************
1️⃣ Yavaş sorguları logla
2️⃣ EXPLAIN ile planı gör
3️⃣ Index mi eksik, query mi kötü karar ver
4️⃣ Gerekirse query rewrite
5️⃣ Tekrar EXPLAIN
***********************************************
```

Index eklemek son çaredir, ilk refleks değil.
-> EXPLAIN’e baktım, full scan vardı, query’yi rewrite ettim.


---