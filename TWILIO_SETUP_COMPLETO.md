# 📞 TWILIO - SETUP COMPLETO (VideoCall + WhatsApp)

## 🎯 **CREDENCIAIS NECESSÁRIAS**

Para configurar Twilio, você precisa obter 4 credenciais:

### **1. Account SID e Auth Token**

Acesse: https://console.twilio.com/

Na dashboard principal, você verá:
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: [clique em "show" para ver]
```

---

### **2. API Key SID e API Key Secret (para Video)**

Acesse: https://console.twilio.com/us1/develop/video/manage/api-keys

Clique em **"Create new API Key"**:
- Name: "STRATEVO Video Calls"
- Copie: 
  - **SID:** SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  - **Secret:** [aparece UMA VEZ só, salve!]

---

### **3. WhatsApp Number**

Acesse: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

Siga o wizard para:
1. Conectar número WhatsApp Business
2. Aprovar template de mensagens
3. Copiar o número: `whatsapp:+14155238886` (sandbox) ou seu número real

---

## ⚙️ **CONFIGURAR NO .ENV.LOCAL**

Adicione estas variáveis ao `.env.local`:

```env
# TWILIO (VideoCall + WhatsApp)
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_API_KEY_SECRET=your_api_key_secret_here
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

## 📋 **ME ENVIE AS CREDENCIAIS**

Cole aqui neste formato:

```
ACCOUNT_SID: ACxxx...
AUTH_TOKEN: xxx...
API_KEY_SID: SKxxx...
API_KEY_SECRET: xxx...
WHATSAPP_NUMBER: whatsapp:+xxx...
```

E eu atualizo tudo automaticamente!

---

## 💰 **CUSTOS TWILIO**

### **Video API:**
- **Grátis:** 15.000 minutos/mês
- **Pago:** $0.004/minuto (~R$ 0,02/min)
- **100 calls de 15 min:** R$ 30/mês

### **WhatsApp API:**
- **Sandbox:** Grátis (para testes)
- **Produção:** 
  - Conversas iniciadas pelo cliente: Grátis (primeiras 1.000/mês)
  - Conversas iniciadas por você: ~R$ 0,30/conversa
  - **100 mensagens/mês:** R$ 30

### **TOTAL:** ~R$ 60/mês (muito acessível!)

---

**Obtenha as credenciais e me envie!** 🚀

