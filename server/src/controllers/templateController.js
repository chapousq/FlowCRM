const db = require('../database');

exports.list = (req, res) => {
  const templates = db.prepare('SELECT * FROM email_templates WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(templates);
};

exports.create = (req, res) => {
  const { name, subject, body, category } = req.body;
  if (!name || !subject || !body) return res.status(400).json({ error: 'Nome, assunto e corpo são obrigatórios' });
  const result = db.prepare('INSERT INTO email_templates (user_id, name, subject, body, category) VALUES (?, ?, ?, ?, ?)').run(req.userId, name, subject, body, category || 'geral');
  const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(template);
};

exports.update = (req, res) => {
  const existing = db.prepare('SELECT * FROM email_templates WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Template não encontrado' });
  const { name, subject, body, category } = req.body;
  db.prepare('UPDATE email_templates SET name=?, subject=?, body=?, category=? WHERE id=?').run(name || existing.name, subject || existing.subject, body || existing.body, category || existing.category, req.params.id);
  res.json(db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id));
};

exports.delete = (req, res) => {
  db.prepare('DELETE FROM email_templates WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ message: 'Template removido' });
};
