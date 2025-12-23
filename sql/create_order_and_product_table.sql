use sql_bench;
create table products(
id bigint primary key auto_increment,
name varchar(100),
stock int not null
);

create table orders(
id bigint primary key auto_increment,
product_id bigint,
quantity int,
created_at datetime default now()
);
