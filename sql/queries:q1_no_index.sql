use sql_bench;

explain analyze
select *
from orders 
where user_id = 500;
