use sql_bench;
 explain analyze
 select * from orders
 where user_id = 200
 order by created_at desc
 limit 10;

Tek başına user_id index’i WHERE koşulunu hızlandırır ama ORDER BY için yeterli değildir.

Composite index sayesinde hem filtreleme hem sıralama index üzerinde yapılır ve filesort ortadan kalkar.

 ## Composite Index:
 birden fazla kolonu içeren tek bir index.
CREATE INDEX idx_user_created
ON orders(user_id, created_at); 

-> bu tek bir indextir ama 2 columnu birlikte içerir. söyle açıklayayım önce tablodan user_id'ye ait kayıtları bulur daha sonra created_at'e göre sıralama yapar. çünkü eğer sadece user_idye index eklersek burda bütün tabloyu scan etmeden o kullanıcıya ait rowları getirir ama sıralama yaparken tekrar maliyet artar bunun için composite index kullanırız.Composite index ayrı ayrı indexler değildir ve where ve order by'i birlikte optimize edemez.

-> composite indexte index girerken sıralama önemlidir. user_id -> created_at burda önce o idye ait kullanıcıları bulur daha sonra olusturma tarihine göre sıralama yapar. Eğer bunu tam tersi yaparsam benim sorguma göre önce tabloda bulunan bütün rowları created_ate göre sıralar daha sonra user_id ye göre filtreleme yapar bu da yine bize maliyetli olur.