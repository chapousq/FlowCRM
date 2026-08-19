const db = require('../database');

exports.listUsers = (req, res) => {
  const { search, role, banned } = req.query;
  let query = 'SELECT id, name, email, role, plan, banned, banned_reason, created_at, last_login FROM users';
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }
  if (banned !== undefined) {
    conditions.push('banned = ?');
    params.push(parseInt(banned));
  }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';

  const users = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const admins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
  const bannedCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE banned = 1').get().count;
  const activeToday = db.prepare("SELECT COUNT(*) as count FROM users WHERE last_login >= date('now')").get().count;

  res.json({ users, stats: { total, admins, banned: bannedCount, activeToday } });
};

exports.getUser = (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, plan, banned, banned_reason, created_at, last_login FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

  const contacts = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE user_id = ?').get(req.params.id).count;
  const deals = db.prepare('SELECT COUNT(*) as count FROM deals WHERE user_id = ?').get(req.params.id).count;
  const activities = db.prepare('SELECT COUNT(*) as count FROM activities WHERE user_id = ?').get(req.params.id).count;

  res.json({ ...user, contacts, deals, activities });
};

exports.banUser = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (parseInt(id) === req.userId) {
    return res.status(400).json({ error: 'Voce nao pode banir a si mesmo' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Nao e possivel banir outro admin' });
  }

  db.prepare('UPDATE users SET banned = 1, banned_reason = ? WHERE id = ?').run(reason || 'Sem motivo especificado', id);
  res.json({ message: 'Usuario banido com sucesso' });
};

exports.unbanUser = (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

  db.prepare('UPDATE users SET banned = 0, banned_reason = "" WHERE id = ?').run(id);
  res.json({ message: 'Usuario desbanido com sucesso' });
};

exports.promoteUser = (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });
  if (user.banned) return res.status(400).json({ error: 'Nao e possivel promover usuario banido' });

  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(id);
  res.json({ message: 'Usuario promovido a admin' });
};

exports.demoteUser = (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.userId) {
    return res.status(400).json({ error: 'Voce nao pode rebaixar a si mesmo' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

  db.prepare("UPDATE users SET role = 'user' WHERE id = ?").run(id);
  res.json({ message: 'Admin rebaixado para usuario' });
};

exports.changePlan = (req, res) => {
  const { id } = req.params;
  const { plan } = req.body;
  const validPlans = ['free', 'pro', 'enterprise'];
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ error: 'Plano invalido' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

  db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, id);
  res.json({ message: `Plano alterado para ${plan}` });
};

exports.deleteUser = (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.userId) {
    return res.status(400).json({ error: 'Voce nao pode deletar a si mesmo' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

  db.prepare('DELETE FROM contact_tags WHERE contact_id IN (SELECT id FROM contacts WHERE user_id = ?)').run(id);
  db.prepare('DELETE FROM deal_history WHERE deal_id IN (SELECT id FROM deals WHERE user_id = ?)').run(id);
  db.prepare('DELETE FROM activities WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM deals WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM contacts WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM tags WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM email_templates WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM automations WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  res.json({ message: 'Usuario e todos os dados deletados' });
};

exports.updateUserRole = (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (parseInt(id) === req.userId) {
    return res.status(400).json({ error: 'Voce nao pode alterar seu proprio cargo' });
  }

  const validRoles = ['user', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Cargo invalido' });
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  res.json({ message: `Cargo alterado para ${role}` });
};
