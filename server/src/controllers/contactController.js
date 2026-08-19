const db = require('../database');
const automationController = require('./automationController');

function calculateScore(contact) {
  let score = 0;
  if (contact.email) score += 10;
  if (contact.phone) score += 15;
  if (contact.company) score += 20;
  if (contact.role) score += 10;
  if (contact.value > 0) score += Math.min(30, Math.floor(contact.value / 1000) * 5);
  const deals = db.prepare('SELECT COUNT(*) as c FROM deals WHERE contact_id = ?').get(contact.id);
  score += Math.min(25, deals.c * 5);
  const activities = db.prepare('SELECT COUNT(*) as c FROM activities WHERE contact_id = ? AND completed = 1').get(contact.id);
  score += Math.min(20, activities.c * 5);
  return Math.min(100, score);
}

exports.list = (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  const contactsWithTags = contacts.map(c => {
    const tags = db.prepare('SELECT t.* FROM tags t JOIN contact_tags ct ON t.id = ct.tag_id WHERE ct.contact_id = ?').all(c.id);
    return { ...c, tags };
  });
  res.json(contactsWithTags);
};

exports.get = (req, res) => {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!contact) return res.status(404).json({ error: 'Contato não encontrado' });
  const tags = db.prepare('SELECT t.* FROM tags t JOIN contact_tags ct ON t.id = ct.tag_id WHERE ct.contact_id = ?').all(req.params.id);
  const deals = db.prepare('SELECT * FROM deals WHERE contact_id = ?').all(req.params.id);
  const activities = db.prepare('SELECT * FROM activities WHERE contact_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ ...contact, tags, deals, activities });
};

exports.create = (req, res) => {
  const { name, email, phone, company, role, status, value, source, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

  const result = db.prepare(
    'INSERT INTO contacts (user_id, name, email, phone, company, role, status, value, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, name, email || '', phone || '', company || '', role || '', status || 'lead', value || 0, source || '', notes || '');

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
  contact.score = calculateScore(contact);
  db.prepare('UPDATE contacts SET score = ? WHERE id = ?').run(contact.score, contact.id);

  automationController.executeTrigger('new_contact', '', req.userId, { contact_name: name, contact_id: contact.id });

  res.status(201).json(contact);
};

exports.update = (req, res) => {
  const { name, email, phone, company, role, status, value, source, notes } = req.body;
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Contato não encontrado' });

  db.prepare(
    'UPDATE contacts SET name=?, email=?, phone=?, company=?, role=?, status=?, value=?, source=?, notes=?, last_contact=CURRENT_TIMESTAMP WHERE id=?'
  ).run(name || existing.name, email || existing.email, phone || existing.phone, company || existing.company, role || existing.role, status || existing.status, value ?? existing.value, source || existing.source, notes !== undefined ? notes : existing.notes, req.params.id);

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  contact.score = calculateScore(contact);
  db.prepare('UPDATE contacts SET score = ? WHERE id = ?').run(contact.score, contact.id);

  res.json(contact);
};

exports.delete = (req, res) => {
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Contato não encontrado' });

  db.prepare('DELETE FROM contact_tags WHERE contact_id = ?').run(req.params.id);
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Contato removido' });
};

exports.importCSV = (req, res) => {
  const { rows } = req.body;
  if (!rows || !rows.length) return res.status(400).json({ error: 'Nenhum dado para importar' });

  let imported = 0;
  for (const row of rows) {
    const name = row[0];
    if (!name) continue;
    db.prepare(
      'INSERT INTO contacts (user_id, name, email, phone, company, role, status, value, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.userId, name, row[1] || '', row[2] || '', row[3] || '', row[4] || '', row[5] || 'lead', parseFloat(row[6]) || 0, 'csv_import');
    imported++;
  }
  res.json({ imported });
};
