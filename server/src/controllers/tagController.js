const { query } = require('../database');

exports.list = async (req, res) => {
  try {
    const result = await query('SELECT * FROM tags WHERE user_id = $1 ORDER BY name', [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar tags' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const result = await query(
      'INSERT INTO tags (user_id, name, color) VALUES ($1, $2, $3) RETURNING id',
      [req.userId, name, color || '#4f46e5']
    );
    res.status(201).json({ id: result.rows[0].id, name, color: color || '#4f46e5' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar tag' });
  }
};

exports.delete = async (req, res) => {
  try {
    await query('DELETE FROM tags WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Tag removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar tag' });
  }
};

exports.addToContact = async (req, res) => {
  try {
    const { contact_id, tag_id } = req.body;
    await query('INSERT INTO contact_tags (contact_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [contact_id, tag_id]);
    res.json({ message: 'Tag adicionada' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar tag' });
  }
};

exports.removeFromContact = async (req, res) => {
  try {
    const { contact_id, tag_id } = req.params;
    await query('DELETE FROM contact_tags WHERE contact_id = $1 AND tag_id = $2', [contact_id, tag_id]);
    res.json({ message: 'Tag removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover tag' });
  }
};

exports.getContactTags = async (req, res) => {
  try {
    const result = await query(`
      SELECT t.* FROM tags t
      JOIN contact_tags ct ON t.id = ct.tag_id
      WHERE ct.contact_id = $1
    `, [req.params.contactId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar tags do contato' });
  }
};
