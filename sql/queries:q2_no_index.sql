use sql_bench;
 explain analyze
 select * from orders
 where user_id = 200
 order by created_at desc
 limit 10;