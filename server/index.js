require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./src/routes/auth');
const contactRoutes = require('./src/routes/contacts');
const dealRoutes = require('./src/routes/deals');
const activityRoutes = require('./src/routes/activities');
const dashboardRoutes = require('./src/routes/dashboard');
const tagRoutes = require('./src/routes/tags');
const templateRoutes = require('./src/routes/templates');
const automationRoutes = require('./src/routes/automations');
const reportRoutes = require('./src/routes/reports');
const adminRoutes = require('./src/routes/admin');
const paymentRoutes = require('./src/routes/payments');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 15 }), authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`FlowCRM rodando na porta ${PORT}`);
});
