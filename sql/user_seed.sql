use sql_bench;

create table  if not exists users(
 id  int not null AUTO_INCREMENT,
 email char(50),
 created_at  date,
 primary key(id)
 );
 
 insert into users(email, created_at)
 select concat('user',n,'@test.com') as email,
 now() - interval(n%365) day as created_at
 from(
  select @row := @row +1 as n
  from information_schema.tables,
  (select @row:=0) r
  limit 10000
 )
 t;
