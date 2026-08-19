# FlowCRM

Sistema CRM SaaS para gestão de vendas B2B.

## Funcionalidades

- Dashboard com métricas em tempo real
- Gestão de contatos com score automático
- Pipeline de negócios (Kanban)
- Atividades e follow-ups
- Tags e organização
- Templates de email
- Automações inteligentes
- Relatórios avançados
- Sistema de pagamentos
- Painel administrativo
- Onboarding guiado

## Stack

- **Frontend:** React + Vite
- **Backend:** Express.js + SQLite
- **Auth:** JWT + bcrypt
- **Segurança:** Helmet, rate limiting, XSS protection

## Deploy Railway

1. Crie uma conta em [railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Adicione as variáveis de ambiente:
   - `JWT_SECRET` - chave secreta forte
   - `NODE_ENV` - production
   - `CORS_ORIGIN` - https://seu-app.up.railway.app
4. Deploy automático!

## Desenvolvimento

```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
npm run dev
```

## Licença

ISC
