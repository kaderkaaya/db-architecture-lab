use sql_bench;
start transaction;

insert into orders(product_id,quantity)
values (1,2);

update products
set stock = stock - 2
where id = 1;

commit;

rollback;