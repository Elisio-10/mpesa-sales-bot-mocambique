const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');

async function validarCodigo(numero, codigoDigitado) {
    return new Promise(resolve => {
        db.get(`SELECT * FROM vendas WHERE cliente = ? AND status = 'Pendente' ORDER BY id DESC LIMIT 1`,
               [numero], (err, venda) => {
            
            if (!venda) return resolve(false);
            
            // SIMULAÇÃO - substitua por verificação real M-Pesa
            const codigoCorreto = '123456';  // Em produção: pega do callback
            
            if (codigoDigitado === codigoCorreto) {
                db.run(`UPDATE vendas SET status = 'Confirmada', codigo = ? WHERE id = ?`,
                       [codigoDigitado, venda.id]);
                resolve(venda);
            } else {
                resolve(false);
            }
        });
    });
}

module.exports = { validarCodigo };
