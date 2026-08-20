const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database');

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000;

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' })[c]).trim();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw) {
  return typeof pw === 'string' && pw.length >= 6 && pw.length <= 128;
}

exports.register = async (req, res) => {
  try {
    const name = sanitize(req.body.name);
    const email = sanitize(req.body.email);
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Nome deve ter entre 2 e 100 caracteres' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Senha deve ter entre 6 e 128 caracteres' });
    }

    const existing = (await query('SELECT id FROM users WHERE email = $1', [email])).rows[0];
    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = (await query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id', [name, email, hashedPassword]));

    const userId = result.rows[0].id;
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: userId, name, email, plan: 'free', role: 'user' } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    const email = sanitize(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = (await query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({ error: `Conta bloqueada. Tente novamente em ${remaining} minutos.` });
    }

    if (user.banned) {
      return res.status(403).json({ error: `Sua conta foi banida. Motivo: ${user.banned_reason || 'Nao especificado'}` });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const attempts = (user.login_attempts || 0) + 1;
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_TIME).toISOString();
        await query('UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3', [0, lockUntil, user.id]);
        return res.status(423).json({ error: 'Conta bloqueada por 30 minutos devido a múltiplas tentativas.' });
      }
      await query('UPDATE users SET login_attempts = $1 WHERE id = $2', [attempts, user.id]);
      return res.status(401).json({ error: `Email ou senha incorretos. ${MAX_LOGIN_ATTEMPTS - attempts} tentativas restantes.` });
    }

    await query("UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1", [user.id]);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role || 'user' } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = (await query('SELECT id, name, email, plan, role FROM users WHERE id = $1', [req.userId])).rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ ...user, role: user.role || 'user' });
  } catch (err) {
    console.error('Me error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
