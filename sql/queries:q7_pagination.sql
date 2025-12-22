use sql_bench;
explain analyze
select * 
from posts
order by created_at desc
limit 10 offset 0;