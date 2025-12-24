use sql_bench;

update products 
set stock = 5
where id = 5;
 
commit;