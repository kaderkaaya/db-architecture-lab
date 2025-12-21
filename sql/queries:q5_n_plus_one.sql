use sql_bench;

explain analyze
select * from users;
select * from orders where user_id= 1;
select * from orders where user_id = 2;
select * from orders where user_id = 3;
select * from orders where user_id = 4;
select * from orders where user_id = 5;
select * from orders where user_id = 6;
