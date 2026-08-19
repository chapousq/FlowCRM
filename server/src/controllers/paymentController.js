const db = require('../database');

const PLANS = {
  free: { name: 'Free', price: 0, features: ['5 contatos', '10 negocios', '1 usuario'] },
  pro: { name: 'Pro', price: 49.90, features: ['500 contatos', 'Ilimitado negocios', '3 usuarios', 'Automacoes', 'Relatorios avancados'] },
  enterprise: { name: 'Enterprise', price: 199.90, features: ['Contatos ilimitados', 'Negocios ilimitados', 'Usuarios ilimitados', 'Automacoes', 'Relatorios', 'API access', 'Suporte prioritario'] },
};

exports.getPlans = (req, res) => {
  res.json(PLANS);
};

exports.checkout = (req, res) => {
  try {
    const userId = req.userId;
    const { plan, card_name, card_number, card_expiry, card_cvv, billing_email } = req.body;

    if (!PLANS[plan]) return res.status(400).json({ error: 'Plano invalido' });
    if (plan === 'free') return res.status(400).json({ error: 'Nao e possivel comprar plano Free' });

    if (!card_name || !card_number || !card_expiry || !card_cvv) {
      return res.status(400).json({ error: 'Dados do cartao obrigatorios' });
    }

    const cleanCard = card_number.replace(/\s/g, '');
    if (cleanCard.length < 13 || cleanCard.length > 19) {
      return res.status(400).json({ error: 'Numero do cartao invalido' });
    }

    const [expMonth, expYear] = card_expiry.split('/');
    if (!expMonth || !expYear || parseInt(expMonth) < 1 || parseInt(expMonth) > 12) {
      return res.status(400).json({ error: 'Data de validade invalida' });
    }

    if (!card_cvv || card_cvv.length < 3 || card_cvv.length > 4) {
      return res.status(400).json({ error: 'CVV invalido' });
    }

    const last4 = cleanCard.slice(-4);
    const planData = PLANS[plan];

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const insertPayment = db.prepare(`
      INSERT INTO payments (user_id, plan, amount, status, payment_method, card_last4, card_name, billing_email, expires_at)
      VALUES (?, ?, ?, 'completed', 'credit_card', ?, ?, ?, ?)
    `);

    const updateUser = db.prepare('UPDATE users SET plan = ? WHERE id = ?');

    const result = db.transaction(() => {
      const payment = insertPayment.run(userId, plan, planData.price, last4, card_name, billing_email || '', expiresAt.toISOString());
      updateUser.run(plan, userId);
      return payment;
    })();

    const user = db.prepare('SELECT id, name, email, plan, role FROM users WHERE id = ?').get(userId);

    res.json({
      message: 'Pagamento processado com sucesso',
      payment: {
        id: result.lastInsertRowid,
        plan,
        amount: planData.price,
        last4,
        expiresAt: expiresAt.toISOString(),
      },
      user,
    });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: 'Erro ao processar pagamento' });
  }
};

exports.getMyPayments = (req, res) => {
  const payments = db.prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(payments);
};

exports.cancelSubscription = (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });
  if (user.plan === 'free') return res.status(400).json({ error: 'Voce ja esta no plano Free' });

  db.prepare("UPDATE users SET plan = 'free' WHERE id = ?").run(req.userId);
  db.prepare("UPDATE payments SET status = 'cancelled' WHERE user_id = ? AND status = 'completed'").run(req.userId);

  res.json({ message: 'Assinatura cancelada. Plano rebaixado para Free.' });
};

exports.adminGetAllPayments = (req, res) => {
  const { user_id } = req.query;
  let query = 'SELECT p.*, u.name as user_name, u.email as user_email FROM payments p JOIN users u ON p.user_id = u.id';
  const params = [];
  if (user_id) {
    query += ' WHERE p.user_id = ?';
    params.push(user_id);
  }
  query += ' ORDER BY p.created_at DESC LIMIT 100';
  const payments = db.prepare(query).all(...params);
  res.json(payments);
};
