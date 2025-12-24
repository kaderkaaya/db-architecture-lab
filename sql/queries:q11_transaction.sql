use sql_bench;
set transaction isolation level read committed;
start transaction;
select stock from products where id =1