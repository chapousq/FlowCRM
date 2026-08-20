const { query } = require('../database');

exports.list = async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, c.name as contact_name
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      WHERE a.user_id = $1
      ORDER BY a.due_date ASC, a.created_at DESC
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar atividades' });
  }
};

exports.create = async (req, res) => {
  try {
    const { type, title, description, contact_id, deal_id, due_date } = req.body;
    if (!type || !title) return res.status(400).json({ error: 'Tipo e título são obrigatórios' });

    const result = await query(
      'INSERT INTO activities (user_id, type, title, description, contact_id, deal_id, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [req.userId, type, title, description || '', contact_id || null, deal_id || null, due_date || null]
    );

    const activity = await query('SELECT * FROM activities WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(activity.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar atividade' });
  }
};

exports.update = async (req, res) => {
  try {
    const existing = await query('SELECT * FROM activities WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Atividade não encontrada' });

    const { completed } = req.body;
    await query('UPDATE activities SET completed = $1 WHERE id = $2', [completed ? true : false, req.params.id]);

    const activity = await query('SELECT * FROM activities WHERE id = $1', [req.params.id]);
    res.json(activity.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar atividade' });
  }
};

exports.delete = async (req, res) => {
  try {
    const existing = await query('SELECT * FROM activities WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Atividade não encontrada' });

    await query('DELETE FROM activities WHERE id = $1', [req.params.id]);
    res.json({ message: 'Atividade removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar atividade' });
  }
};
