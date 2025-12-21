SELECT u.id, u.name, o.id, o.total_price
FROM users u
JOIN orders o ON o.user_id = u.id;
