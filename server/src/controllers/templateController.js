const { query } = require('../database');

exports.list = async (req, res) => {
  try {
    const result = await query('SELECT * FROM email_templates WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar templates' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, subject, body, category } = req.body;
    if (!name || !subject || !body) return res.status(400).json({ error: 'Nome, assunto e corpo são obrigatórios' });
    const result = await query(
      'INSERT INTO email_templates (user_id, name, subject, body, category) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.userId, name, subject, body, category || 'geral']
    );
    const template = await query('SELECT * FROM email_templates WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(template.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar template' });
  }
};

exports.update = async (req, res) => {
  try {
    const existing = await query('SELECT * FROM email_templates WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Template não encontrado' });
    const { name, subject, body, category } = req.body;
    await query(
      'UPDATE email_templates SET name=$1, subject=$2, body=$3, category=$4 WHERE id=$5',
      [name || existing.rows[0].name, subject || existing.rows[0].subject, body || existing.rows[0].body, category || existing.rows[0].category, req.params.id]
    );
    const updated = await query('SELECT * FROM email_templates WHERE id = $1', [req.params.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
};

exports.delete = async (req, res) => {
  try {
    await query('DELETE FROM email_templates WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Template removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar template' });
  }
};
