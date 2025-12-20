use sql_bench;
explain analyze
select * 
from orders 
where user_id =284
order by created_at desc;
