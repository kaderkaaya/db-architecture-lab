use sql_bench;
explain analyze
select * 
from users 
where email ='user500@test.com';