const { query, pool } = require('../database');

const PLANS = {
  free: { name: 'Free', price: 0, features: ['5 contatos', '10 negocios', '1 usuario'] },
  pro: { name: 'Pro', price: 49.90, features: ['500 contatos', 'Ilimitado negocios', '3 usuarios', 'Automacoes', 'Relatorios avancados'] },
  enterprise: { name: 'Enterprise', price: 199.90, features: ['Contatos ilimitados', 'Negocios ilimitados', 'Usuarios ilimitados', 'Automacoes', 'Relatorios', 'API access', 'Suporte prioritario'] },
};

exports.getPlans = (req, res) => {
  res.json(PLANS);
};

exports.checkout = async (req, res) => {
  const client = await pool.connect();
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

    await client.query('BEGIN');

    const paymentResult = await client.query(`
      INSERT INTO payments (user_id, plan, amount, status, payment_method, card_last4, card_name, billing_email, expires_at)
      VALUES ($1, $2, $3, 'completed', 'credit_card', $4, $5, $6, $7)
      RETURNING id
    `, [userId, plan, planData.price, last4, card_name, billing_email || '', expiresAt.toISOString()]);

    await client.query('UPDATE users SET plan = $1 WHERE id = $2', [plan, userId]);

    await client.query('COMMIT');

    const userResult = await query('SELECT id, name, email, plan, role FROM users WHERE id = $1', [userId]);

    res.json({
      message: 'Pagamento processado com sucesso',
      payment: {
        id: paymentResult.rows[0].id,
        plan,
        amount: planData.price,
        last4,
        expiresAt: expiresAt.toISOString(),
      },
      user: userResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: 'Erro ao processar pagamento' });
  } finally {
    client.release();
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const result = await query('SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar pagamentos' });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });
    if (userResult.rows[0].plan === 'free') return res.status(400).json({ error: 'Voce ja esta no plano Free' });

    await query("UPDATE users SET plan = 'free' WHERE id = $1", [req.userId]);
    await query("UPDATE payments SET status = 'cancelled' WHERE user_id = $1 AND status = 'completed'", [req.userId]);

    res.json({ message: 'Assinatura cancelada. Plano rebaixado para Free.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
};

exports.adminGetAllPayments = async (req, res) => {
  try {
    const { user_id } = req.query;
    let sql = 'SELECT p.*, u.name as user_name, u.email as user_email FROM payments p JOIN users u ON p.user_id = u.id';
    const params = [];
    let paramIndex = 1;
    if (user_id) {
      sql += ` WHERE p.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex += 1;
    }
    sql += ' ORDER BY p.created_at DESC LIMIT 100';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar pagamentos' });
  }
};
