use sql_bench;
CREATE TABLE users (
  id BIGINT PRIMARY KEY auto_increment,
  name VARCHAR(100)
);
 insert into users(name)
 select concat('user',n,'namew')
 from(
  select @row := @row +1 as n
  from information_schema.tables,
  (select @row:=0) r
  limit 100
 )
 t;

CREATE TABLE orders (
  id BIGINT PRIMARY KEY auto_increment,
  user_id BIGINT,
  total_price DECIMAL(10,2),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
insert into orders(user_id,total_price)
select
 u.id as user_id,
 floor(1+rand() *999) as total_price
 from users u
 cross join(
  select @row := @row +1 as n
  from information_schema.tables,
  (select @row:=0) r
  limit 100
 )t;