const db = require('../database');

exports.list = (req, res) => {
  const tags = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name').all(req.userId);
  res.json(tags);
};

exports.create = (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  const result = db.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(req.userId, name, color || '#4f46e5');
  res.status(201).json({ id: result.lastInsertRowid, name, color: color || '#4f46e5' });
};

exports.delete = (req, res) => {
  db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ message: 'Tag removida' });
};

exports.addToContact = (req, res) => {
  const { contact_id, tag_id } = req.body;
  try {
    db.prepare('INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)').run(contact_id, tag_id);
    res.json({ message: 'Tag adicionada' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar tag' });
  }
};

exports.removeFromContact = (req, res) => {
  const { contact_id, tag_id } = req.params;
  db.prepare('DELETE FROM contact_tags WHERE contact_id = ? AND tag_id = ?').run(contact_id, tag_id);
  res.json({ message: 'Tag removida' });
};

exports.getContactTags = (req, res) => {
  const tags = db.prepare(`
    SELECT t.* FROM tags t
    JOIN contact_tags ct ON t.id = ct.tag_id
    WHERE ct.contact_id = ?
  `).all(req.params.contactId);
  res.json(tags);
};
