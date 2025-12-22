use sql_bench;
explain analyze
select * 
from posts
where created_at < '2024-01-01 10:00:00'
order by created_at desc
limit 10;