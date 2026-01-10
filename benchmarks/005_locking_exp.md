Eğer isolation levels yeterli olmazsa locking yapmak gerekir.
```js
async function withdrawMoney(accountId, amount) {
    // 1. Önce hesabın güncel halini oku (Bakiye ve Versiyonu al)
    const account = await db.query(
        'SELECT balance, version FROM accounts WHERE id = $1', 
        [accountId]
    );
    
    const currentBalance = account.rows[0].balance;
    const currentVersion = account.rows[0].version; // Örn: 10

    // 2. İş mantığı kontrolü (Bakiye yeterli mi?)
    if (currentBalance < amount) {
        throw new Error("Yetersiz bakiye!");
    }

    const newBalance = currentBalance - amount;

    // 3. GÜNCELLEME (Optimistic Locking Katmanı)
    const result = await db.query(
        `UPDATE accounts 
         SET balance = $1, version = version + 1 
         WHERE id = $2 AND version = $3 
         RETURNING *`,
        [newBalance, accountId, currentVersion] // Sadece versiyon hala 10 ise güncelle!
    );

    // 4. Çakışma Kontrolü
    if (result.rowCount === 0) {
        // Eğer buraya girdiyse, biz 1. adımda veriyi okuduktan hemen sonra
        // başka bir ATM (veya işlem) gelip parayı çekmiş ve versiyonu 11 yapmış demektir.
        throw new Error("İşlem çakışması! Başka bir cihazdan işlem yapıldı, lütfen tekrar deneyin.");
    }

    return { message: "Para çekme başarılı", newBalance: result.rows[0].balance };
}
```