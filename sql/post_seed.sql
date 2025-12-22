use sql_bench;

create table posts(
id int auto_increment primary key,
title varchar(255),
created_at date not null
);

insert into posts(title,created_at)
select 
concat('post-',rand()),
now() - interval floor(rand() *365) day
from 
 information_schema.tables t1,
  information_schema.tables t2
  limit 200000;