const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Mpesa } = require('./mpesa');
const { validarCodigo } = require('./confirmacao');
const sqlite3 = require('sqlite3');
const config = require('./config.js');

const db = new sqlite3.Database('database.sqlite');

// Tabelas automáticas
db.run(`CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT,
    nome TEXT,
    produto TEXT,
    valor INTEGER,
    mpesa_ref TEXT,
    codigo TEXT,
    status TEXT DEFAULT 'Pendente',
    data DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('🇲🇿 ESCANEIA O QR CODE ABAIXO:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ BOT M-PESA MOÇAMBIQUE ONLINE!');
    console.log('💰 Aguardando vendas 24/7...');
});

client.on('message', async (msg) => {
    if (msg.fromMe) return;
    
    const chat = await msg.getChat();
    if (!chat.isGroup && !msg.from.includes('@g.us')) return;
    
    const texto = msg.body.toUpperCase().trim();
    const contato = await msg.getContact();
    
    console.log(`[${contato.pushname || 'Desconhecido'}]: ${msg.body}`);
    
    // 🛒 LISTA PRODUTOS
    if (['COMPRAR', 'PREÇO', 'PRODUTO', 'QUERO'].some(palavra => texto.includes(palavra))) {
        const produtos = `💎 *PRODUTOS MOÇAMBIQUE (MZN)*

🔥 *PREMIUM* - 1️⃣5️⃣0️⃣0️⃣ MZN
✅ 30 dias acesso total
✅ Suporte WhatsApp 24h

👑 *VIP* - 3️⃣5️⃣0️⃣0️⃣ MZN  
✅ Premium + Mentoria
✅ Grupo exclusivo VIP

💬 *Digite exatamente:* COMPRAR PREMIUM  ou  COMPRAR VIP`;
        
        return msg.reply(produtos);
    }
    
    // 💳 PROCESSA COMPRA M-PESA
    if (texto.startsWith('COMPRAR ')) {
        const produtoNome = texto.replace('COMPRAR ', '').trim();
        const produto = config.PRODUTOS[produtoNome];
        
        if (!produto) {
            return msg.reply('❌ *PRODUTO INVÁLIDO!*\nDigite: `COMPRAR PREMIUM` ou `COMPRAR VIP`');
        }
        
        try {
            // GERA PAGAMENTO M-PESA
            const mpesaRef = `MP${Date.now()}`;
            const resultado = await Mpesa.gerarPagamento(
                contato.number.replace('@c.us', ''),
                produto.valor,
                mpesaRef,
                `${produto.nome} - ${contato.pushname}`
            );
            
            // SALVA VENDA
            db.run(`INSERT INTO vendas (cliente, nome, produto, valor, mpesa_ref) 
                    VALUES (?, ?, ?, ?, ?)`,
                   [contato.number, contato.pushname, produto.nome, produto.valor, mpesaRef]);
            
            msg.reply(`🎉 *PAGAMENTO M-PESA CRIADO!*

📱 *M-Pesa pediu confirmação no seu telemóvel*
💰 *${produto.nome}*: ${produto.valor} MZN
🆔 *Referência:* ${mpesaRef}

✅ *COPIE o CÓDIGO DE 6 DÍGITOS* que apareceu e cole aqui!

*Exemplo: 123456*`);
            
            console.log(`💰 NOVA VENDA: ${contato.pushname} - ${produto.valor}MZN`);
            
        } catch (error) {
            console.error('Erro M-Pesa:', error.message);
            msg.reply('❌ Erro no M-Pesa. Tente novamente em 1min.');
        }
    }
    
    // ✅ CONFIRMAÇÃO CÓDIGO
    if (/^\d{6}$/.test(texto)) {
        const confirmada = await validarCodigo(contato.number, texto);
        if (confirmada) {
            msg.reply(`🎊 *PAGAMENTO CONFIRMADO!* ✅

👤 ${contato.pushname}
💎 ${confirmada.produto}
💰 ${confirmada.valor} MZN

📧 *Credenciais enviando...*
🔗 Link acesso: https://seusite.com/login

🇲🇿 OBRIGADO pela compra!`);
            
            // ADMIN NOTIFICAÇÃO
            config.ADMIN.forEach(adminNum => {
                client.sendMessage(adminNum, 
                    `💵 *VENDA CONFIRMADA!* 
👤 ${contato.pushname} 
💎 ${confirmada.produto} 
💰 ${confirmada.valor} MZN 
📱 ${contato.number}`);
            });
        } else {
            msg.reply('❌ *CÓDIGO INVÁLIDO!* Tente novamente.');
        }
    }
    
    // 👨‍💼 ADMIN RELATÓRIO
    if (texto === '!RELATORIO' && config.ADMIN.includes(msg.from)) {
        db.all('SELECT * FROM vendas WHERE data >= date("now", "-1 day")', (err, vendas) => {
            const total = vendas.reduce((sum, v) => sum + v.valor, 0);
            msg.reply(`📊 *RELATÓRIO 24H*
💰 Total: ${total} MZN
📦 Vendas: ${vendas.length}
✅ Confirmadas: ${vendas.filter(v => v.status === 'Confirmada').length}`);
        });
    }
});

client.initialize();
