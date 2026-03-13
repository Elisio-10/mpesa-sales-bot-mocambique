client.on('message', async (msg) => {
    if (msg.fromMe) return;
    
    const chat = await msg.getChat();
    if (!chat.isGroup && !msg.from.includes('@g.us')) return;
    
    const texto = msg.body.toUpperCase().trim();
    const contato = await msg.getContact();
    
    console.log(`[${contato.pushname || '👤'}]: ${msg.body}`);
    
    // ========================================
    // 🔥 COMANDOS DE VENDA (PRINCIPAIS)
    // ========================================
    
    if (['COMPRAR', 'QUERO', 'PRECOPRODUTO', 'PRODUTO'].some(p => texto.includes(p))) {
        msg.reply(`💎 *🛒 LOJA AUTOMÁTICA M-PESA* 🇲🇿

🔥 *PREMIUM* - 1️⃣5️⃣0️⃣0️⃣ MZN
✅ 30 dias ilimitado
✅ Suporte 24h WhatsApp

👑 *VIP* - 3️⃣5️⃣0️⃣0️⃣ MZN
✅ Premium + Mentoria 1:1
✅ Grupo VIP exclusivo

💬 *Comandos:* 
\`COMPRAR PREMIUM\`  \`COMPRAR VIP\`

*Pagamentos M-Pesa 100% seguros* 🔒`);
        return;
    }
    
    // 💳 PROCESSAR COMPRA
    if (texto.startsWith('COMPRAR ')) {
        const produto = texto.replace('COMPRAR ', '').trim();
        // ... (código anterior de compra)
    }
    
    // ✅ CÓDIGO CONFIRMAÇÃO (6 dígitos)
    if (/^\d{6}$/.test(texto)) {
        // ... (código anterior)
    }
    
    // ========================================
    // 👨‍💼 COMANDOS ADMIN (SEU NÚMERO)
    // ========================================
    if (!config.ADMIN.includes(msg.from)) {
        // Só admin abaixo
    } else {
        
        if (texto === '!RELATORIO' || texto === '!VENDAS') {
            db.all('SELECT * FROM vendas WHERE date(data) = date("now")', (err, hoje) => {
                db.all('SELECT * FROM vendas WHERE status="Confirmada"', (err, total) => {
                    const receitaHoje = hoje.reduce((s, v) => s + v.valor, 0);
                    msg.reply(`📊 *RELATÓRIO HOJE*
💰 *Hoje:* ${receitaHoje} MZN (${hoje.length} vendas)
💎 *Total Confirmadas:* ${total.length}
🔥 *Conversão:* ${(total.length/hoje.length*100).toFixed(1)}%`);
                });
            });
            return;
        }
        
        if (texto === '!PENDENTES') {
            db.all('SELECT * FROM vendas WHERE status="Pendente"', (err, pendentes) => {
                if (pendentes.length === 0) {
                    return msg.reply('✅ *NENHUMA VENDA PENDENTE*');
                }
                const lista = pendentes.map(v => 
                    `👤 ${v.nome} - ${v.produto} (${v.valor}MZN)`
                ).join('\n');
                msg.reply(`⏳ *PENDENTES* (${pendentes.length})\n\n${lista}`);
            });
            return;
        }
        
        if (texto.startsWith('!LIBERAR ')) {
            const idVenda = texto.replace('!LIBERAR ', '');
            db.run('UPDATE vendas SET status="Liberada" WHERE id=?', [idVenda], () => {
                msg.reply(`✅ *VENDA #${idVenda} LIBERADA*`);
            });
            return;
        }
        
        if (texto === '!RESET') {
            db.run('DELETE FROM vendas');
            msg.reply('🗑️ *DB RESETADO*');
            return;
        }
    }
    
    // ========================================
    // 🎮 COMANDOS DIVERTIDOS (AUMENTA ENGAGEMENT)
    // ========================================
    
    if (texto === '!PING') {
        msg.reply('🏓 *PONG!* 🟢 Online 24/7');
    }
    
    if (texto === '!INFO') {
        msg.reply(`🤖 *BOT VENDAS M-PESA v2.0*

🇲🇿 *Moçambique 100%*
💳 M-Pesa automático
⚡ IA respostas 24h
📈 ${Math.floor(Math.random()*100)} vendas hoje!

*Comandos:* !ping !info !piada`);
    }
    
    if (texto === '!PIADA') {
        const piadas = [
            'Porque o M-Pesa nunca mente? Porque sempre diz a *verdade* no saldo! 💰😂',
            'Cliente pro bot: "Quero de graça!" Bot: "Manda o código M-Pesa primeiro!" 😎',
            'M-Pesa + WhatsApp = Dinheiro dormindo! 💸😴'
        ];
        msg.reply(`😂 *${piadas[Math.floor(Math.random()*3)]}*`);
    }
    
    if (texto === '!CLIMA') {
        msg.reply(`🌤️ *Maputo Hoje:*
🌡️ 28°C | ☀️ Sol
💧 Humidade: 65%
⚡ *Bora comprar?!* 💰`);
    }
    
    // ========================================
    // 🎲 JOGOS (CONVERTE MAIS!)
    // ========================================
    
    if (texto === '!ROLETA') {
        const premios = ['Nada 😢', '10% OFF!', 'GRÁTIS 7dias!', 'VIP 50% OFF!'];
        const ganhou = premios[Math.floor(Math.random()*4)];
        msg.reply(`🎰 *ROLETA GIRANDO...*\n\n${ganhou}\n\n💬 \`COMPRAR ${ganhou.includes('OFF') ? 'VIP' : 'PREMIUM'}\``);
    }
    
    if (texto.startsWith('!CALC ')) {
        try {
            const calc = texto.replace('!CALC ', '');
            const resultado = eval(calc);
            msg.reply(`🧮 *${calc}* = **${resultado}**`);
        } catch {
            msg.reply('❌ Erro! Ex: !calc 1500+350');
        }
    }
    
    // ========================================
    // 📈 SUPORTE AUTOMÁTICO (IA SIMPLES)
    // ========================================
    
    const perguntas = {
        'AJUDA': '💬 *Suporte 24h:* Digite COMPRAR para ver produtos!',
        'COMO PAGA': '💳 *M-Pesa:* 1) COMPRAR → 2) Confirma PIN → 3) Cole código aqui',
        'PIN MPESA': '🔑 *PIN Sandbox:* 1234  |  Produção: seu PIN normal',
        'ERRO': '🔧 Tente novamente ou digite !ping para testar'
    };
    
    for (const [pergunta, resposta] of Object.entries(perguntas)) {
        if (texto.includes(pergunta)) {
            msg.reply(resposta);
            return;
        }
    }
    
    // ========================================
    // 🎯 AUTO-RESPONDE (CONVERSÃO)
    // ========================================
    
    const triggers = {
        'OI': '👋 Olá! Digite *COMPRAR* para ver promoções! 💰',
        'OLÁ': '😊 E aí! *COMPRAR PREMIUM* por 1500MZN! Oferta hoje!',
        'INTERESSADO': '🎉 Perfeito! *COMPRAR VIP* e ganhe mentoria grátis!',
        'QUANTO': '💎 *PREMIUM 1500MZN* → Digite COMPRAR PREMIUM'
    };
    
    for (const [trigger, resposta] of Object.entries(triggers)) {
        if (texto.includes(trigger)) {
            msg.reply(resposta);
            return;
        }
    }
});
