const { query } = require('../database');

exports.listUsers = async (req, res) => {
  try {
    const { search, role, banned } = req.query;
    let sql = 'SELECT id, name, email, role, plan, banned, banned_reason, created_at, last_login FROM users';
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(name LIKE $${paramIndex} OR email LIKE $${paramIndex + 1})`);
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }
    if (role) {
      conditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex += 1;
    }
    if (banned !== undefined) {
      conditions.push(`banned = $${paramIndex}`);
      params.push(parseInt(banned));
      paramIndex += 1;
    }

    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC';

    const usersResult = await query(sql, params);
    const totalResult = await query('SELECT COUNT(*) as count FROM users');
    const adminsResult = await query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const bannedResult = await query('SELECT COUNT(*) as count FROM users WHERE banned = true');
    const activeTodayResult = await query("SELECT COUNT(*) as count FROM users WHERE last_login >= CURRENT_DATE");

    res.json({
      users: usersResult.rows,
      stats: {
        total: parseInt(totalResult.rows[0].count),
        admins: parseInt(adminsResult.rows[0].count),
        banned: parseInt(bannedResult.rows[0].count),
        activeToday: parseInt(activeTodayResult.rows[0].count),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar usuarios' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const userResult = await query(
      'SELECT id, name, email, role, plan, banned, banned_reason, created_at, last_login FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!userResult.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });

    const contactsResult = await query('SELECT COUNT(*) as count FROM contacts WHERE user_id = $1', [req.params.id]);
    const dealsResult = await query('SELECT COUNT(*) as count FROM deals WHERE user_id = $1', [req.params.id]);
    const activitiesResult = await query('SELECT COUNT(*) as count FROM activities WHERE user_id = $1', [req.params.id]);

    res.json({
      ...userResult.rows[0],
      contacts: parseInt(contactsResult.rows[0].count),
      deals: parseInt(dealsResult.rows[0].count),
      activities: parseInt(activitiesResult.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuario' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (parseInt(id) === req.userId) {
      return res.status(400).json({ error: 'Voce nao pode banir a si mesmo' });
    }

    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });
    if (userResult.rows[0].role === 'admin') {
      return res.status(400).json({ error: 'Nao e possivel banir outro admin' });
    }

    await query('UPDATE users SET banned = true, banned_reason = $1 WHERE id = $2', [reason || 'Sem motivo especificado', id]);
    res.json({ message: 'Usuario banido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao banir usuario' });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });

    await query("UPDATE users SET banned = false, banned_reason = '' WHERE id = $1", [id]);
    res.json({ message: 'Usuario desbanido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desbanir usuario' });
  }
};

exports.promoteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });
    if (userResult.rows[0].banned) return res.status(400).json({ error: 'Nao e possivel promover usuario banido' });

    await query("UPDATE users SET role = 'admin' WHERE id = $1", [id]);
    res.json({ message: 'Usuario promovido a admin' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao promover usuario' });
  }
};

exports.demoteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.userId) {
      return res.status(400).json({ error: 'Voce nao pode rebaixar a si mesmo' });
    }

    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });

    await query("UPDATE users SET role = 'user' WHERE id = $1", [id]);
    res.json({ message: 'Admin rebaixado para usuario' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao rebaixar usuario' });
  }
};

exports.changePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Plano invalido' });
    }

    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });

    await query('UPDATE users SET plan = $1 WHERE id = $2', [plan, id]);
    res.json({ message: `Plano alterado para ${plan}` });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar plano' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.userId) {
      return res.status(400).json({ error: 'Voce nao pode deletar a si mesmo' });
    }

    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'Usuario nao encontrado' });

    await query('DELETE FROM contact_tags WHERE contact_id IN (SELECT id FROM contacts WHERE user_id = $1)', [id]);
    await query('DELETE FROM deal_history WHERE deal_id IN (SELECT id FROM deals WHERE user_id = $1)', [id]);
    await query('DELETE FROM activities WHERE user_id = $1', [id]);
    await query('DELETE FROM deals WHERE user_id = $1', [id]);
    await query('DELETE FROM contacts WHERE user_id = $1', [id]);
    await query('DELETE FROM tags WHERE user_id = $1', [id]);
    await query('DELETE FROM email_templates WHERE user_id = $1', [id]);
    await query('DELETE FROM automations WHERE user_id = $1', [id]);
    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Usuario e todos os dados deletados' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar usuario' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (parseInt(id) === req.userId) {
      return res.status(400).json({ error: 'Voce nao pode alterar seu proprio cargo' });
    }

    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Cargo invalido' });
    }

    await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.json({ message: `Cargo alterado para ${role}` });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar cargo' });
  }
};
