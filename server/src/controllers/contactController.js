const { query } = require('../database');
const automationController = require('./automationController');

async function calculateScore(contact) {
  let score = 0;
  if (contact.email) score += 10;
  if (contact.phone) score += 15;
  if (contact.company) score += 20;
  if (contact.role) score += 10;
  if (contact.value > 0) score += Math.min(30, Math.floor(contact.value / 1000) * 5);
  const deals = (await query('SELECT COUNT(*) as c FROM deals WHERE contact_id = $1', [contact.id])).rows[0];
  score += Math.min(25, deals.c * 5);
  const activities = (await query('SELECT COUNT(*) as c FROM activities WHERE contact_id = $1 AND completed = true', [contact.id])).rows[0];
  score += Math.min(20, activities.c * 5);
  return Math.min(100, score);
}

exports.list = async (req, res) => {
  try {
    const contacts = (await query('SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC', [req.userId])).rows;
    const contactsWithTags = await Promise.all(contacts.map(async (c) => {
      const tags = (await query('SELECT t.* FROM tags t JOIN contact_tags ct ON t.id = ct.tag_id WHERE ct.contact_id = $1', [c.id])).rows;
      return { ...c, tags };
    }));
    res.json(contactsWithTags);
  } catch (err) {
    console.error('List contacts error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.get = async (req, res) => {
  try {
    const contact = (await query('SELECT * FROM contacts WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])).rows[0];
    if (!contact) return res.status(404).json({ error: 'Contato não encontrado' });
    const tags = (await query('SELECT t.* FROM tags t JOIN contact_tags ct ON t.id = ct.tag_id WHERE ct.contact_id = $1', [req.params.id])).rows;
    const deals = (await query('SELECT * FROM deals WHERE contact_id = $1', [req.params.id])).rows;
    const activities = (await query('SELECT * FROM activities WHERE contact_id = $1 ORDER BY created_at DESC', [req.params.id])).rows;
    res.json({ ...contact, tags, deals, activities });
  } catch (err) {
    console.error('Get contact error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, phone, company, role, status, value, source, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const result = (await query(
      'INSERT INTO contacts (user_id, name, email, phone, company, role, status, value, source, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [req.userId, name, email || '', phone || '', company || '', role || '', status || 'lead', value || 0, source || '', notes || '']
    ));

    const contact = result.rows[0];
    contact.score = await calculateScore(contact);
    await query('UPDATE contacts SET score = $1 WHERE id = $2', [contact.score, contact.id]);

    automationController.executeTrigger('new_contact', '', req.userId, { contact_name: name, contact_id: contact.id });

    res.status(201).json(contact);
  } catch (err) {
    console.error('Create contact error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, email, phone, company, role, status, value, source, notes } = req.body;
    const existing = (await query('SELECT * FROM contacts WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Contato não encontrado' });

    await query(
      'UPDATE contacts SET name=$1, email=$2, phone=$3, company=$4, role=$5, status=$6, value=$7, source=$8, notes=$9, last_contact=NOW() WHERE id=$10',
      [name || existing.name, email || existing.email, phone || existing.phone, company || existing.company, role || existing.role, status || existing.status, value ?? existing.value, source || existing.source, notes !== undefined ? notes : existing.notes, req.params.id]
    );

    const contact = (await query('SELECT * FROM contacts WHERE id = $1', [req.params.id])).rows[0];
    contact.score = await calculateScore(contact);
    await query('UPDATE contacts SET score = $1 WHERE id = $2', [contact.score, contact.id]);

    res.json(contact);
  } catch (err) {
    console.error('Update contact error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.delete = async (req, res) => {
  try {
    const existing = (await query('SELECT * FROM contacts WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Contato não encontrado' });

    await query('DELETE FROM contact_tags WHERE contact_id = $1', [req.params.id]);
    await query('DELETE FROM contacts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Contato removido' });
  } catch (err) {
    console.error('Delete contact error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.importCSV = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !rows.length) return res.status(400).json({ error: 'Nenhum dado para importar' });

    let imported = 0;
    for (const row of rows) {
      const name = row[0];
      if (!name) continue;
      await query(
        'INSERT INTO contacts (user_id, name, email, phone, company, role, status, value, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [req.userId, name, row[1] || '', row[2] || '', row[3] || '', row[4] || '', row[5] || 'lead', parseFloat(row[6]) || 0, 'csv_import']
      );
      imported++;
    }
    res.json({ imported });
  } catch (err) {
    console.error('Import CSV error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
