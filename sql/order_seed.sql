use sql_bench;

create table  if not exists orders(
id int not null AUTO_INCREMENT,
user_id int,
total_price int,
created_at date,
primary key(id)
);

insert into orders(user_id,total_price,created_at)
select
 floor(1+rand() *999) as user_id,
 floor(1+rand() *999) as total_price,
 now() - interval(n%365) day as created_at
 from(
  select @row := @row +1 as n
  from information_schema.tables,
  (select @row:=0) r
  limit 10000
 )t;
