module.exports = {
    MPESA: {
        CONSUMER_KEY: 'COLE_SEU_CONSUMER_KEY_AQUI',
        CONSUMER_SECRET: 'COLE_SEU_CONSUMER_SECRET_AQUI',
        SHORTCODE: '51273',  // Sandbox: 400000
        PASSKEY: 'COLE_SUA_PASSKEY_AQUI',
        ENDPOINT: 'https://api.m-pesa.co.mz',  // Produção Moçambique
        CALLBACK_URL: 'https://SEU_NGROK.ngrok.io/callback'
    },
    
    ADMIN: ['258XXXXXXXX@c.us'],  // SEU NÚMERO +258
    
    PRODUTOS: {
        PREMIUM: { nome: 'Plano Premium', valor: 1500 },
        VIP: { nome: 'Plano VIP', valor: 3500 }
    }
};
