[no_index](../sql/queries:q1_no_index.sql)
[no_index](../sql/queries:q2_no_index.sql)
[no_index](../sql/queries:q3_no_index.sql)

Orders tablosunda bir sorgu yazarken, bu sorgu farklı bir tablodan gelen bir foreign key üzerinden olabilir ya da users tablosunda e‑posta ile bulduğumuz bir kullanıcının id değeri üzerinden çalışabilir.

Eğer bu alanlar üzerinde index yoksa ve tabloda belirli bir kaydı arıyorsak (örneğin user_id = 500 olan bir kullanıcı), veritabanı sorguyu çalıştırırken önce tüm tabloyu tarar (table scan), ardından user_id = 500 olan kaydı filtreler.

Bu senaryoda, orders tablosundan user_id = 500 olan kullanıcının bilgilerini almak için yazılan sorgu, indeks olmadığı için bütün tabloyu taramak zorunda kalır. Bu durum, özellikle büyük projelerde ve yüksek veri hacminde ciddi bir performans maliyetine yol açabilir.

Eğer sorgularımız beklenenden geç cevap veriyorsa, bir alanı where koşulu içinde sık sık kullanıyorsak ya da aynı filtreleme sürekli yapılıyorsa, ilgili kolona index eklemek gerekir. Index kullanımı, aranan kaydın daha hızlı bulunmasını sağlar ve sorgu performansını ciddi şekilde artırır.

Aşağıda, index olmayan bir durumda sorgunun önce tabloyu tarayıp daha sonra filtreleme yaptığına dair zaman ve maliyet hesaplaması yer almaktadır:

'-> Filter: (orders.user_id = 500)  (cost=34.6 rows=34.4) (actual time=0.106..0.115 rows=1 loops=1)\n    -> Table scan on orders  (cost=34.6 rows=344) (actual time=0.0625..0.0998 rows=344 loops=1)\n'
[with_index](../sql/queries:q4_with_index.sql)

Aşağıda, orders tablosunda idx_users_id seklinde bir index eklediğimde direk olarak benim verdiğim indexle birlikte sadece user_id = 284 olan kullanıcıları getirir ve daha sonra tarihe göre sort eder bu durumda tablo full scan olmaz.

'-> Sort: orders.created_at DESC  (cost=0.7 rows=2) (actual time=0.0965..0.0965 rows=2 loops=1)\n    -> Index lookup on orders using idx_users_id (user_id = 284)  (cost=0.7 rows=2) (actual time=0.0665..0.0686 rows=2 loops=1)\n'
