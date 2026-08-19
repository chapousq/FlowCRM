const db = require('../database');
const automationController = require('./automationController');

exports.list = (req, res) => {
  const deals = db.prepare(`
    SELECT d.*, c.name as contact_name, c.company as contact_company
    FROM deals d
    LEFT JOIN contacts c ON d.contact_id = c.id
    WHERE d.user_id = ?
    ORDER BY d.created_at DESC
  `).all(req.userId);
  res.json(deals);
};

exports.get = (req, res) => {
  const deal = db.prepare(`
    SELECT d.*, c.name as contact_name, c.company as contact_company
    FROM deals d
    LEFT JOIN contacts c ON d.contact_id = c.id
    WHERE d.id = ? AND d.user_id = ?
  `).get(req.params.id, req.userId);
  if (!deal) return res.status(404).json({ error: 'Negócio não encontrado' });
  const history = db.prepare('SELECT * FROM deal_history WHERE deal_id = ? ORDER BY changed_at DESC').all(req.params.id);
  res.json({ ...deal, history });
};

exports.create = (req, res) => {
  const { title, contact_id, value, stage, probability, expected_close, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

  const result = db.prepare(
    'INSERT INTO deals (user_id, contact_id, title, value, stage, probability, expected_close, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, contact_id || null, title, value || 0, stage || 'lead', probability || 10, expected_close || null, notes || '');

  db.prepare('INSERT INTO deal_history (deal_id, new_stage) VALUES (?, ?)').run(result.lastInsertRowid, stage || 'lead');

  automationController.executeTrigger('new_deal', '', req.userId, {
    deal_id: result.lastInsertRowid,
    deal_title: title,
    contact_id: contact_id || null,
  });

  const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(deal);
};

exports.update = (req, res) => {
  const existing = db.prepare('SELECT * FROM deals WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Negócio não encontrado' });

  const { title, contact_id, value, stage, probability, expected_close, notes, loss_reason } = req.body;

  const newStage = stage || existing.stage;
  const stageChanged = newStage !== existing.stage;

  db.prepare(
    'UPDATE deals SET title=?, contact_id=?, value=?, stage=?, probability=?, expected_close=?, notes=?, loss_reason=?, closed_at=CASE WHEN ? IN (\'won\',\'lost\') THEN CURRENT_TIMESTAMP ELSE closed_at END WHERE id=?'
  ).run(
    title || existing.title,
    contact_id !== undefined ? contact_id : existing.contact_id,
    value ?? existing.value,
    newStage,
    probability ?? existing.probability,
    expected_close || existing.expected_close,
    notes !== undefined ? notes : existing.notes,
    loss_reason || existing.loss_reason,
    newStage,
    req.params.id
  );

  if (stageChanged) {
    db.prepare('INSERT INTO deal_history (deal_id, old_stage, new_stage) VALUES (?, ?, ?)').run(req.params.id, existing.stage, newStage);

    automationController.executeTrigger('stage_changed', newStage, req.userId, {
      deal_id: parseInt(req.params.id),
      deal_title: title || existing.title,
      contact_id: existing.contact_id,
    });

    if (newStage === 'won') {
      automationController.executeTrigger('deal_won', '', req.userId, {
        deal_id: parseInt(req.params.id),
        deal_title: title || existing.title,
        contact_id: existing.contact_id,
      });
    }
    if (newStage === 'lost') {
      automationController.executeTrigger('deal_lost', '', req.userId, {
        deal_id: parseInt(req.params.id),
        deal_title: title || existing.title,
        contact_id: existing.contact_id,
      });
    }
  }

  const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  res.json(deal);
};

exports.delete = (req, res) => {
  const existing = db.prepare('SELECT * FROM deals WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Negócio não encontrado' });

  db.prepare('DELETE FROM deal_history WHERE deal_id = ?').run(req.params.id);
  db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id);
  res.json({ message: 'Negócio removido' });
};
