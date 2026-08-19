const db = require('../database');

exports.list = (req, res) => {
  const activities = db.prepare(`
    SELECT a.*, c.name as contact_name
    FROM activities a
    LEFT JOIN contacts c ON a.contact_id = c.id
    WHERE a.user_id = ?
    ORDER BY a.due_date ASC, a.created_at DESC
  `).all(req.userId);
  res.json(activities);
};

exports.create = (req, res) => {
  const { type, title, description, contact_id, deal_id, due_date } = req.body;
  if (!type || !title) return res.status(400).json({ error: 'Tipo e título são obrigatórios' });

  const result = db.prepare(
    'INSERT INTO activities (user_id, type, title, description, contact_id, deal_id, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, type, title, description || '', contact_id || null, deal_id || null, due_date || null);

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(activity);
};

exports.update = (req, res) => {
  const existing = db.prepare('SELECT * FROM activities WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Atividade não encontrada' });

  const { completed } = req.body;
  db.prepare('UPDATE activities SET completed = ? WHERE id = ?').run(completed ? 1 : 0, req.params.id);

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  res.json(activity);
};

exports.delete = (req, res) => {
  const existing = db.prepare('SELECT * FROM activities WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Atividade não encontrada' });

  db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  res.json({ message: 'Atividade removida' });
};
