const axios = require('axios');
const config = require('./config.js');

class MpesaMozambique {
    constructor() {
        this.token = null;
        this.expires = 0;
    }
    
    async autenticar() {
        if (Date.now() < this.expires) return this.token;
        
        const auth = Buffer.from(`${config.MPESA.CONSUMER_KEY}:${config.MPESA.CONSUMER_SECRET}`).toString('base64');
        
        try {
            const res = await axios.get(`${config.MPESA.ENDPOINT}/ipg/v1/oauth/token`, {
                headers: { Authorization: `Basic ${auth}` },
                params: { grant_type: 'client_credentials' }
            });
            
            this.token = res.data.access_token;
            this.expires = Date.now() + (res.data.expires_in * 1000 * 0.9);
            return this.token;
        } catch (e) {
            throw new Error('Falha autenticação M-Pesa: ' + e.message);
        }
    }
    
    async gerarPagamento(telefone, valor, referencia, descricao) {
        const token = await this.autenticar();
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const senha = Buffer.from(`${config.MPESA.SHORTCODE}${config.MPESA.PASSKEY}${timestamp}`).toString('base64');
        
        const dados = {
            BusinessShortCode: config.MPESA.SHORTCODE,
            Password: senha,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: valor,
            PartyA: telefone.replace('258', '258'),
            PartyB: config.MPESA.SHORTCODE,
            PhoneNumber: telefone.replace('258', '258'),
            CallBackURL: config.MPESA.CALLBACK_URL || 'https://webhook.site/mpesa-callback',
            AccountReference: referencia,
            TransactionDesc: descricao
        };
        
        const res = await axios.post(
            `${config.MPESA.ENDPOINT}/ipg/v1x/ipg/stkpushquery`,
            dados,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        return res.data;
    }
}

module.exports = new MpesaMozambique();
